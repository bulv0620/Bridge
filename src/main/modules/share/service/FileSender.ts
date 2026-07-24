import fs from 'fs'
import http from 'http'
import net from 'net'
import { Transform } from 'stream'
import { pipeline } from 'stream/promises'
import { deviceId, deviceName } from '../../../config'
import { createLogger, shortId } from '../../../services/logging'
import { remoteRef, RemoteRefMain } from '../../../utils/remoteRef'
import { RegisteredShareFile, shareFileSelectionRegistry } from './ShareFileSelectionRegistry'

const FILE_TRANSFER_PROTOCOL = 2
const MAX_RESPONSE_BYTES = 64 * 1024
const CONFIRMATION_TIMEOUT_MS = 2 * 60 * 1000
const UPLOAD_TIMEOUT_MS = 60 * 60 * 1000
const MAX_CONCURRENT_UPLOADS = 3

class SenderProtocolError extends Error {
  constructor(
    readonly code: FileTransferErrorCode,
    message = code,
  ) {
    super(message)
  }
}

interface HttpResponse {
  status: number
  body: Buffer
}

export class FileSender {
  private sendingMap = new Map<string, SendingItem>()
  private sendingList: RemoteRefMain<SendingItem[]> = remoteRef('sending-list', [], {
    readOnly: true,
  })
  private sentList: RemoteRefMain<SentItem[]> = remoteRef('sent-list', [], { readOnly: true })
  private controllers = new Map<string, AbortController>()
  private activeRequests = new Set<http.ClientRequest>()
  private logger = createLogger('share')
  private syncTimer?: NodeJS.Timeout

  constructor(private resolveDevice: (deviceId: string) => OnlineDevice | undefined) {}

  deleteSentTask(taskId: unknown) {
    if (typeof taskId !== 'string') return false
    let removed = false
    this.sentList.update((list) => {
      const index = list.findIndex((item) => item.id === taskId)
      if (index >= 0) {
        list.splice(index, 1)
        removed = true
      }
    })
    return removed
  }

  async sendSelection(selectionId: unknown, targetDeviceId: unknown) {
    if (typeof targetDeviceId !== 'string') throw new SenderProtocolError('INVALID_REQUEST')
    let selection
    try {
      selection = shareFileSelectionRegistry.consume(selectionId)
    } catch {
      throw new SenderProtocolError('SELECTION_EXPIRED')
    }

    const target = this.resolveDevice(targetDeviceId)
    if (!target || !target.services.cap.includes('file-push-v2')) {
      throw new SenderProtocolError('TRANSFER_NOT_FOUND')
    }
    if (!net.isIP(target.ip) || !this.isValidPort(target.services.http)) {
      throw new SenderProtocolError('INVALID_REQUEST')
    }

    const tasks = selection.files.map((file) => this.createSendingItem(file, target.device))
    for (const task of tasks) this.sendingMap.set(task.id, task)
    this.syncSendingList()

    const request: FileBatchRequest = {
      protocol: FILE_TRANSFER_PROTOCOL,
      device: {
        id: deviceId.value,
        name: deviceName.value,
        platform: process.platform,
      },
      files: selection.files.map((file) => ({
        fileId: file.id,
        filename: file.filename,
        size: file.size,
        mime: file.mime,
      })),
    }

    this.logger.info('share.send.batch_requested', {
      selectionId: shortId(selection.id),
      targetDeviceId: shortId(target.id),
      fileCount: selection.files.length,
      totalSize: selection.files.reduce((sum, file) => sum + file.size, 0),
    })

    let response: FileBatchResponse
    try {
      response = await this.requestBatch(target, request)
      this.validateBatchResponse(response, selection.files)
    } catch (error) {
      const code = this.errorCode(error)
      const result: SendResult =
        code === 'BATCH_REJECTED' ? 'rejected' : code === 'CANCELLED' ? 'cancelled' : 'failed'
      this.finishTasks(tasks, result, code)
      this.logger.error('share.send.batch_failed', error, {
        selectionId: shortId(selection.id),
        targetDeviceId: shortId(target.id),
        fileCount: selection.files.length,
        reason: code,
      })
      throw error
    }

    const grants = new Map(response.uploads.map((grant) => [grant.fileId, grant.token]))
    for (const task of tasks) task.batchId = response.batchId
    this.syncSendingList()
    this.logger.info('share.send.batch_accepted', {
      batchId: shortId(response.batchId),
      targetDeviceId: shortId(target.id),
      fileCount: selection.files.length,
    })

    let nextIndex = 0
    const worker = async () => {
      while (nextIndex < selection.files.length) {
        const index = nextIndex
        nextIndex += 1
        const file = selection.files[index]
        const task = tasks[index]
        const token = grants.get(file.id)
        if (!token) {
          this.finishTask(task, 'failed', 'INVALID_REQUEST')
          continue
        }
        await this.sendFile(target, response.batchId, file, token, task)
      }
    }
    await Promise.all(
      Array.from({ length: Math.min(MAX_CONCURRENT_UPLOADS, selection.files.length) }, () =>
        worker(),
      ),
    )
  }

  cancel(taskId: unknown) {
    if (typeof taskId !== 'string') return false
    const controller = this.controllers.get(taskId)
    if (!controller) return false
    controller.abort()
    this.logger.info('share.send.cancel_requested', { transferId: shortId(taskId) })
    return true
  }

  stop() {
    for (const controller of this.controllers.values()) controller.abort()
    this.controllers.clear()
    for (const request of this.activeRequests) {
      request.destroy(new SenderProtocolError('CANCELLED'))
    }
    this.activeRequests.clear()
    if (this.syncTimer) {
      clearTimeout(this.syncTimer)
      this.syncTimer = undefined
    }
  }

  private async sendFile(
    target: OnlineDevice,
    batchId: string,
    file: RegisteredShareFile,
    token: string,
    task: SendingItem,
  ) {
    const controller = new AbortController()
    this.controllers.set(task.id, controller)
    task.status = 'sending'
    this.syncSendingList()
    const startedAt = Date.now()

    try {
      await this.uploadFile(target, batchId, file, token, controller.signal, (transferred) => {
        const elapsed = Math.max((Date.now() - startedAt) / 1000, 0.001)
        const speed = transferred / elapsed
        task.progress = {
          transferred,
          total: file.size,
          percentage: file.size === 0 ? 0 : transferred / file.size,
          speed,
          eta: speed > 0 ? (file.size - transferred) / speed : undefined,
        }
        this.scheduleSync()
      })
      task.progress = {
        transferred: file.size,
        total: file.size,
        percentage: 1,
        speed: file.size / Math.max((Date.now() - startedAt) / 1000, 0.001),
        eta: 0,
      }
      this.finishTask(task, 'success')
      this.logger.info('share.send.completed', {
        batchId: shortId(batchId),
        transferId: shortId(task.id),
        targetDeviceId: shortId(target.id),
        size: file.size,
        durationMs: Date.now() - startedAt,
      })
    } catch (error) {
      const code = controller.signal.aborted ? 'CANCELLED' : this.errorCode(error)
      this.finishTask(task, code === 'CANCELLED' ? 'cancelled' : 'failed', code)
      this.logger.error('share.send.failed', error, {
        batchId: shortId(batchId),
        transferId: shortId(task.id),
        targetDeviceId: shortId(target.id),
        size: file.size,
        reason: code,
        durationMs: Date.now() - startedAt,
      })
    } finally {
      this.controllers.delete(task.id)
    }
  }

  private async requestBatch(target: OnlineDevice, body: FileBatchRequest) {
    const payload = Buffer.from(JSON.stringify(body))
    const response = await this.request(
      target,
      {
        method: 'POST',
        path: '/api/file-batches',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': payload.length,
        },
        timeout: CONFIRMATION_TIMEOUT_MS,
      },
      payload,
    )
    if (response.status < 200 || response.status >= 300) {
      throw new SenderProtocolError(this.responseErrorCode(response))
    }
    try {
      return JSON.parse(response.body.toString('utf8')) as FileBatchResponse
    } catch {
      throw new SenderProtocolError('INVALID_REQUEST')
    }
  }

  private async uploadFile(
    target: OnlineDevice,
    batchId: string,
    file: RegisteredShareFile,
    token: string,
    signal: AbortSignal,
    onProgress: (transferred: number) => void,
  ) {
    const handle = await fs.promises.open(file.path, 'r')
    const stat = await handle.stat()
    if (!stat.isFile() || stat.size !== file.size || stat.mtimeMs !== file.modifiedAt) {
      await handle.close()
      throw new SenderProtocolError('FILE_CHANGED')
    }

    let responsePromise: Promise<HttpResponse> | undefined
    let request: http.ClientRequest | undefined
    try {
      responsePromise = new Promise<HttpResponse>((resolve, reject) => {
        request = http.request(
          {
            host: target.ip,
            port: target.services.http,
            method: 'PUT',
            path:
              `/api/file-batches/${encodeURIComponent(batchId)}/files/` +
              encodeURIComponent(file.id),
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': file.mime || 'application/octet-stream',
              'Content-Length': file.size,
            },
            signal,
          },
          (response) => this.collectResponse(response, resolve, reject),
        )
        this.trackRequest(request)
        request.setTimeout(UPLOAD_TIMEOUT_MS, () => {
          request?.destroy(new SenderProtocolError('NETWORK_ERROR'))
        })
        request.once('error', reject)
      })

      let transferred = 0
      const progress = new Transform({
        transform(chunk: Buffer, _encoding, callback) {
          transferred += chunk.length
          onProgress(transferred)
          callback(null, chunk)
        },
      })
      await pipeline(handle.createReadStream(), progress, request!, { signal })
      const response = await responsePromise
      if (response.status < 200 || response.status >= 300) {
        throw new SenderProtocolError(this.responseErrorCode(response))
      }
    } catch (error) {
      request?.destroy()
      await responsePromise?.catch(() => undefined)
      throw error
    } finally {
      await handle.close().catch(() => undefined)
    }
  }

  private request(
    target: OnlineDevice,
    options: {
      method: string
      path: string
      headers: Record<string, string | number>
      timeout: number
    },
    body: Buffer,
  ) {
    return new Promise<HttpResponse>((resolve, reject) => {
      const request = http.request(
        {
          host: target.ip,
          port: target.services.http,
          method: options.method,
          path: options.path,
          headers: options.headers,
        },
        (response) => this.collectResponse(response, resolve, reject),
      )
      this.trackRequest(request)
      request.setTimeout(options.timeout, () => {
        request.destroy(new SenderProtocolError('NETWORK_ERROR'))
      })
      request.once('error', reject)
      request.end(body)
    })
  }

  private collectResponse(
    response: http.IncomingMessage,
    resolve: (response: HttpResponse) => void,
    reject: (error: unknown) => void,
  ) {
    const chunks: Buffer[] = []
    let size = 0
    response.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > MAX_RESPONSE_BYTES) {
        response.destroy(new SenderProtocolError('INVALID_REQUEST'))
        return
      }
      chunks.push(chunk)
    })
    response.once('end', () => {
      resolve({
        status: response.statusCode ?? 500,
        body: Buffer.concat(chunks),
      })
    })
    response.once('error', reject)
  }

  private validateBatchResponse(response: FileBatchResponse, files: RegisteredShareFile[]) {
    if (
      !response ||
      response.protocol !== FILE_TRANSFER_PROTOCOL ||
      typeof response.batchId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(
        response.batchId,
      ) ||
      !Array.isArray(response.uploads) ||
      response.uploads.length !== files.length
    ) {
      throw new SenderProtocolError('INVALID_REQUEST')
    }
    const expectedIds = new Set(files.map((file) => file.id))
    const receivedIds = new Set<string>()
    for (const grant of response.uploads) {
      if (
        !grant ||
        typeof grant.fileId !== 'string' ||
        !expectedIds.has(grant.fileId) ||
        receivedIds.has(grant.fileId) ||
        typeof grant.token !== 'string' ||
        !/^[A-Za-z0-9_-]{43}$/u.test(grant.token)
      ) {
        throw new SenderProtocolError('INVALID_REQUEST')
      }
      receivedIds.add(grant.fileId)
    }
  }

  private responseErrorCode(response: HttpResponse): FileTransferErrorCode {
    try {
      const parsed = JSON.parse(response.body.toString('utf8')) as FileTransferErrorResponse
      if (this.isTransferErrorCode(parsed?.error?.code)) return parsed.error.code
    } catch {
      // A non-protocol response is a network peer error, not a local parsing failure.
    }
    return 'NETWORK_ERROR'
  }

  private errorCode(error: unknown): FileTransferErrorCode {
    if (error instanceof SenderProtocolError) return error.code
    const code = (error as NodeJS.ErrnoException | undefined)?.code
    if (code === 'ABORT_ERR' || code === 'ERR_CANCELED') return 'CANCELLED'
    if (error instanceof Error && error.message === 'SELECTION_EXPIRED') {
      return 'SELECTION_EXPIRED'
    }
    return 'NETWORK_ERROR'
  }

  private isTransferErrorCode(value: unknown): value is FileTransferErrorCode {
    return (
      typeof value === 'string' &&
      [
        'INVALID_REQUEST',
        'REQUEST_TOO_LARGE',
        'FILE_PUSH_DISABLED',
        'RECEIVER_BUSY',
        'BATCH_REJECTED',
        'TRANSFER_NOT_FOUND',
        'TRANSFER_EXPIRED',
        'TRANSFER_UNAUTHORIZED',
        'TRANSFER_ALREADY_STARTED',
        'LENGTH_REQUIRED',
        'LENGTH_MISMATCH',
        'WRITE_FAILED',
        'NETWORK_ERROR',
        'SELECTION_EXPIRED',
        'FILE_CHANGED',
        'CANCELLED',
      ].includes(value)
    )
  }

  private trackRequest(request: http.ClientRequest) {
    this.activeRequests.add(request)
    const cleanup = () => this.activeRequests.delete(request)
    request.once('close', cleanup)
  }

  private createSendingItem(file: RegisteredShareFile, target: DeviceInfo): SendingItem {
    return {
      id: file.id,
      fileId: file.id,
      meta: {
        filename: file.filename,
        size: file.size,
        mime: file.mime,
        device: target,
      },
      status: 'pending',
      progress: {
        transferred: 0,
        total: file.size,
        percentage: 0,
        speed: 0,
      },
      createdAt: Date.now(),
    }
  }

  private finishTask(task: SendingItem, result: SendResult, reason?: FileTransferErrorCode) {
    this.sendingMap.delete(task.id)
    this.syncSendingList()
    this.sentList.update((list) => {
      list.unshift({
        id: task.id,
        batchId: task.batchId,
        fileId: task.fileId,
        meta: task.meta,
        result,
        reason,
        ...(reason ? { error: { message: reason } } : {}),
        createdAt: task.createdAt,
        finishedAt: Date.now(),
      })
    })
  }

  private finishTasks(tasks: SendingItem[], result: SendResult, reason: FileTransferErrorCode) {
    for (const task of tasks) this.sendingMap.delete(task.id)
    this.syncSendingList()
    const finishedAt = Date.now()
    this.sentList.update((list) => {
      list.unshift(
        ...tasks.map((task) => ({
          id: task.id,
          batchId: task.batchId,
          fileId: task.fileId,
          meta: task.meta,
          result,
          reason,
          error: { message: reason },
          createdAt: task.createdAt,
          finishedAt,
        })),
      )
    })
  }

  private scheduleSync() {
    if (this.syncTimer) return
    this.syncTimer = setTimeout(() => {
      this.syncTimer = undefined
      this.syncSendingList()
    }, 100)
  }

  private syncSendingList() {
    this.sendingList.value = Array.from(this.sendingMap.values())
  }

  private isValidPort(value: unknown): value is number {
    return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 65535
  }
}
