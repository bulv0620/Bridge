<script setup lang="ts">
import FtpClientTab from './components/ftp-client-tab/FtpClientTab.vue'
import Empty from './components/empty-state/EmptyState.vue'
import FtpConnectModal from './components/ftp-connect-modal/FtpConnectModal.vue'
import FileDeleteModal from './components/file-delete-modal/FileDeleteModal.vue'
import FileDownloadModal from './components/file-download-modal/FileDownloadModal.vue'
import FileUploadModal from './components/file-upload-modal/FileUploadModal.vue'
import ConfirmOverwriteDialog from './components/confirm-overwrite-dialog/ConfirmOverwriteDialog.vue'
import FolderNameDialog from './components/folder-name-dialog/FolderNameDialog.vue'
import FileList from './components/file-list/FileList.vue'
import FileBreadcrumb from './components/file-breadcrumb/FileBreadcrumb.vue'
import FileToolbar from './components/file-toolbar/FileToolbar.vue'

import { useFtpClient } from '@renderer/composables/ftp-client/useFtpClient'
import { useFtpConnectModal } from '@renderer/composables/ftp-client/useFtpConnectModal'

defineOptions({
  name: 'FtpClient',
})

const { instanceNameList } = useFtpClient()
const { openFtpConnectModal } = useFtpConnectModal()
</script>

<template>
  <div class="ftp-client">
    <FtpClientTab></FtpClientTab>

    <div class="ftp-client-content">
      <Empty v-if="!instanceNameList.length" @add="openFtpConnectModal"></Empty>

      <div v-else class="file-browser">
        <n-space justify="space-between">
          <FileBreadcrumb></FileBreadcrumb>
          <FileToolbar></FileToolbar>
        </n-space>
        <FileList></FileList>
      </div>
    </div>
    <FtpConnectModal></FtpConnectModal>
    <FileDeleteModal></FileDeleteModal>
    <FileDownloadModal></FileDownloadModal>
    <FileUploadModal></FileUploadModal>
    <ConfirmOverwriteDialog></ConfirmOverwriteDialog>
    <FolderNameDialog></FolderNameDialog>
  </div>
</template>

<style lang="less" scoped>
.ftp-client {
  padding: 6px 0;
  overflow: hidden;
  height: calc(100vh - 45px);

  .ftp-client-content {
    height: calc(100% - 34px);

    .file-browser {
      height: calc(100% - 24px);
      padding: 12px 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
  }

  :deep(.n-tab-pane) {
    padding: 0;
  }
}
</style>
