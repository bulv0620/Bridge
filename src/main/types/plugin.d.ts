type Platform = NodeJS.Platform

type Arch = 'x64' | 'arm64'

interface PluginArchInfo {
  entryPath: string // 可执行文件路径
  configPath: string // 配置文件路径
}

type PluginPlatformInfo = Partial<Record<Arch, PluginArchInfo>>

interface PluginInfo {
  name: string
  desc: Record<string, any>
  platforms: Partial<Record<Platform, PluginPlatformInfo>>
}

interface PluginProcess {
  name: string
  pid?: number
}
