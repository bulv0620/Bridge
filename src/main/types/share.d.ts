declare type ProtocolVersion = 1
declare type FileTransferProtocolVersion = 2
declare type AnnounceType = 'announce' | 'bye'
declare interface DeviceInfo {
  id: string
  name: string // 名称
  platform: NodeJS.Platform // 平台
  model?: string // 设备型号（可选）
}
declare type ServiceCapability = 'clipboard' | 'file-push-v2' | 'message' | string
declare interface ServiceInfo {
  udp: number // UDP announce 端口
  http: number // HTTP 服务端口
  ws?: number // WebSocket 端口
  cap: ServiceCapability[] // 设备支持的能力
}

declare type ClipboardMime = 'text/plain' | 'text/html' | 'image/png' | 'image/jpeg' | string
declare interface ClipboardState {
  v: string // 剪切板版本号
  mime: ClipboardMime // 当前内容 MIME
}
declare interface ClipboardContent {
  v: string
  mime: ClipboardMime
  path?: string // 图片 / 大内容：文件路径
  text?: string // 小文本
  createdAt: number
  device: DeviceInfo // 设备信息
}
declare interface DeviceState {
  clipboard?: ClipboardState // 剪切板状态（可选）
}

// 消息类型
declare interface AnnounceMessage {
  v: ProtocolVersion // 协议版本
  type: AnnounceType // 消息类型
  device: DeviceInfo // 设备信息
  services: ServiceInfo // 服务与能力
  state?: DeviceState // 轻量状态
  ts: number // 时间戳
}

declare type OnlineStatus = 'online' | 'offline' | 'stale'

declare type DiscoverySource = 'udp' | 'mdns' | 'manual'

// 在线设备信息
declare interface OnlineDevice {
  id: string
  ip: string // ip地址
  device: DeviceInfo // 设备基础信息
  services: ServiceInfo // 服务信息
  state?: DeviceState // 最近一次 announce 的状态快照
  trusted: boolean // 是否已被用户信任
  status: OnlineStatus // 在线状态
  sources: DiscoverySource[] // 发现来源（可能多个）
  lastSeenAt: number // 最近一次收到 announce 的时间（本地时间）
  firstSeenAt: number // 第一次发现时间
  lastStateChangeAt?: number // 最近一次状态变化（clipboard 变化等）
  hasActiveConnection: boolean // 当前是否有活动连接（WS / HTTP）
  lastAnnounce?: AnnounceMessage // 原始 announce（调试 / 诊断用，可选）
}

// 传输文件信息
declare interface FileMeta {
  filename: string
  size: number // bytes
  mime?: string
  device: DeviceInfo
}

declare interface SelectedShareFile {
  id: string
  filename: string
  size: number
  mime?: string
}

declare interface ShareFileSelection {
  id: string
  files: SelectedShareFile[]
  createdAt: number
}

declare type ShareFileRegistrationResult =
  | {
      ok: true
      selection: ShareFileSelection
    }
  | {
      ok: false
      error: 'INVALID_FILE_SELECTION'
    }

declare interface ShareFilesApi {
  register(files: File[]): Promise<ShareFileRegistrationResult>
  release(selectionId: string): Promise<void>
}

declare interface FileBatchItemRequest {
  fileId: string
  filename: string
  size: number
  mime?: string
}

declare interface FileBatchRequest {
  protocol: FileTransferProtocolVersion
  device: DeviceInfo
  files: FileBatchItemRequest[]
}

declare interface FileUploadGrant {
  fileId: string
  token: string
}

declare interface FileBatchResponse {
  protocol: FileTransferProtocolVersion
  batchId: string
  uploads: FileUploadGrant[]
}

declare type FileTransferErrorCode =
  | 'INVALID_REQUEST'
  | 'REQUEST_TOO_LARGE'
  | 'FILE_PUSH_DISABLED'
  | 'RECEIVER_BUSY'
  | 'BATCH_REJECTED'
  | 'TRANSFER_NOT_FOUND'
  | 'TRANSFER_EXPIRED'
  | 'TRANSFER_UNAUTHORIZED'
  | 'TRANSFER_ALREADY_STARTED'
  | 'LENGTH_REQUIRED'
  | 'LENGTH_MISMATCH'
  | 'WRITE_FAILED'
  | 'NETWORK_ERROR'
  | 'SELECTION_EXPIRED'
  | 'FILE_CHANGED'
  | 'CANCELLED'

declare interface FileTransferErrorResponse {
  error: {
    code: FileTransferErrorCode
  }
}

// 接收状态
declare type ReceivingStatus =
  | 'pending' // 已允许，未开始
  | 'receiving' // 接收中
  | 'received' // 接收完成

// 接收进度
declare interface TransferProgress {
  transferred: number
  total: number
  percentage: number // 0 ~ 1
  speed?: number // bytes/s
  eta?: number // seconds
}

// 接收文件项
declare interface ReceivingItem {
  id: string
  batchId: string
  fileId: string
  meta: FileMeta // 文件元信息
  status: ReceivingStatus // 状态
  progress: TransferProgress // 进度
  createdAt: number // 创建时间
}

// 发送状态
declare type SendingStatus =
  | 'pending' // 未开始
  | 'sending' // 发送中
  | 'sent' // 发送完成

// 发送文件项
declare interface SendingItem {
  id: string
  batchId?: string
  fileId: string
  meta: FileMeta // 文件元信息
  status: SendingStatus // 状态
  progress: TransferProgress // 进度
  createdAt: number // 创建时间
}

// 接收结果
declare type ReceivedResult = 'success' | 'failed' | 'cancelled' | 'expired'

// 保存信息
declare interface ReceivedSaveInfo {
  path: string // 本地保存路径
  filename: string
  size: number
}

// 已接收文件项
declare interface ReceivedItem {
  id: string
  batchId: string
  fileId: string
  meta: FileMeta // 文件元信息
  result: ReceivedResult // 接收结果
  save?: ReceivedSaveInfo // 保存信息 (成功时存在)
  error?: {
    message: string
  } // 错误信息（失败时存在）
  createdAt: number
  finishedAt: number
}

// 发送结果
declare type SendResult = 'success' | 'failed' | 'cancelled' | 'rejected'

// 已发送项
declare interface SentItem {
  id: string
  batchId?: string
  fileId: string
  meta: FileMeta // 文件元信息
  result: SendResult // 接收结果
  reason?: FileTransferErrorCode
  error?: {
    message: string
  } // 错误信息（失败时存在）
  createdAt: number
  finishedAt: number
}
