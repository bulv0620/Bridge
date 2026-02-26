<script setup lang="ts">
import FileList from './components/file-list/FileList.vue'
import SyncForm from './components/sync-form/SyncForm.vue'
import SyncToolbar from './components/sync-toolbar/SyncToolbar.vue'
import IgnoredFoldersModal from './components/ignored-folders-modal/IgnoredFoldersModal.vue'
import SyncStatus from './components/sync-status/SyncStatus.vue'
import ConnectionModal from './components/connection-modal/ConnectionModal.vue'
import TabHeader from './components/tab-header/TabHeader.vue'
import { useActiveSyncSession } from '@renderer/composables/file-sync/useActiveSyncSession'
import { Plus } from '@element-plus/icons-vue'

const { activeSession, createSyncSession } = useActiveSyncSession()

defineOptions({
  name: 'FileSync',
})
</script>

<template>
  <div class="file-sync">
    <div v-if="!activeSession" class="no-session">
      <div class="empty-text">{{ $t('views.fileSync.createSyncSession') }}</div>
      <el-button
        type="primary"
        size="small"
        circle
        :icon="Plus"
        @click="createSyncSession"
      ></el-button>
    </div>

    <template v-else>
      <TabHeader></TabHeader>

      <div class="main">
        <SyncForm></SyncForm>
        <SyncToolbar></SyncToolbar>
        <div class="table">
          <FileList></FileList>
        </div>
      </div>

      <div class="footer"><SyncStatus></SyncStatus></div>
    </template>
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

  .no-session {
    width: 100%;
    height: 100%;
    display: flex;
    gap: 6px;
    justify-content: center;
    align-items: center;
    background: var(--el-fill-color);

    .empty-text {
      font-size: 16px;
      color: var(--el-text-color-placeholder);
    }
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
