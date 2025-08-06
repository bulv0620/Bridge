import { ref, computed, onActivated } from 'vue'
import { usePluginConfigModal } from '@renderer/composables/plugin-center/usePluginConfigModal'
import { PluginInfo } from '@renderer/composables/plugin-center/usePluginCard'

const ipcRenderer = window.electron.ipcRenderer

export function usePluginList() {
  const { openPluginConfigModal } = usePluginConfigModal()

  const plugins = ref<PluginInfo[]>([])
  const filterText = ref('')
  const loading = ref(false)

  const filteredPlugins = computed(() => {
    if (!filterText.value.trim()) return plugins.value
    return plugins.value.filter((plugin) =>
      plugin.desc.title.toLowerCase().includes(filterText.value.toLowerCase()),
    )
  })

  function openLogModal(path: string) {
    ipcRenderer.invoke('open-path', path)
  }

  function openConfigModal(path: string) {
    openPluginConfigModal(path)
  }

  async function refreshPluginList() {
    loading.value = true
    plugins.value = []
    const result = await ipcRenderer
      .invoke('get-plugin-list')
      .finally(() => (loading.value = false))
    plugins.value = result
  }

  onActivated(() => {
    refreshPluginList()
  })

  return {
    plugins,
    filterText,
    loading,
    filteredPlugins,
    openLogModal,
    openConfigModal,
    refreshPluginList,
  }
}
