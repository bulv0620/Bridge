import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  HeadBucketCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import { HttpsProxyAgent } from 'https-proxy-agent'
import path from 'path'
import { PassThrough, Readable } from 'stream'
import { ReadStream, WriteStream } from 'fs'
import { StorageEngine, shouldIgnoreFile } from '../StorageEngine'
import { createLogger } from '../../../../../services/logging'

const logger = createLogger('sync.storage.s3')

export class S3StorageEngine extends StorageEngine {
  private client: S3Client
  private bucket: string

  constructor(config: S3Config, basePath: string = '') {
    super(basePath)
    this.bucket = config.bucket

    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      forcePathStyle: config.forcePathStyle,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      requestHandler: config.useProxy
        ? new NodeHttpHandler({
            httpsAgent: new HttpsProxyAgent(config.proxyUrl!),
          })
        : undefined,
    })
  }

  protected _resolve(filePath: string): string {
    // 统一用 posix 风格 key，且去掉开头的 /
    const posixPath = filePath.split(path.sep).join(path.posix.sep)
    const joined = path.posix.join(this.basePath || '', posixPath || '')

    return joined.replace(/^\/+/, '')
  }

  async validate(): Promise<boolean> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }))
      return true
    } catch (err) {
      logger.warn('sync.storage.s3.validation_failed', undefined, err)
      return false
    }
  }

  private ensurePrefixSlash(prefix: string) {
    if (!prefix) return ''
    return prefix.endsWith('/') ? prefix : `${prefix}/`
  }

  /**
   * 列出目录（只列当前层级，返回目录和文件）
   */
  async list(dir: string, ignoredFolders: string[] = []): Promise<FileInfo[]> {
    const prefix = this._resolve(dir)
    const Prefix = this.ensurePrefixSlash(prefix)
    const cmd = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: Prefix || undefined,
      Delimiter: '/',
      MaxKeys: 1000,
    })

    const resp = await this.client.send(cmd)

    const out: FileInfo[] = []

    // 目录（CommonPrefixes）
    const common = resp.CommonPrefixes ?? []
    for (const p of common) {
      const folderKey = p.Prefix ?? ''
      // basename
      const name = path.posix.basename(folderKey.replace(/\/$/, ''))
      if (shouldIgnoreFile(name)) continue
      if (ignoredFolders.includes(name)) continue

      const filePath = this.formatPath(folderKey)

      out.push({
        isDirectory: true,
        fileName: name,
        size: 0,
        timestamp: new Date(), // S3 没有 folder 时间，使用 now 或者空
        filePath: filePath,
        relativePath: this.basePath ? path.posix.relative(this.basePath, filePath) : name,
        meta: {
          atime: new Date(),
          mtime: new Date(),
          mode: 0o755,
          size: 0,
        },
      })
    }

    // 文件（Contents）
    const contents = resp.Contents ?? []
    for (const obj of contents) {
      if (!obj.Key) continue
      // s3 上有时会存在以 / 结尾的“伪文件夹”，忽略
      if (obj.Key.endsWith('/')) continue

      const name = path.posix.basename(obj.Key)
      if (shouldIgnoreFile(name)) continue

      const filePath = this.formatPath(obj.Key)

      out.push({
        isDirectory: false,
        fileName: name,
        size: obj.Size ?? 0,
        timestamp: obj.LastModified ?? new Date(),
        filePath: filePath,
        relativePath: this.basePath ? path.posix.relative(this.basePath, filePath) : obj.Key,
        meta: {
          atime: obj.LastModified ?? new Date(),
          mtime: obj.LastModified ?? new Date(),
          mode: 0o644,
          size: obj.Size ?? 0,
        },
      })
    }

    // 目录排前
    out.sort((a, b) => {
      if (a.isDirectory === b.isDirectory) return 0
      return a.isDirectory ? -1 : 1
    })

    return out
  }

  /**
   * 递归获取所有文件（不返回“目录”项），会分页
   */
  async getAllFiles(dir: string, ignoredFolders: string[] = []): Promise<FileInfo[]> {
    const prefix = this._resolve(dir)
    const Prefix = this.ensurePrefixSlash(prefix)
    let ContinuationToken: string | undefined = undefined
    const files: FileInfo[] = []

    do {
      const resp = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: Prefix || undefined,
          ContinuationToken,
          MaxKeys: 1000,
        }),
      )

      const contents = resp.Contents ?? []
      for (const obj of contents) {
        if (!obj.Key) continue
        if (obj.Key.endsWith('/')) continue
        const name = path.posix.basename(obj.Key)
        if (shouldIgnoreFile(name)) continue

        // 判断是否位于需要忽略的父级文件夹中
        const relative = this.basePath ? path.posix.relative(this.basePath, obj.Key) : obj.Key
        const parts = relative.split('/')
        if (parts.some((p) => ignoredFolders.includes(p))) continue

        files.push({
          isDirectory: false,
          fileName: name,
          size: obj.Size ?? 0,
          timestamp: obj.LastModified ?? new Date(),
          filePath: obj.Key,
          relativePath: relative,
          meta: {
            atime: obj.LastModified ?? new Date(),
            mtime: obj.LastModified ?? new Date(),
            mode: 0o644,
            size: obj.Size ?? 0,
          },
        })
      }

      ContinuationToken = resp.IsTruncated ? resp.NextContinuationToken : undefined
    } while (ContinuationToken)

    return files
  }

  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Uint8Array[] = []
      stream.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))
      stream.on('end', () => resolve(Buffer.concat(chunks)))
      stream.on('error', (err) => reject(err))
    })
  }

  async getFile(filePath: string): Promise<Buffer> {
    const key = this._resolve(filePath)
    const resp = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }))
    if (!resp.Body) throw new Error('Empty body from S3')
    const stream = resp.Body as Readable
    return this.streamToBuffer(stream)
  }

  async writeFile(filePath: string, data: Buffer | string): Promise<void> {
    const key = this._resolve(filePath)
    const Body = Buffer.isBuffer(data) ? data : Buffer.from(data)
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body }))
  }

  async createReadStream(filePath: string): Promise<ReadStream> {
    const key = this._resolve(filePath)
    const resp = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }))
    if (!resp.Body) throw new Error('Empty body from S3')
    return resp.Body as unknown as ReadStream
  }

  /**
   * 使用 PassThrough + @aws-sdk/lib-storage Upload 支持流式上传（multipart）
   */
  async createWriteStream(filePath: string): Promise<WriteStream> {
    const key = this._resolve(filePath)
    const pass = new PassThrough()

    // 启动后台上传
    const uploader = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: pass,
      },
    })

    // 开始上传（promise）
    const done = uploader.done().catch((err) => {
      // 如果上传失败，主动销毁流并发 error
      pass.destroy(err as Error)
      pass.emit('error', err)
      throw err
    })

    // 把 promise 暂存到流上，供外部 await
    ;(pass as any)._DONE = done

    return pass as unknown as WriteStream
  }

  async delFile(filePath: string): Promise<void> {
    const key = this._resolve(filePath)
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
  }

  async exists(filePath: string): Promise<boolean> {
    const key = this._resolve(filePath)
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }))
      return true
    } catch (err: any) {
      // 404 / NotFound 会抛错
      const code = err?.$metadata?.httpStatusCode
      if (code === 404 || code === 403) return false
      // 其它错误抛出
      throw err
    }
  }

  /**
   * S3 不需要目录，但我们可以选择创建一个 0-byte 对象作为“占位符”
   */
  async ensureDir(dirPath: string): Promise<void> {
    const resolved = this._resolve(dirPath)
    if (!resolved) return
    const key = this.ensurePrefixSlash(resolved)
    // 如果已经存在则无需重复 put（但为了简单直接 put 一个空对象）
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: '' }))
  }

  async getMeta(filePath: string): Promise<FileMetaData> {
    const key = this._resolve(filePath)
    const resp = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }))
    return {
      atime: resp.LastModified ?? new Date(),
      mtime: resp.LastModified ?? new Date(),
      mode: 0o644,
      size: resp.ContentLength ?? 0,
    }
  }

  /**
   * 无法直接设置 S3 的 LastModified（由 S3 管理）。
   * 我这里通过 CopyObject 替换 metadata 并写入自定义 x-amz-meta-mtime 字段保存 mtime（供业务读取）。
   */
  async setMeta(filePath: string, meta: FileMetaData): Promise<void> {
    const key = this._resolve(filePath)
    try {
      const metadata: Record<string, string> = {}
      if (meta && meta.mtime) {
        metadata['x-amz-meta-mtime'] = (meta.mtime as Date).toISOString()
      }
      // Copy 指向自身以替换 metadata（Key 需要 URL 编码）
      const copySource = `${this.bucket}/${encodeURIComponent(key)}`
      await this.client.send(
        new CopyObjectCommand({
          Bucket: this.bucket,
          Key: key,
          CopySource: copySource,
          Metadata: metadata,
          MetadataDirective: 'REPLACE',
        }),
      )
    } catch (e) {
      // 非致命：记录警告
      logger.warn('sync.file.metadata_failed', { storageType: 's3', relativePath: filePath }, e)
    }
  }

  async getCapacity(): Promise<StorageCapacityResult> {
    return { status: 'unsupported' }
  }

  async disconnect(): Promise<void> {
    // S3Client 支持 destroy()
    try {
      ;(this.client as any).destroy?.()
    } catch (e) {
      // ignore
    }
  }

  private formatPath(path: string) {
    if (path.endsWith('/')) {
      path = path.substring(0, path.length - 1)
    }

    if (!path.startsWith('/')) {
      path = '/' + path
    }

    return path
  }
}
