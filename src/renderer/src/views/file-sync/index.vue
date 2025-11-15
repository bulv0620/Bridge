<script setup lang="ts">
import EditableTitle from './components/editable-title/EditableTitle.vue'
import FileList from './components/file-list/FileList.vue'
import PlanToolbar from './components/plan-toolbar/PlanToolbar.vue'
import SyncForm from './components/sync-form/SyncForm.vue'
import SyncToolbar from './components/sync-toolbar/SyncToolbar.vue'
import IgnoredFoldersModal from './components/ignored-folders-modal/IgnoredFoldersModal.vue'
import FtpConnectionModal from './components/ftp-connection-modal/FtpConnectionModal.vue'
import SyncStatus from './components/sync-status/SyncStatus.vue'
import PlanListModal from './components/plan-list-modal/PlanListModal.vue'

defineOptions({
  name: 'FileSync',
})
</script>

<template>
  <div class="file-sync">
    <div class="header">
      <EditableTitle></EditableTitle>
      <PlanToolbar></PlanToolbar>
    </div>

    <div class="main">
      <SyncForm></SyncForm>
      <SyncToolbar></SyncToolbar>
      <div class="table">
        <FileList></FileList>
      </div>
    </div>

    <div class="footer"><SyncStatus></SyncStatus></div>
  </div>
  <IgnoredFoldersModal></IgnoredFoldersModal>
  <FtpConnectionModal></FtpConnectionModal>
  <PlanListModal></PlanListModal>
</template>

<style lang="less" scoped>
.file-sync {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;

  .header {
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--el-border-color);
  }

  .main {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    .table {
      padding: 16px;
      flex: 1;
      overflow: hidden;
    }
  }

  .footer {
    height: 48px;
    padding: 0 16px;
    border-top: 1px solid var(--el-border-color);
  }
}
</style>
