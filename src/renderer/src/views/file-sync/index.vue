<script setup lang="ts">
import FileList from './components/file-list/FileList.vue'
import SyncForm from './components/sync-form/SyncForm.vue'
import SyncToolbar from './components/sync-toolbar/SyncToolbar.vue'
import IgnoredFoldersModal from './components/ignored-folders-modal/IgnoredFoldersModal.vue'
import SyncStatus from './components/sync-status/SyncStatus.vue'
import ConnectionModal from './components/connection-modal/ConnectionModal.vue'
import TabHeader from './components/tab-header/TabHeader.vue'
import { useActiveSyncSession } from '@renderer/composables/file-sync/useActiveSyncSession'
import { FolderOpened, Plus, Switch } from '@element-plus/icons-vue'

const { activeSession, createSyncSession } = useActiveSyncSession()

defineOptions({
  name: 'FileSync',
})
</script>

<template>
  <div class="file-sync">
    <div v-if="!activeSession" class="no-session">
      <div class="empty-state">
        <div class="empty-visual" aria-hidden="true">
          <div class="folder-node source-node">
            <el-icon><FolderOpened /></el-icon>
          </div>
          <div class="sync-link">
            <span class="link-line"></span>
            <span class="link-icon"
              ><el-icon><Switch /></el-icon
            ></span>
          </div>
          <div class="folder-node target-node">
            <el-icon><FolderOpened /></el-icon>
          </div>
        </div>

        <div class="empty-copy">
          <h1>{{ $t('views.fileSync.emptyStateTitle') }}</h1>
          <p>{{ $t('views.fileSync.emptyStateDescription') }}</p>
        </div>

        <el-button type="primary" :icon="Plus" @click="createSyncSession">
          {{ $t('views.fileSync.createSyncSession') }}
        </el-button>
      </div>
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
  height: 100%;
  display: flex;
  flex-direction: column;

  .no-session {
    width: 100%;
    height: 100%;
    padding: var(--bridge-page-padding);
    display: grid;
    place-items: center;
    background: var(--bridge-surface);

    .empty-state {
      width: min(100%, 430px);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;

      .empty-visual {
        height: 104px;
        margin-bottom: 22px;
        display: flex;
        align-items: center;
        justify-content: center;

        .folder-node {
          width: 64px;
          height: 64px;
          display: grid;
          place-items: center;
          border-radius: 18px;
          color: var(--el-color-primary);
          background: var(--bridge-surface-soft);
          box-shadow:
            var(--bridge-shadow-sm),
            inset 0 0 0 1px var(--bridge-stroke);

          .el-icon {
            font-size: 28px;
          }
        }

        .source-node {
          transform: translateY(9px);
        }

        .target-node {
          color: var(--el-color-success);
          transform: translateY(-9px);
        }

        .sync-link {
          width: 82px;
          height: 38px;
          position: relative;
          display: grid;
          place-items: center;

          .link-line {
            position: absolute;
            inset-inline: 8px;
            top: 50%;
            border-top: 1px dashed var(--el-border-color);
          }

          .link-icon {
            width: 32px;
            height: 32px;
            position: relative;
            display: grid;
            place-items: center;
            border-radius: 10px;
            color: var(--el-text-color-secondary);
            background: var(--bridge-surface);
            box-shadow: inset 0 0 0 1px var(--bridge-stroke);
          }
        }
      }

      .empty-copy {
        margin-bottom: 22px;

        h1 {
          margin-bottom: 8px;
          color: var(--el-text-color-primary);
          font-size: 20px;
          line-height: 1.35;
          font-weight: 650;
          letter-spacing: -0.02em;
        }

        p {
          max-width: 390px;
          color: var(--el-text-color-secondary);
          font-size: 14px;
          line-height: 1.65;
        }
      }
    }
  }

  .main {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: var(--bridge-surface);

    .table {
      padding: var(--bridge-page-padding);
      flex: 1;
      overflow: hidden;
      min-height: 0;
    }
  }

  .footer {
    height: 44px;
    margin: 0 var(--bridge-page-padding) var(--bridge-page-padding);
    padding: 0 14px;
    border-radius: 10px;
    background: var(--bridge-surface-soft);
    box-shadow: inset 0 0 0 1px var(--bridge-stroke);
  }
}
</style>
