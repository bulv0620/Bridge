<script setup lang="ts">
import { ref, computed, onActivated } from 'vue'
import { Search } from '@vicons/ionicons5'
import PluginCard from './components/plugin-card/PluginCard.vue'
import { PluginInfo } from './types'
import { Refresh } from '@vicons/ionicons5'
import LogModal from './components/log-modal/LogModal.vue'
import ConfigModal from './components/config-modal/ConfigModal.vue'

const ipcRenderer = window.electron.ipcRenderer

defineOptions({
  name: 'PluginCenter',
})

const plugins = ref<PluginInfo[]>([])
const filterText = ref('')
const loading = ref(false)

const logModalRef = ref<InstanceType<typeof LogModal> | null>(null)
const configModalRef = ref<InstanceType<typeof ConfigModal> | null>(null)

const openLogModal = (path: string) => {
  if (logModalRef.value) {
    logModalRef.value.open(path)
  }
}

const openConfigModal = (path: string) => {
  if (configModalRef.value) {
    configModalRef.value.open(path)
  }
}

const filteredPlugins = computed(() => {
  if (!filterText.value.trim()) return plugins.value
  return plugins.value.filter((plugin) =>
    plugin.name.toLowerCase().includes(filterText.value.toLowerCase()),
  )
})

onActivated(() => {
  handleRefresh()
})

const handleRefresh = async () => {
  loading.value = true
  plugins.value = []
  const result = await ipcRenderer.invoke('get-plugin-list').finally(() => (loading.value = false))
  plugins.value = result
}
</script>

<template>
  <div class="plugin-center">
    <div class="container">
      <div class="top">
        <n-input
          v-model:value="filterText"
          style="width: 200px"
          type="text"
          :placeholder="$t('views.pluginCenter.searchPlaceholder')"
        >
          <template #suffix>
            <n-icon :component="Search" />
          </template>
        </n-input>

        <n-button circle :loading="loading" @click="handleRefresh">
          <template #icon>
            <n-icon><Refresh /></n-icon>
          </template>
        </n-button>
      </div>

      <n-scrollbar style="height: 100% - 34px">
        <n-grid
          v-if="filteredPlugins.length > 0"
          :x-gap="12"
          :y-gap="8"
          cols="1 s:2 m:3 xl:4"
          responsive="screen"
        >
          <n-grid-item v-for="(plugin, index) in filteredPlugins" :key="index">
            <PluginCard :plugin="plugin" @log="openLogModal" @config="openConfigModal"></PluginCard>
          </n-grid-item>
        </n-grid>

        <n-empty v-else class="empty" :description="$t('views.pluginCenter.emptyText')"> </n-empty>
      </n-scrollbar>
    </div>
    <LogModal ref="logModalRef"></LogModal>
    <ConfigModal ref="configModalRef"></ConfigModal>
  </div>
</template>

<style scoped lang="less">
.plugin-center {
  padding: 18px;
  height: calc(100vh - 69px);

  .container {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
    position: relative;

    .top {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .empty {
      position: absolute;
      left: 50%;
      top: 35%;
      transform: translateX(-50%);
    }
  }
}
</style>
