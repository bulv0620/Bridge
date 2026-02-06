declare type ProtocolVersion = 1
declare type AnnounceType = 'announce' | 'bye'
declare interface DeviceInfo {
  id: string
  name: string // 名称
  platform: NodeJS.Platform // 平台
  model?: string // 设备型号（可选）
}
declare type ServiceCapability = 'clipboard' | 'file-push' | 'message' | string
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
  id: string // uploadId
  meta: FileMeta // 文件元信息
  status: ReceivingStatus // 状态
  progress: TransferProgress // 进度
  savePath: string // 用户选择的保存路径
  createdAt: number // 创建时间
}

// 接收结果
declare type ReceivedResult = 'success' | 'failed' | 'cancelled'

// 保存信息
declare interface ReceivedSaveInfo {
  path: string // 本地保存路径
  filename: string
  size: number
}

// 已接收文件项
declare interface ReceivedItem {
  id: string // uploadId
  meta: FileMeta // 文件元信息
  result: ReceivedResult // 接收结果
  save?: ReceivedSaveInfo // 保存信息 (成功时存在)
  error?: {
    message: string
  } // 错误信息（失败时存在）
  createdAt: number
  finishedAt: number
}
