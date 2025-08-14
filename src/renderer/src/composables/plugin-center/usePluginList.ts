import { ref, computed } from 'vue'
import { PluginInfo } from '@renderer/composables/plugin-center/usePluginCard'

const plugins = ref<PluginInfo[]>([])
const filterText = ref('')
const loading = ref(false)

const filteredPlugins = computed(() => {
  if (!filterText.value.trim()) return plugins.value
  return plugins.value.filter((plugin) =>
    plugin.desc.title.toLowerCase().includes(filterText.value.toLowerCase()),
  )
})

async function refreshPluginList() {
  loading.value = true
  plugins.value = []
  try {
    const result = await window.ipc.plugin.getPluginList()
    plugins.value = result
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

export function usePluginList() {
  return {
    plugins,
    filterText,
    loading,
    filteredPlugins,
    refreshPluginList,
  }
}
