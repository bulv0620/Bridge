<script setup lang="ts">
import { useAria2 } from '@renderer/composables/aria2'
import SettingDrawer from './components/setting-drawer/SettingDrawer.vue'
import TaskBrowser from './components/task-browser/TaskBrowser.vue'
import { onActivated, onDeactivated, onMounted, ref } from 'vue'
import { formatBytesPerSecond } from '@renderer/utils/format'
import { Add, Pause, Play, SettingsOutline, Stop, TrashBinOutline } from '@vicons/ionicons5'
import CreateTaskModal from './components/create-task-modal/CreateTaskModal.vue'
import { useDialog, useMessage } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { dialogPromise } from '@renderer/utils/dialog'

const message = useMessage()
const dialog = useDialog()
const { t } = useI18n()

const { aria2, startPolling, stopPolling, isConnected, globalStats, checkedRowKeys, checkedTasks } =
  useAria2()

const showSettingDrawer = ref(false)
const showCreateTaskModal = ref(false)

const startLoading = ref(false)
const pauseLoading = ref(false)
const stopLoading = ref(false)
const removeLoading = ref(false)

function handleCreateTask() {
  if (!aria2.value || !isConnected.value) {
    message.warning(t('views.downloader.pleaseConnectFirst'))
    return
  }
  showCreateTaskModal.value = true
}

async function handleStartTask() {
  if (!checkedTasks.value.length) return

  const toStart = checkedTasks.value.filter(
    (task) => task.status === 'paused' || task.status === 'waiting',
  )
  if (!toStart.length) {
    message.info(t('views.downloader.noTaskToStart'))
    return
  }

  try {
    startLoading.value = true
    await Promise.all(toStart.map((task) => aria2.value?.unpause(task.gid)))
    message.success(t('views.downloader.startSuccess'))
  } catch (err) {
    message.error(t('views.downloader.startFailed'))
  } finally {
    startLoading.value = false
    checkedRowKeys.value = []
  }
}

async function handlePauseTask() {
  if (!checkedTasks.value.length) return

  const toPause = checkedTasks.value.filter((task) => task.status === 'active')
  if (!toPause.length) {
    message.info(t('views.downloader.noTaskToPause'))
    return
  }

  try {
    pauseLoading.value = true
    await Promise.all(toPause.map((task) => aria2.value?.pause(task.gid)))
    message.success(t('views.downloader.pauseSuccess'))
  } catch (err) {
    message.error(t('views.downloader.pauseFailed'))
  } finally {
    pauseLoading.value = false
    checkedRowKeys.value = []
  }
}

async function handleStopTask() {
  if (!checkedTasks.value.length) return

  const activeStates = ['active', 'waiting', 'paused']
  const tasksToStop = checkedTasks.value.filter((task) => activeStates.includes(task.status))

  if (!tasksToStop.length) {
    message.info(t('views.downloader.noTaskToStop'))
    return
  }

  await dialogPromise(dialog.warning, {
    title: t('common.warning'),
    content: t('views.downloader.stopConfirm'),
    positiveText: t('common.confirm'),
    negativeText: t('common.cancel'),
  })

  try {
    stopLoading.value = true

    await Promise.all(tasksToStop.map((task) => aria2.value?.remove(task.gid)))

    message.success(t('views.downloader.stopSuccess'))
  } catch (err) {
    message.error(t('views.downloader.stopFailed'))
  } finally {
    stopLoading.value = false
    checkedRowKeys.value = []
  }
}

async function handleRemoveTask() {
  if (!checkedTasks.value.length) return

  const removableStates = ['complete', 'error', 'removed']
  const tasksToRemove = checkedTasks.value.filter((task) => removableStates.includes(task.status))

  if (!tasksToRemove.length) {
    message.info(t('views.downloader.noTaskToRemove'))
    return
  }

  await dialogPromise(dialog.warning, {
    title: t('common.warning'),
    content: t('views.downloader.removeConfirm'),
    positiveText: t('common.confirm'),
    negativeText: t('common.cancel'),
  })

  try {
    removeLoading.value = true

    await Promise.all(tasksToRemove.map((task) => aria2.value?.removeDownloadResult(task.gid)))

    message.success(t('views.downloader.removeSuccess'))
  } catch (err) {
    message.error(t('views.downloader.removeFailed'))
  } finally {
    removeLoading.value = false
    checkedRowKeys.value = []
  }
}

onActivated(() => {
  startPolling(1000)
})

onDeactivated(() => {
  stopPolling()
})

onMounted(() => {
  startPolling(1000)
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
          @click="handleCreateTask"
        />
        <CommonButton
          :tooltip="$t('views.downloader.startTask')"
          :icon="Play"
          :button-props="{ size: 'small', circle: true, loading: startLoading }"
          placement="bottom"
          :delay="500"
          :disabled="checkedTasks.length === 0"
          @click="handleStartTask"
        />
        <CommonButton
          :tooltip="$t('views.downloader.pauseTask')"
          :icon="Pause"
          :button-props="{ size: 'small', circle: true, loading: pauseLoading }"
          placement="bottom"
          :delay="500"
          :disabled="checkedTasks.length === 0"
          @click="handlePauseTask"
        />
        <CommonButton
          :tooltip="$t('views.downloader.stopTask')"
          :icon="Stop"
          :button-props="{ size: 'small', circle: true, loading: stopLoading }"
          placement="bottom"
          :delay="500"
          :disabled="checkedTasks.length === 0"
          @click="handleStopTask"
        />

        <CommonButton
          :tooltip="$t('views.downloader.removeTask')"
          :icon="TrashBinOutline"
          :button-props="{ size: 'small', circle: true, loading: removeLoading }"
          placement="bottom"
          :delay="500"
          :disabled="checkedTasks.length === 0"
          @click="handleRemoveTask"
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
  <CreateTaskModal v-model:show="showCreateTaskModal"></CreateTaskModal>
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
