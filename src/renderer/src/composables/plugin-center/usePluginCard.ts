import { ref, onMounted, toRaw, computed } from 'vue'
import { useMessage } from 'naive-ui'

const fs = window.api.fsSync
const os = window.api.os
const ipcRenderer = window.electron.ipcRenderer

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

export interface PluginCardProps {
  plugin: PluginInfo
}

export interface PluginCardEmits {
  (e: 'log', path: string): void
  (e: 'config', path: string): void
}

export function usePluginCard(props: PluginCardProps, emits: PluginCardEmits) {
  const loading = ref(false)
  const running = ref(false)

  const message = useMessage()

  const isAvailable = computed(() => {
    const platform = os.platform()

    if (platform === 'darwin') {
      return !!props.plugin.platforms.mac
    } else if (platform === 'win32') {
      return !!props.plugin.platforms.win
    } else if (platform === 'linux') {
      return !!props.plugin.platforms.linux
    } else {
      return false
    }
  })

  const getImgData = (filePath: string) => {
    const b64data = fs.readFileSync(filePath).toString('base64')
    return 'data:image/png;base64,' + b64data
  }

  const startPlugin = async () => {
    loading.value = true
    try {
      await ipcRenderer.invoke('start-plugin', toRaw(props.plugin))
      // 等待插件启动完成
      await delay(1000)
      checkPluginStatus()
    } catch (error) {
      message.error((error as any).message)
    } finally {
      loading.value = false
    }
  }

  const stopPlugin = async () => {
    loading.value = true
    try {
      await ipcRenderer.invoke('stop-plugin', toRaw(props.plugin))
      // 等待插件启动完成
      await delay(1000)
      checkPluginStatus()
    } catch (error) {
      message.error((error as any).message)
    } finally {
      loading.value = false
    }
  }

  const checkPluginStatus = async () => {
    const result = await ipcRenderer.invoke('check-plugin-status', props.plugin.name)

    running.value = result
  }

  const delay = (ms: number) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve()
      }, ms)
    })
  }

  const showLog = () => {
    let logPath: string | null

    const platform = os.platform()
    if (platform === 'darwin') {
      logPath = props.plugin.platforms.mac!.log
    } else if (platform === 'win32') {
      logPath = props.plugin.platforms.win!.log
    } else if (platform === 'linux') {
      logPath = props.plugin.platforms.linux!.log
    }
    emits('log', logPath!)
  }

  const showConfig = () => {
    let configPath: string

    const platform = os.platform()
    if (platform === 'darwin') {
      configPath = props.plugin.platforms.mac!.config!
    } else if (platform === 'win32') {
      configPath = props.plugin.platforms.win!.config!
    } else if (platform === 'linux') {
      configPath = props.plugin.platforms.linux!.config!
    }
    emits('config', configPath!)
  }

  onMounted(() => {
    checkPluginStatus()
  })

  return {
    loading,
    running,
    isAvailable,
    getImgData,
    startPlugin,
    stopPlugin,
    checkPluginStatus,
    showLog,
    showConfig,
  }
}
