<script setup lang="ts">
import { Add, Pause, Play, SettingsOutline, Stop, TrashBinOutline } from '@vicons/ionicons5'
import { useDownloaderActions } from '@renderer/composables/downloader/useDownloaderAction'
import { useDownloader } from '@renderer/composables/downloader/useDownloader'
import { useSettingDrawer } from '@renderer/composables/downloader/useSettingDrawer'

const { showSettingDrawer } = useSettingDrawer()
const { checkedTasks, startLoading, pauseLoading, stopLoading, removeLoading } = useDownloader()
const { createTask, startTasks, pauseTasks, stopTasks, removeTasks } = useDownloaderActions()
</script>

<template>
  <n-space>
    <CommonButton
      :tooltip="$t('views.downloader.createTask')"
      :icon="Add"
      :button-props="{ size: 'small', circle: true, type: 'primary' }"
      placement="bottom"
      :delay="500"
      @click="createTask"
    />
    <CommonButton
      :tooltip="$t('views.downloader.startTask')"
      :icon="Play"
      :button-props="{ size: 'small', circle: true, loading: startLoading }"
      placement="bottom"
      :delay="500"
      :disabled="checkedTasks.length === 0"
      @click="startTasks"
    />
    <CommonButton
      :tooltip="$t('views.downloader.pauseTask')"
      :icon="Pause"
      :button-props="{ size: 'small', circle: true, loading: pauseLoading }"
      placement="bottom"
      :delay="500"
      :disabled="checkedTasks.length === 0"
      @click="pauseTasks"
    />
    <CommonButton
      :tooltip="$t('views.downloader.stopTask')"
      :icon="Stop"
      :button-props="{ size: 'small', circle: true, loading: stopLoading }"
      placement="bottom"
      :delay="500"
      :disabled="checkedTasks.length === 0"
      @click="stopTasks"
    />

    <CommonButton
      :tooltip="$t('views.downloader.removeTask')"
      :icon="TrashBinOutline"
      :button-props="{ size: 'small', circle: true, loading: removeLoading }"
      placement="bottom"
      :delay="500"
      :disabled="checkedTasks.length === 0"
      @click="removeTasks"
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
</template>
