declare interface PluginPlatformInfo {
  exec: string | null
  config: string | null
  log: string | null
}

declare interface PluginInfo {
  name: string
  desc: Record<string, any>
  iconPath: string
  platforms: {
    mac?: PluginPlatformInfo
    win?: PluginPlatformInfo
    linux?: PluginPlatformInfo
  }
}

declare interface PluginProcess {
  name: string
  pid?: number
}
