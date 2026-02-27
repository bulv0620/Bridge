export type ThemeMode = 'light' | 'dark' | 'system'

export interface AppStoreSchema {
  theme: ThemeMode
  locale: Locales

  deviceId: string
  deviceName: string
  lanDiscovery: boolean
  ports: {
    udp: number
    http: number
  }
  shareInterval: number
  capabilities: ServiceCapability[]
  downloadPath: string

  syncSessions: CacehdSession[]
}
