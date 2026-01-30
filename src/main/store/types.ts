export type ThemeMode = 'light' | 'dark' | 'system'

export interface AppStoreSchema {
  theme: ThemeMode
  locale: Locales

  deviceId: string
  deviceName: string
  ports: {
    udp: number
    http: number
  }
  capabilities: ServiceCapability[]
}
