import { ref, onMounted, toRaw } from 'vue'
import { useMessage } from 'naive-ui'
import { usePluginConfigModal } from './usePluginConfigModal'

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

const { openPluginConfigModal } = usePluginConfigModal()

export function usePluginCard(props: PluginCardProps) {
  const loading = ref(false)
  const running = ref(false)

  const message = useMessage()

  const imageData = ref('')
  const isAvailable = ref(false)

  async function checkAvailable() {
    isAvailable.value = await window.ipc.plugin.checkSupport(props.plugin.name)
  }

  async function getImgData() {
    imageData.value = await window.ipc.plugin.getImageData(props.plugin.name)
  }

  async function startPlugin() {
    loading.value = true
    try {
      await window.ipc.plugin.startPlugin(toRaw(props.plugin))
      // 等待插件启动完成
      await delay(1000)
      checkPluginStatus()
    } catch (error) {
      message.error((error as any).message)
    } finally {
      loading.value = false
    }
  }

  async function stopPlugin() {
    loading.value = true
    try {
      await window.ipc.plugin.stopPlugin(toRaw(props.plugin))
      // 等待插件启动完成
      await delay(1000)
      checkPluginStatus()
    } catch (error) {
      message.error((error as any).message)
    } finally {
      loading.value = false
    }
  }

  async function checkPluginStatus() {
    const result = await window.ipc.plugin.checkPluginStatus(props.plugin.name)
    running.value = result
  }

  function delay(ms: number) {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve()
      }, ms)
    })
  }

  function showLog() {
    window.ipc.plugin.openPluginLog(props.plugin.name)
  }

  function showConfig() {
    openPluginConfigModal(props.plugin.name)
  }

  onMounted(() => {
    checkPluginStatus()
    getImgData()
    checkAvailable()
  })

  return {
    loading,
    running,
    isAvailable,
    imageData,
    startPlugin,
    stopPlugin,
    checkPluginStatus,
    showLog,
    showConfig,
  }
}
