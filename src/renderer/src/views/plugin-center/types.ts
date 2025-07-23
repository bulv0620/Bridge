export interface PlatformInfo {
  exec: string | null
  config: string | null
  log: string | null
}

export interface PluginInfo {
  name: string
  desc: Record<string, any>
  iconPath: string
  platforms: {
    mac?: PlatformInfo
    win?: PlatformInfo
    linux?: PlatformInfo
  }
}
