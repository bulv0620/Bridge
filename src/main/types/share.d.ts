declare interface DeviceInfo {
  [key: string]: any
}

declare interface OnlineDevice {
  ip: string
  lastSeen: number
  data: DeviceInfo
}

declare interface DeviceDiscoveryOptions {
  channel?: string
  port?: number
  interval?: number
  debug?: boolean
}
