<script setup lang="ts">
import SettingDrawer from './components/setting-drawer/SettingDrawer.vue'
import CreateTaskModal from './components/create-task-modal/CreateTaskModal.vue'
import DownloadToolbar from './components/download-toolbar/DownloadToolbar.vue'
import DownloadStatus from './components/download-status/DownloadStatus.vue'
import TaskListTab from './components/task-list-tab/TaskListTab.vue'
import TaskList from './components/task-list/TaskList.vue'
import { useRoute, useRouter } from 'vue-router'
import { onActivated, onDeactivated, watch } from 'vue'
import { useCreateDownloadTaskModal } from '@renderer/composables/downloader/useCreateDownloadTaskModal'
import { useTaskList } from '@renderer/composables/downloader/useTaskList'

defineOptions({
  name: 'Downloader',
})

const route = useRoute()
const router = useRouter()

const { openCreateTaskModal } = useCreateDownloadTaskModal()
const { startPolling, stopPolling } = useTaskList()

function checkDownloadTask() {
  const url = route.query.url as string

  if (url) {
    openCreateTaskModal(url)

    router.replace({
      path: router.currentRoute.value.path,
      query: {},
    })
  }
}

watch(
  () => route.query,
  () => {
    checkDownloadTask()
  },
  { deep: true, immediate: true },
)

onDeactivated(() => {
  stopPolling()
})

onActivated(() => {
  startPolling(1000)
})
</script>

<template>
  <div id="downloader-drawer-target" class="downloader">
    <div class="header">
      <DownloadToolbar></DownloadToolbar>
    </div>
    <div class="main">
      <TaskListTab></TaskListTab>
      <TaskList></TaskList>
    </div>
    <div class="footer">
      <DownloadStatus></DownloadStatus>
    </div>
  </div>
  <SettingDrawer></SettingDrawer>
  <CreateTaskModal ref="createTaskModalRef"></CreateTaskModal>
</template>

<style lang="less" scoped>
.downloader {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;

  .header {
    padding: 16px;
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid var(--el-border-color);
  }

  .main {
    flex: 1;
    overflow: hidden;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .footer {
    height: 48px;
    padding: 0 16px;
    display: flex;
    gap: 8px;
    justify-content: end;
    align-items: center;
    border-top: 1px solid var(--el-border-color);
  }
}
</style>
