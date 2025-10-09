declare interface BroadcastMessage {
  files: SharedFileInfo[]
  id: string
  platform: NodeJS.Platform
}

declare interface OnlineDeviceData {
  files: SharedFileInfo[]
}
declare interface OnlineDevice {
  id: string
  ip: string
  platform: NodeJS.Platform
  lastSeen: number
  mine: boolean
  data: OnlineDeviceData
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
