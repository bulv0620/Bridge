import crypto from 'crypto'
import express from 'express'
import fs from 'fs'
import http from 'http'
import path from 'path'
import { Transform } from 'stream'
import { pipeline } from 'stream/promises'
import { BrowserWindow, dialog } from 'electron'
import { ClipboardManager } from './ClipboardManager'
import { capabilities, downloadPath, httpPort, locale } from '../../../config'
import { getWindow } from '../../../utils/window'
import { formatBytes } from '../../../utils/format'
import { remoteRef, RemoteRefMain } from '../../../utils/remoteRef'
import { messages } from '../../../locales'
import { createLogger, shortId } from '../../../services/logging'

const FILE_TRANSFER_PROTOCOL = 2
const MAX_BATCH_BODY_BYTES = 256 * 1024
const MAX_BATCH_FILES = 256
const MAX_CONFIRMATIONS = 3
const AUTHORIZATION_TTL_MS = 10 * 60 * 1000
const AUTHORIZATION_CLEANUP_INTERVAL_MS = 30 * 1000
const STALE_TEMP_FILE_AGE_MS = 24 * 60 * 60 * 1000
const RENDERER_NAVIGATION_TIMEOUT_MS = 1500
const TEMP_FILE_PATTERN =
  /^\.bridge-transfer-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.part$/iu
const WINDOWS_RESERVED_NAME = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/iu

type AuthorizationState = 'pending' | 'receiving'

interface ValidatedFileBatch {
  device: DeviceInfo
  files: FileBatchItemRequest[]
}

interface UploadAuthorization {
  id: string
  batchId: string
  fileId: string
  tokenHash: Buffer
  sourceIp: string
  file: FileBatchItemRequest
  device: DeviceInfo
  downloadRoot: string
  createdAt: number
  expiresAt: number
  state: AuthorizationState
}

interface ActiveUpload {
  request: express.Request
  tempPath: string
}

class TransferProtocolError extends Error {
  constructor(
    readonly code: FileTransferErrorCode,
    message = code,
  ) {
    super(message)
  }
}

export class ShareServer {
  private app = express()
  private server?: http.Server
  private receivingMap = new Map<string, ReceivingItem>()
  private authorizations = new Map<string, UploadAuthorization>()
  private activeUploads = new Map<string, ActiveUpload>()
  private receivingList: RemoteRefMain<ReceivingItem[]> = remoteRef('receiving-list', [], {
    readOnly: true,
  })
  private receivedList: RemoteRefMain<ReceivedItem[]> = remoteRef('received-list', [], {
    readOnly: true,
  })
  private pendingNavigation = new Map<string, { resolve: () => void; timer: NodeJS.Timeout }>()
  private logger = createLogger('share')
  private confirmationCount = 0
  private confirmationChain: Promise<unknown> = Promise.resolve()
  private authorizationCleanupTimer?: NodeJS.Timeout
  private stopping = false

  constructor(private clipboardManager: ClipboardManager) {
    this.app.get('/api/clipboard/:v', this.clipboardHandler.bind(this))
    this.app.post(
      '/api/file-batches',
      express.json({ limit: MAX_BATCH_BODY_BYTES, strict: true }),
      this.requestFileBatchHandler.bind(this),
    )
    this.app.put('/api/file-batches/:batchId/files/:fileId', this.uploadFileHandler.bind(this))

    this.app.use(
      (
        error: unknown,
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction,
      ) => {
        const bodyError = error as { type?: string; status?: number }
        const code: FileTransferErrorCode =
          bodyError.type === 'entity.too.large' ? 'REQUEST_TOO_LARGE' : 'INVALID_REQUEST'
        this.logger.warn('share.request.invalid_body', { code })
        this.sendError(res, bodyError.status === 413 ? 413 : 400, code)
      },
    )
  }

  acknowledgeIncomingBatchNavigation(requestId: unknown) {
    if (typeof requestId !== 'string') return false
    const pending = this.pendingNavigation.get(requestId)
    if (!pending) return false

    clearTimeout(pending.timer)
    this.pendingNavigation.delete(requestId)
    pending.resolve()
    return true
  }

  deleteReceivedTask(taskId: unknown) {
    if (typeof taskId !== 'string') return false
    let removed = false
    this.receivedList.update((list) => {
      const index = list.findIndex((item) => item.id === taskId)
      if (index >= 0) {
        list.splice(index, 1)
        removed = true
      }
    })
    return removed
  }

  private clipboardHandler(req: express.Request, res: express.Response) {
    const { v } = req.params
    const clipboardHistory = this.clipboardManager.clipboardHistory
    const clipboardItem = clipboardHistory.value.find((item) => item.v === v)

    if (!clipboardItem) {
      this.logger.warn('share.clipboard.request_not_found', {
        clipboardId: shortId(v),
      })
      res.status(404).end()
      return
    }

    const { mime, text, path: clipboardPath } = clipboardItem
    this.logger.debug('share.clipboard.requested', {
      clipboardId: shortId(v),
      mime,
      size:
        text != null
          ? Buffer.byteLength(text)
          : clipboardPath && fs.existsSync(clipboardPath)
            ? fs.statSync(clipboardPath).size
            : 0,
    })
    res.setHeader('Content-Type', mime)

    if (text != null) {
      res.send(text)
      return
    }
    if (clipboardPath) {
      if (!fs.existsSync(clipboardPath)) {
        res.status(410).end()
        return
      }
      res.sendFile(clipboardPath)
      return
    }
    res.status(500).end()
  }

  private async requestFileBatchHandler(req: express.Request, res: express.Response) {
    let batch: ValidatedFileBatch
    try {
      batch = this.validateFileBatch(req.body)
    } catch {
      this.logger.warn('share.receive.batch_invalid')
      this.sendError(res, 400, 'INVALID_REQUEST')
      return
    }

    if (!capabilities.value.includes('file-push-v2')) {
      this.logger.info('share.receive.batch_rejected', {
        reason: 'file_push_disabled',
        fileCount: batch.files.length,
        totalSize: this.totalSize(batch.files),
        sourceDeviceId: shortId(batch.device.id),
      })
      this.sendError(res, 403, 'FILE_PUSH_DISABLED')
      return
    }

    if (this.confirmationCount >= MAX_CONFIRMATIONS) {
      this.logger.warn('share.receive.batch_busy', {
        sourceDeviceId: shortId(batch.device.id),
      })
      this.sendError(res, 429, 'RECEIVER_BUSY')
      return
    }

    this.confirmationCount += 1
    let allowed = false
    try {
      allowed = await this.enqueueConfirmation(() =>
        req.aborted || res.destroyed ? Promise.resolve(false) : this.confirmReceiveBatch(batch),
      )
    } finally {
      this.confirmationCount -= 1
    }

    if (req.aborted || res.destroyed) return
    if (!allowed) {
      this.logger.info('share.receive.batch_rejected', {
        reason: 'user_rejected',
        fileCount: batch.files.length,
        totalSize: this.totalSize(batch.files),
        sourceDeviceId: shortId(batch.device.id),
      })
      this.sendError(res, 403, 'BATCH_REJECTED')
      return
    }
    let root: string
    try {
      root = await this.prepareDownloadRoot()
    } catch (error) {
      this.logger.error('share.receive.download_root_failed', error)
      this.sendError(res, 500, 'WRITE_FAILED')
      return
    }

    const sourceIp = this.normalizeIp(req.socket.remoteAddress)
    const batchId = crypto.randomUUID()
    const createdAt = Date.now()
    const grants: FileUploadGrant[] = []

    for (const file of batch.files) {
      const id = crypto.randomUUID()
      const token = crypto.randomBytes(32).toString('base64url')
      const authorization: UploadAuthorization = {
        id,
        batchId,
        fileId: file.fileId,
        tokenHash: this.hashToken(token),
        sourceIp,
        file,
        device: batch.device,
        downloadRoot: root,
        createdAt,
        expiresAt: createdAt + AUTHORIZATION_TTL_MS,
        state: 'pending',
      }
      this.authorizations.set(this.authorizationKey(batchId, file.fileId), authorization)
      this.receivingMap.set(id, this.toReceivingItem(authorization))
      grants.push({ fileId: file.fileId, token })
    }

    this.syncReceivingList()
    getWindow('main')?.webContents.send('share:incoming-batch-accepted')
    this.logger.info('share.receive.batch_accepted', {
      batchId: shortId(batchId),
      fileCount: batch.files.length,
      totalSize: this.totalSize(batch.files),
      sourceDeviceId: shortId(batch.device.id),
    })

    const response: FileBatchResponse = {
      protocol: FILE_TRANSFER_PROTOCOL,
      batchId,
      uploads: grants,
    }
    res.json(response)
  }

  private async uploadFileHandler(req: express.Request, res: express.Response) {
    const { batchId, fileId } = req.params
    const key = this.authorizationKey(batchId, fileId)
    const authorization = this.authorizations.get(key)

    if (!authorization) {
      this.sendError(res, 404, 'TRANSFER_NOT_FOUND')
      return
    }
    if (
      authorization.sourceIp !== this.normalizeIp(req.socket.remoteAddress) ||
      !this.isAuthorized(req, authorization)
    ) {
      this.sendError(res, 403, 'TRANSFER_UNAUTHORIZED')
      return
    }
    if (authorization.state !== 'pending') {
      this.sendError(res, 409, 'TRANSFER_ALREADY_STARTED')
      return
    }
    if (authorization.expiresAt <= Date.now()) {
      this.expireAuthorization(key, authorization)
      this.sendError(res, 410, 'TRANSFER_EXPIRED')
      return
    }

    const contentLength = this.parseContentLength(req.headers['content-length'])
    if (contentLength == null) {
      this.sendError(res, 411, 'LENGTH_REQUIRED')
      return
    }
    if (contentLength !== authorization.file.size) {
      this.sendError(res, 400, 'LENGTH_MISMATCH')
      return
    }

    authorization.state = 'receiving'
    const receivingItem = this.receivingMap.get(authorization.id)
    if (!receivingItem) {
      this.sendError(res, 404, 'TRANSFER_NOT_FOUND')
      return
    }
    receivingItem.status = 'receiving'
    this.syncReceivingList()

    const tempPath = path.join(
      authorization.downloadRoot,
      `.bridge-transfer-${authorization.id}.part`,
    )
    this.activeUploads.set(authorization.id, { request: req, tempPath })

    let transferred = 0
    let lastSyncAt = 0
    const startedAt = Date.now()
    const byteCounter = new Transform({
      transform: (chunk: Buffer, _encoding, callback) => {
        transferred += chunk.length
        if (transferred > authorization.file.size) {
          callback(new TransferProtocolError('LENGTH_MISMATCH'))
          return
        }

        const elapsed = Math.max((Date.now() - startedAt) / 1000, 0.001)
        receivingItem.progress = {
          transferred,
          total: authorization.file.size,
          percentage: authorization.file.size === 0 ? 0 : transferred / authorization.file.size,
          speed: transferred / elapsed,
          eta:
            transferred > 0
              ? (authorization.file.size - transferred) / (transferred / elapsed)
              : undefined,
        }
        if (Date.now() - lastSyncAt >= 100) {
          lastSyncAt = Date.now()
          this.syncReceivingList()
        }
        callback(null, chunk)
      },
    })

    try {
      const writeStream = fs.createWriteStream(tempPath, { flags: 'wx' })
      await pipeline(req, byteCounter, writeStream)
      if (transferred !== authorization.file.size) {
        throw new TransferProtocolError('LENGTH_MISMATCH')
      }

      const savePath = await this.commitTempFile(
        tempPath,
        authorization.downloadRoot,
        authorization.file.filename,
      )
      receivingItem.status = 'received'
      receivingItem.progress = {
        transferred,
        total: authorization.file.size,
        percentage: 1,
        speed: transferred / Math.max((Date.now() - startedAt) / 1000, 0.001),
        eta: 0,
      }
      this.receivingMap.delete(authorization.id)
      this.syncReceivingList()
      this.receivedList.update((list) => {
        list.unshift({
          id: authorization.id,
          batchId: authorization.batchId,
          fileId: authorization.fileId,
          meta: this.toFileMeta(authorization),
          result: 'success',
          save: {
            path: savePath,
            filename: path.basename(savePath),
            size: authorization.file.size,
          },
          createdAt: authorization.createdAt,
          finishedAt: Date.now(),
        })
      })

      this.logger.info('share.receive.completed', {
        batchId: shortId(authorization.batchId),
        transferId: shortId(authorization.id),
        size: authorization.file.size,
        durationMs: Date.now() - startedAt,
        sourceDeviceId: shortId(authorization.device.id),
      })
      res.json({ success: true })
    } catch (error) {
      await this.removeTempFile(tempPath)
      const cancelled = req.aborted || this.stopping
      const code =
        error instanceof TransferProtocolError
          ? error.code
          : cancelled
            ? 'CANCELLED'
            : 'WRITE_FAILED'
      this.finishReceivingWithError(authorization, cancelled ? 'cancelled' : 'failed', code)
      this.logger.error('share.receive.failed', error, {
        batchId: shortId(authorization.batchId),
        transferId: shortId(authorization.id),
        size: authorization.file.size,
        transferred,
        reason: code,
        durationMs: Date.now() - startedAt,
      })
      if (!res.headersSent && !res.destroyed) {
        this.sendError(res, code === 'LENGTH_MISMATCH' ? 400 : 500, code)
      }
    } finally {
      this.activeUploads.delete(authorization.id)
      this.authorizations.delete(key)
    }
  }

  start() {
    if (this.server) return

    this.stopping = false
    this.server = this.app.listen(httpPort.value, () => {
      this.logger.info('share.server.started', { port: httpPort.value })
    })
    this.server.on('error', (error) => {
      this.logger.error('share.server.failed', error, { port: httpPort.value })
      if (this.authorizationCleanupTimer) {
        clearInterval(this.authorizationCleanupTimer)
        this.authorizationCleanupTimer = undefined
      }
      this.server = undefined
    })
    this.authorizationCleanupTimer = setInterval(
      () => this.cleanupExpiredAuthorizations(),
      AUTHORIZATION_CLEANUP_INTERVAL_MS,
    )
    void this.cleanupStaleTempFiles()
  }

  stop() {
    this.stopping = true
    for (const [requestId, pending] of this.pendingNavigation) {
      clearTimeout(pending.timer)
      this.pendingNavigation.delete(requestId)
      pending.resolve()
    }
    if (this.authorizationCleanupTimer) {
      clearInterval(this.authorizationCleanupTimer)
      this.authorizationCleanupTimer = undefined
    }

    for (const [key, authorization] of this.authorizations) {
      this.authorizations.delete(key)
      if (authorization.state === 'pending') {
        this.finishReceivingWithError(authorization, 'cancelled', 'CANCELLED')
      }
    }
    for (const active of this.activeUploads.values()) {
      active.request.destroy(new Error('share server stopped'))
      void this.removeTempFile(active.tempPath)
    }

    if (this.server) {
      this.server.close(() => {
        this.logger.info('share.server.stopped')
      })
      this.server.closeAllConnections()
      this.server = undefined
    }
  }

  private validateFileBatch(input: unknown): ValidatedFileBatch {
    if (!input || typeof input !== 'object') throw new Error('invalid batch')
    const candidate = input as Partial<FileBatchRequest>
    if (candidate.protocol !== FILE_TRANSFER_PROTOCOL) throw new Error('invalid protocol')
    if (!this.isValidDevice(candidate.device)) throw new Error('invalid device')
    if (
      !Array.isArray(candidate.files) ||
      candidate.files.length < 1 ||
      candidate.files.length > MAX_BATCH_FILES
    ) {
      throw new Error('invalid files')
    }

    const fileIds = new Set<string>()
    const files = candidate.files.map((file) => {
      if (!this.isValidBatchFile(file) || fileIds.has(file.fileId)) {
        throw new Error('invalid file')
      }
      fileIds.add(file.fileId)
      return {
        fileId: file.fileId,
        filename: file.filename,
        size: file.size,
        ...(file.mime ? { mime: file.mime } : {}),
      }
    })
    this.totalSize(files)
    return { device: candidate.device, files }
  }

  private isValidDevice(device: unknown): device is DeviceInfo {
    if (!device || typeof device !== 'object') return false
    const candidate = device as Partial<DeviceInfo>
    return (
      this.isBoundedText(candidate.id, 128) &&
      this.isBoundedText(candidate.name, 255) &&
      this.isBoundedText(candidate.platform, 32)
    )
  }

  private isValidBatchFile(file: unknown): file is FileBatchItemRequest {
    if (!file || typeof file !== 'object') return false
    const candidate = file as Partial<FileBatchItemRequest>
    return (
      typeof candidate.fileId === 'string' &&
      /^[A-Za-z0-9_-]{1,128}$/u.test(candidate.fileId) &&
      this.isValidFilename(candidate.filename) &&
      Number.isSafeInteger(candidate.size) &&
      Number(candidate.size) >= 0 &&
      (candidate.mime == null || this.isBoundedText(candidate.mime, 255))
    )
  }

  private isValidFilename(filename: unknown): filename is string {
    if (typeof filename !== 'string' || filename === '.' || filename === '..') return false
    if (
      filename.length < 1 ||
      Buffer.byteLength(filename, 'utf8') > 255 ||
      /[/\\]/u.test(filename) ||
      this.hasControlCharacters(filename)
    ) {
      return false
    }
    if (process.platform === 'win32') {
      if (/[<>:"|?*]/u.test(filename) || /[ .]$/u.test(filename)) return false
      if (WINDOWS_RESERVED_NAME.test(filename)) return false
    }
    return path.basename(filename) === filename && !path.isAbsolute(filename)
  }

  private isBoundedText(value: unknown, maxLength: number): value is string {
    return (
      typeof value === 'string' &&
      value.length > 0 &&
      value.length <= maxLength &&
      !this.hasControlCharacters(value)
    )
  }

  private hasControlCharacters(value: string) {
    return Array.from(value).some((character) => {
      const code = character.charCodeAt(0)
      return code <= 31 || code === 127
    })
  }

  private totalSize(files: Array<Pick<FileBatchItemRequest, 'size'>>) {
    let total = 0
    for (const file of files) {
      total += file.size
      if (!Number.isSafeInteger(total)) throw new Error('total size overflow')
    }
    return total
  }

  private enqueueConfirmation<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.confirmationChain.then(operation, operation)
    this.confirmationChain = result.then(
      () => undefined,
      () => undefined,
    )
    return result
  }

  private async confirmReceiveBatch(batch: ValidatedFileBatch): Promise<boolean> {
    const win = getWindow('main')
    if (win) {
      if (win.isMinimized()) win.restore()
      win.show()
      win.focus()
      await this.prepareIncomingBatchView(win)
    }
    const t = messages[locale.value].share
    const visibleFiles = batch.files.slice(0, 5).map((file) => file.filename)
    const remaining = batch.files.length - visibleFiles.length
    const fileSummary =
      visibleFiles.join('\n') +
      (remaining > 0 ? `\n${t.detail.more.replace('{count}', String(remaining))}` : '')
    const options = {
      type: 'question' as const,
      buttons: [t.accept, t.reject],
      defaultId: 0,
      cancelId: 1,
      title: t.title,
      message: t.batchMessage.replace('{count}', String(batch.files.length)),
      detail:
        `${t.detail.from}: ${batch.device.name}\n` +
        `${t.detail.count}: ${batch.files.length}\n` +
        `${t.detail.size}: ${formatBytes(this.totalSize(batch.files))}\n\n` +
        fileSummary,
    }
    const { response } = win
      ? await dialog.showMessageBox(win, options)
      : await dialog.showMessageBox(options)
    return response === 0
  }

  private prepareIncomingBatchView(win: BrowserWindow) {
    const requestId = crypto.randomUUID()
    return new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        this.pendingNavigation.delete(requestId)
        resolve()
      }, RENDERER_NAVIGATION_TIMEOUT_MS)
      this.pendingNavigation.set(requestId, { resolve, timer })
      win.webContents.send('share:incoming-batch', requestId)
    })
  }

  private async prepareDownloadRoot() {
    const root = path.resolve(downloadPath.value)
    await fs.promises.mkdir(root, { recursive: true })
    const stat = await fs.promises.stat(root)
    if (!stat.isDirectory()) throw new Error('download path is not a directory')
    return root
  }

  private toReceivingItem(authorization: UploadAuthorization): ReceivingItem {
    return {
      id: authorization.id,
      batchId: authorization.batchId,
      fileId: authorization.fileId,
      meta: this.toFileMeta(authorization),
      status: 'pending',
      progress: {
        transferred: 0,
        total: authorization.file.size,
        percentage: 0,
        speed: 0,
      },
      createdAt: authorization.createdAt,
    }
  }

  private toFileMeta(authorization: UploadAuthorization): FileMeta {
    return {
      filename: authorization.file.filename,
      size: authorization.file.size,
      mime: authorization.file.mime,
      device: authorization.device,
    }
  }

  private authorizationKey(batchId: string, fileId: string) {
    return `${batchId}:${fileId}`
  }

  private hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest()
  }

  private isAuthorized(req: express.Request, authorization: UploadAuthorization) {
    const header = req.headers.authorization
    if (typeof header !== 'string' || !header.startsWith('Bearer ')) return false
    const candidate = header.slice('Bearer '.length)
    if (!candidate) return false
    return crypto.timingSafeEqual(this.hashToken(candidate), authorization.tokenHash)
  }

  private parseContentLength(header: string | undefined) {
    if (typeof header !== 'string' || !/^(0|[1-9]\d*)$/u.test(header)) return null
    const value = Number(header)
    return Number.isSafeInteger(value) ? value : null
  }

  private normalizeIp(value: string | undefined) {
    if (!value) return ''
    return value.startsWith('::ffff:') ? value.slice(7) : value
  }

  private async commitTempFile(tempPath: string, root: string, filename: string) {
    const parsed = path.parse(filename)
    for (let index = 0; index < Number.MAX_SAFE_INTEGER; index += 1) {
      const candidateName = index === 0 ? filename : `${parsed.name} (${index})${parsed.ext}`
      const candidate = path.join(root, candidateName)
      if (path.dirname(candidate) !== root) throw new Error('invalid save path')

      try {
        await fs.promises.link(tempPath, candidate)
        await this.removeTempFile(tempPath)
        return candidate
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code
        if (code === 'EEXIST') continue
        if (code === 'EPERM' || code === 'ENOTSUP' || code === 'EOPNOTSUPP') {
          try {
            await fs.promises.copyFile(tempPath, candidate, fs.constants.COPYFILE_EXCL)
            await this.removeTempFile(tempPath)
            return candidate
          } catch (copyError) {
            if ((copyError as NodeJS.ErrnoException).code === 'EEXIST') continue
            throw copyError
          }
        }
        throw error
      }
    }
    throw new Error('unable to allocate save path')
  }

  private finishReceivingWithError(
    authorization: UploadAuthorization,
    result: Extract<ReceivedResult, 'failed' | 'cancelled' | 'expired'>,
    code: FileTransferErrorCode,
  ) {
    this.receivingMap.delete(authorization.id)
    this.syncReceivingList()
    this.receivedList.update((list) => {
      list.unshift({
        id: authorization.id,
        batchId: authorization.batchId,
        fileId: authorization.fileId,
        meta: this.toFileMeta(authorization),
        result,
        error: { message: code },
        createdAt: authorization.createdAt,
        finishedAt: Date.now(),
      })
    })
  }

  private cleanupExpiredAuthorizations() {
    for (const [key, authorization] of this.authorizations) {
      if (authorization.state === 'pending' && authorization.expiresAt <= Date.now()) {
        this.expireAuthorization(key, authorization)
      }
    }
  }

  private expireAuthorization(key: string, authorization: UploadAuthorization) {
    this.authorizations.delete(key)
    this.finishReceivingWithError(authorization, 'expired', 'TRANSFER_EXPIRED')
    this.logger.info('share.receive.authorization_expired', {
      batchId: shortId(authorization.batchId),
      transferId: shortId(authorization.id),
      size: authorization.file.size,
      sourceDeviceId: shortId(authorization.device.id),
    })
  }

  private async cleanupStaleTempFiles() {
    let root: string
    try {
      root = await this.prepareDownloadRoot()
      const entries = await fs.promises.readdir(root, { withFileTypes: true })
      const cutoff = Date.now() - STALE_TEMP_FILE_AGE_MS
      await Promise.all(
        entries
          .filter((entry) => entry.isFile() && TEMP_FILE_PATTERN.test(entry.name))
          .map(async (entry) => {
            const candidate = path.join(root, entry.name)
            const stat = await fs.promises.stat(candidate)
            if (stat.mtimeMs < cutoff) await fs.promises.rm(candidate, { force: true })
          }),
      )
    } catch (error) {
      this.logger.warn('share.receive.temp_cleanup_failed', undefined, error)
    }
  }

  private async removeTempFile(tempPath: string) {
    try {
      await fs.promises.rm(tempPath, { force: true })
    } catch (error) {
      this.logger.warn('share.receive.temp_remove_failed', undefined, error)
    }
  }

  private syncReceivingList() {
    this.receivingList.value = Array.from(this.receivingMap.values())
  }

  private sendError(res: express.Response, status: number, code: FileTransferErrorCode) {
    const body: FileTransferErrorResponse = { error: { code } }
    res.status(status).json(body)
  }
}
