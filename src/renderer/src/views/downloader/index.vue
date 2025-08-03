<script setup lang="ts">
import { useAria2 } from '@renderer/composables/aria2'
import SettingDrawer from './components/setting-drawer/SettingDrawer.vue'
import TaskBrowser from './components/task-browser/TaskBrowser.vue'
import { onActivated, onDeactivated, onMounted, ref, watch } from 'vue'
import { formatBytesPerSecond } from '@renderer/utils/aria2/utils'
import { Add, Pause, Play, SettingsOutline, TrashBinOutline } from '@vicons/ionicons5'

const { startPolling, stopPolling, isConnected, globalStats } = useAria2()

const showSettingDrawer = ref(false)

onActivated(() => {
  startPolling(1000)
})

onDeactivated(() => {
  stopPolling()
})

onMounted(() => {
  startPolling(1000)
})

watch(isConnected, (connected) => {
  if (connected) {
    startPolling(1000)
  } else {
    stopPolling()
  }
})
</script>

<template>
  <div id="setting-drawer-target" class="downloader">
    <div class="header">
      <n-space>
        <CommonButton
          :tooltip="$t('views.downloader.createTask')"
          :icon="Add"
          :button-props="{ size: 'small', circle: true, type: 'primary' }"
          placement="bottom"
          :delay="500"
        />
        <CommonButton
          :tooltip="$t('views.downloader.startTask')"
          :icon="Play"
          :button-props="{ size: 'small', circle: true }"
          placement="bottom"
          :delay="500"
        />
        <CommonButton
          :tooltip="$t('views.downloader.pauseTask')"
          :icon="Pause"
          :button-props="{ size: 'small', circle: true }"
          placement="bottom"
          :delay="500"
        />
        <CommonButton
          :tooltip="$t('views.downloader.removeTask')"
          :icon="TrashBinOutline"
          :button-props="{ size: 'small', circle: true }"
          placement="bottom"
          :delay="500"
        />
      </n-space>
      <CommonButton
        :tooltip="$t('views.downloader.setting')"
        :icon="SettingsOutline"
        :button-props="{ size: 'small', circle: true }"
        placement="bottom"
        :delay="500"
        @click="showSettingDrawer = true"
      />
    </div>
    <n-divider style="margin: 0"></n-divider>
    <TaskBrowser></TaskBrowser>
    <n-divider style="margin: 0"></n-divider>
    <div class="footer">
      <n-tag v-if="isConnected" size="small" type="success">
        {{ $t('views.downloader.connected') }}
      </n-tag>
      <n-tag v-else size="small" type="error">{{ $t('views.downloader.disconnected') }}</n-tag>
      <n-space style="font-size: 14px">
        <span>
          {{ $t('views.downloader.uploadSpeed') }}:
          {{ formatBytesPerSecond(globalStats?.uploadSpeed || 0) }}
        </span>
        <span>
          {{ $t('views.downloader.downloadSpeed') }}:
          {{ formatBytesPerSecond(globalStats?.downloadSpeed || 0) }}
        </span>
      </n-space>
    </div>
  </div>
  <SettingDrawer v-model:show="showSettingDrawer"></SettingDrawer>
</template>

<style lang="less" scoped>
.downloader {
  width: 100%;
  height: calc(100vh - 33px);
  display: flex;
  flex-direction: column;

  .header {
    padding: 16px;
    display: flex;
    justify-content: space-between;
  }

  .footer {
    padding: 16px;
    display: flex;
    gap: 8px;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
