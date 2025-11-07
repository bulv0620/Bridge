<script setup lang="ts">
import { Add, Pause, Play, SettingsOutline, Stop, TrashBinOutline } from '@vicons/ionicons5'
import { useDownloaderActions } from '@renderer/composables/downloader/useDownloaderAction'
import { useSettingDrawer } from '@renderer/composables/downloader/useSettingDrawer'
import { useAria2 } from '@renderer/composables/downloader/useAria2'
import { useCreateDownloadTaskModal } from '@renderer/composables/downloader/useCreateDownloadTaskModal'
import { useTaskList } from '@renderer/composables/downloader/useTaskList'

const { aria2 } = useAria2()
const { showSettingDrawer } = useSettingDrawer()
const { checkedTasks } = useTaskList()
const { startLoading, pauseLoading, stopLoading, removeLoading } = useDownloaderActions()
const { startTasks, pauseTasks, stopTasks, removeTasks } = useDownloaderActions()
const { openCreateTaskModal } = useCreateDownloadTaskModal()
</script>

<template>
  <n-space>
    <CommonButton
      :tooltip="$t('views.downloader.createTask')"
      :icon="Add"
      :button-props="{ size: 'small', circle: true, type: 'primary' }"
      placement="bottom"
      :delay="500"
      :disabled="!aria2"
      @click="openCreateTaskModal()"
    />
    <CommonButton
      :tooltip="$t('views.downloader.startTask')"
      :icon="Play"
      :button-props="{ size: 'small', circle: true }"
      placement="bottom"
      :delay="500"
      :disabled="checkedTasks.length === 0"
      :loading="startLoading"
      @click="startTasks"
    />
    <CommonButton
      :tooltip="$t('views.downloader.pauseTask')"
      :icon="Pause"
      :button-props="{ size: 'small', circle: true }"
      placement="bottom"
      :delay="500"
      :disabled="checkedTasks.length === 0"
      :loading="pauseLoading"
      @click="pauseTasks"
    />
    <CommonButton
      :tooltip="$t('views.downloader.stopTask')"
      :icon="Stop"
      :button-props="{ size: 'small', circle: true }"
      placement="bottom"
      :delay="500"
      :disabled="checkedTasks.length === 0"
      :loading="stopLoading"
      @click="stopTasks"
    />

    <CommonButton
      :tooltip="$t('views.downloader.removeTask')"
      :icon="TrashBinOutline"
      :button-props="{ size: 'small', circle: true }"
      placement="bottom"
      :delay="500"
      :disabled="checkedTasks.length === 0"
      :loading="removeLoading"
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
