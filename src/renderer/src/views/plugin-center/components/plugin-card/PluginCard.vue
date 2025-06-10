<script setup lang="ts">
import { Play, Settings, DocumentText, Stop } from '@vicons/ionicons5'
import { PluginInfo } from '../../types'
import { ref, onMounted, toRaw, computed } from 'vue'
import { useMessage } from 'naive-ui'

const fs = window.api.fsSync
const os = window.api.os
const ipcRenderer = window.electron.ipcRenderer

const props = defineProps<{
  plugin: PluginInfo
}>()

const emits = defineEmits<{
  (e: 'log', path: string): void
  (e: 'config', path: string): void
}>()

const loading = ref(false)
const isRunning = ref(false)

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

const handleStartPlugin = async () => {
  loading.value = true
  try {
    await ipcRenderer.invoke('start-plugin', toRaw(props.plugin))
    // 等待插件启动完成
    await delay(1000)
    handleCheckPluginStatus()
  } catch (error) {
    message.error((error as any).message)
  } finally {
    loading.value = false
  }
}

const handleStopPlugin = async () => {
  loading.value = true
  try {
    await ipcRenderer.invoke('stop-plugin', toRaw(props.plugin))
    // 等待插件启动完成
    await delay(1000)
    handleCheckPluginStatus()
  } catch (error) {
    message.error((error as any).message)
  } finally {
    loading.value = false
  }
}

const handleCheckPluginStatus = async () => {
  const result = await ipcRenderer.invoke('check-plugin-status', props.plugin.name)

  isRunning.value = result
}

const delay = (ms: number) => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}

const handleShowLog = () => {
  let logPath: string

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

const handleShowConfig = () => {
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
  handleCheckPluginStatus()
})
</script>

<template>
  <n-card class="plugin-item" hoverable>
    <div class="plugin-item__info">
      <img class="icon" :src="getImgData(plugin.iconPath)" />
      <div class="text">
        <p class="title">
          {{ plugin.desc.title }}
        </p>
        <p class="summary" :title="plugin.desc.summary">
          {{ plugin.desc.summary }}
        </p>
      </div>
    </div>
    <n-divider style="margin: 12px 0" />
    <div class="plugin-item__option">
      <n-tooltip v-if="isRunning" trigger="hover" placement="bottom" :delay="500">
        <template #trigger>
          <n-button
            :loading="loading"
            strong
            secondary
            circle
            type="error"
            size="small"
            :disabled="!isAvailable"
            @click="handleStopPlugin"
          >
            <template #icon>
              <n-icon><Stop /></n-icon>
            </template>
          </n-button>
        </template>
        {{ $t('views.pluginCenter.stop') }}
      </n-tooltip>
      <n-tooltip v-else trigger="hover" placement="bottom" :delay="500">
        <template #trigger>
          <n-button
            :loading="loading"
            strong
            secondary
            circle
            type="success"
            size="small"
            :disabled="!isAvailable"
            @click="handleStartPlugin"
          >
            <template #icon>
              <n-icon><Play /></n-icon>
            </template>
          </n-button>
        </template>
        {{ $t('views.pluginCenter.run') }}
      </n-tooltip>
      <n-tooltip trigger="hover" placement="bottom" :delay="500">
        <template #trigger>
          <n-button
            strong
            secondary
            circle
            type="info"
            size="small"
            :disabled="!isAvailable"
            @click="handleShowConfig"
          >
            <template #icon>
              <n-icon><Settings /></n-icon>
            </template>
          </n-button>
        </template>
        {{ $t('views.pluginCenter.config') }}
      </n-tooltip>
      <n-tooltip trigger="hover" placement="bottom" :delay="500">
        <template #trigger>
          <n-button
            strong
            secondary
            circle
            type="warning"
            size="small"
            :disabled="!isAvailable"
            @click="handleShowLog"
          >
            <template #icon>
              <n-icon><DocumentText /></n-icon>
            </template>
          </n-button>
        </template>
        {{ $t('views.pluginCenter.viewLog') }}
      </n-tooltip>

      <n-tag v-if="isAvailable" type="success" class="tag" size="small">
        {{ $t('views.pluginCenter.available') }}
      </n-tag>
      <n-tag v-else type="error" class="tag" size="small">
        {{ $t('views.pluginCenter.unavailable') }}
      </n-tag>
    </div>
  </n-card>
</template>

<style lang="less" scoped>
.plugin-item {
  width: 100%;
  height: 150px;
  border-radius: 3px;

  .plugin-item__info {
    display: flex;
    align-items: center;
    gap: 16px;

    .icon {
      width: 36px;
    }

    .text {
      overflow: hidden;
      flex: 1;
      width: 100%;

      .title {
        font-size: 14px;
        width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-bottom: 2px;
      }

      .summary {
        font-size: 12px;
        line-height: normal;
        display: -webkit-box;
        line-clamp: 2;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
        height: 32px;
      }
    }
  }

  .plugin-item__option {
    display: flex;
    gap: 12px;
    align-items: center;

    .tag {
      margin-left: auto;
    }
  }
}
</style>
