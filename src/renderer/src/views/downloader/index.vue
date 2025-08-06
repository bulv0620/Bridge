<script setup lang="ts">
import SettingDrawer from './components/setting-drawer/SettingDrawer.vue'
import CreateTaskModal from './components/create-task-modal/CreateTaskModal.vue'
import DownloadToolbar from './components/download-toolbar/DownloadToolbar.vue'
import DownloadStatus from './components/download-status/DownloadStatus.vue'
import TaskListTab from './components/task-list-tab/TaskListTab.vue'
import TaskList from './components/task-list/TaskList.vue'
import { useRoute, useRouter } from 'vue-router'
import { watch } from 'vue'
import { useCreateDownloadTaskModal } from '@renderer/composables/downloader/useCreateDownloadTaskModal'

defineOptions({
  name: 'Downloader',
})

const route = useRoute()
const router = useRouter()

const { openCreateTaskModal } = useCreateDownloadTaskModal()

watch(
  () => route.query.url,
  (url: any) => {
    if (url) {
      openCreateTaskModal(url)

      router.replace({
        path: router.currentRoute.value.path,
        query: {},
      })
    }
  },
)
</script>

<template>
  <div id="setting-drawer-target" class="downloader">
    <div class="header">
      <DownloadToolbar></DownloadToolbar>
    </div>
    <n-divider style="margin: 0"></n-divider>
    <div class="main">
      <TaskListTab></TaskListTab>
      <TaskList></TaskList>
    </div>
    <n-divider style="margin: 0"></n-divider>
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
  height: calc(100vh - 33px);
  display: flex;
  flex-direction: column;

  .header {
    padding: 16px;
    display: flex;
    justify-content: space-between;
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
    padding: 16px;
    display: flex;
    gap: 8px;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
