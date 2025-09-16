declare interface ShareInfo {
  files: SharedFileInfo[]
  platform: NodeJS.Platform
}

declare interface OnlineDevice {
  ip: string
  lastSeen: number
  data: ShareInfo
}

declare interface DeviceDiscoveryOptions {
  channel?: string
  port?: number
  interval?: number
  debug?: boolean
}

declare interface SharedFileInfo {
  id: string
  filePath: string
  fileName: string
  size: number
  timestamp: Date
  status: Consumption
}

declare interface Consumption {
  remaining: number
  total: number
  createdAt: Date
  expiresAt: Date
}
