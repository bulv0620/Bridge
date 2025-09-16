declare interface ShareInfo {
  files: SharedFileInfo[]
  platform: NodeJS.Platform
  id: string
}

declare interface OnlineDevice {
  ip: string
  lastSeen: number
  data: ShareInfo
  me: boolean
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
  type: string
  size: number
  status: Consumption
}

declare interface Consumption {
  remaining: number
  total: number
  createdAt: number
  expiresAt: number
}
