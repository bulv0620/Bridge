<script setup lang="ts">
import { Add, Pause, Play, SettingsOutline, Stop, TrashBinOutline } from '@vicons/ionicons5'
import { useDownloaderActions } from '@renderer/composables/downloader/useDownloaderAction'
import { useSettingDrawer } from '@renderer/composables/downloader/useSettingDrawer'
import { useAria2 } from '@renderer/composables/downloader/useAria2'
import { useCreateDownloadTaskModal } from '@renderer/composables/downloader/useCreateDownloadTaskModal'

const { aria2 } = useAria2()
const { showSettingDrawer } = useSettingDrawer()
const { startLoading, pauseLoading, stopLoading, removeLoading } = useDownloaderActions()
const { startTasks, pauseTasks, stopTasks, removeTasks } = useDownloaderActions()
const { openCreateTaskModal } = useCreateDownloadTaskModal()
</script>

<template>
  <n-space>
    <el-tooltip
      :content="$t('views.downloader.createTask')"
      placement="bottom"
      effect="light"
      :show-after="500"
      :hide-after="0"
      :disabled="!aria2"
    >
      <el-button
        type="primary"
        circle
        :icon="Add"
        :disabled="!aria2"
        @click="openCreateTaskModal()"
      ></el-button>
    </el-tooltip>

    <el-tooltip
      :content="$t('views.downloader.startTask')"
      placement="bottom"
      effect="light"
      :show-after="500"
      :hide-after="0"
      :disabled="!aria2"
    >
      <el-button
        circle
        :icon="Play"
        :disabled="!aria2"
        :loading="startLoading"
        text
        bg
        @click="startTasks()"
      ></el-button>
    </el-tooltip>

    <el-tooltip
      :content="$t('views.downloader.pauseTask')"
      placement="bottom"
      effect="light"
      :show-after="500"
      :hide-after="0"
      :disabled="!aria2"
    >
      <el-button
        circle
        :icon="Pause"
        :disabled="!aria2"
        :loading="pauseLoading"
        text
        bg
        @click="pauseTasks"
      ></el-button>
    </el-tooltip>

    <el-tooltip
      :content="$t('views.downloader.stopTask')"
      placement="bottom"
      effect="light"
      :show-after="500"
      :hide-after="0"
      :disabled="!aria2"
    >
      <el-button
        circle
        :icon="Stop"
        :disabled="!aria2"
        :loading="stopLoading"
        text
        bg
        @click="stopTasks"
      ></el-button>
    </el-tooltip>

    <el-tooltip
      :content="$t('views.downloader.removeTask')"
      placement="bottom"
      effect="light"
      :show-after="500"
      :hide-after="0"
      :disabled="!aria2"
    >
      <el-button
        circle
        :icon="TrashBinOutline"
        :disabled="!aria2"
        :loading="removeLoading"
        text
        bg
        @click="removeTasks"
      ></el-button>
    </el-tooltip>
  </n-space>

  <el-tooltip
    :content="$t('views.downloader.setting')"
    placement="bottom"
    effect="light"
    :show-after="500"
    :hide-after="0"
    :disabled="!aria2"
  >
    <el-button
      circle
      :icon="SettingsOutline"
      :disabled="!aria2"
      text
      bg
      @click="showSettingDrawer = true"
    ></el-button>
  </el-tooltip>
</template>
