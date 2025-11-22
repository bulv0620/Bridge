<script setup lang="ts">
import FileList from './components/file-list/FileList.vue'
import SyncForm from './components/sync-form/SyncForm.vue'
import SyncToolbar from './components/sync-toolbar/SyncToolbar.vue'
import IgnoredFoldersModal from './components/ignored-folders-modal/IgnoredFoldersModal.vue'
import SyncStatus from './components/sync-status/SyncStatus.vue'
import ConnectionModal from './components/connection-modal/ConnectionModal.vue'
import TabHeader from './components/tab-header/TabHeader.vue'

defineOptions({
  name: 'FileSync',
})
</script>

<template>
  <div class="file-sync">
    <TabHeader></TabHeader>

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
  <ConnectionModal></ConnectionModal>
</template>

<style lang="less" scoped>
.file-sync {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;

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
