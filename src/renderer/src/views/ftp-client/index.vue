<script setup lang="ts">
import { ref } from 'vue'
import { Cloud } from '@vicons/ionicons5'
import Empty from './components/empty-state/EmptyState.vue'
import FileBrowser from './components/file-browser/FileBrowser.vue'
import FtpConfigModal from './components/ftp-config-modal/FtpConfigModal.vue'
import FileDownloadModal from './components/file-download-modal/FileDownloadModal.vue'
import FileUploadModal from './components/file-upload-modal/FileUploadModal.vue'
import { FtpFileSystem } from '@renderer/utils/file-system'
import { useFtp } from '@renderer/composables/ftp'

const ftpConfigModalRef = ref<InstanceType<typeof FtpConfigModal> | null>(null)
const fileUploadModalRef = ref<InstanceType<typeof FileUploadModal> | null>(null)
const fileDownloadModalRef = ref<InstanceType<typeof FileDownloadModal> | null>(null)

const { instanceNameList, currentInstanceName, removeFtpInstance, addFtpInstance } = useFtp()

async function handleAdd() {
  const ftpInstance: FtpFileSystem = await ftpConfigModalRef.value?.select()

  if (ftpInstance) {
    addFtpInstance(ftpInstance)
  }
}

function handleOpenUpload() {
  fileUploadModalRef.value?.open()
}

function handleOpenDownload() {
  fileDownloadModalRef.value?.open()
}
</script>

<template>
  <div class="ftp-client">
    <n-tabs
      v-model:value="currentInstanceName"
      type="card"
      closable
      addable
      tab-style="min-width: 80px;"
      size="small"
      class="custom-tabs"
      @close="removeFtpInstance"
      @add="handleAdd"
    >
      <n-tab-pane v-for="item in instanceNameList" :key="item" :name="item">
        <template #tab>
          <n-icon style="margin-right: 8px">
            <Cloud />
          </n-icon>
          <span>{{ item }}</span>
        </template>
      </n-tab-pane>
      <template #prefix> <span></span> </template>
      <template #suffix> <span></span> </template>
    </n-tabs>

    <div class="ftp-client-content">
      <Empty v-if="!instanceNameList.length" @add="handleAdd"></Empty>
      <FileBrowser v-else @upload="handleOpenUpload" @download="handleOpenDownload"></FileBrowser>
    </div>
    <FtpConfigModal ref="ftpConfigModalRef" :instance-list="instanceNameList"></FtpConfigModal>
    <FileDownloadModal ref="fileDownloadModalRef" />
    <FileUploadModal ref="fileUploadModalRef" />
  </div>
</template>

<style lang="less" scoped>
.ftp-client {
  padding: 6px 0;
  overflow: hidden;
  height: calc(100vh - 45px);

  .ftp-client-content {
    height: calc(100% - 34px);
  }

  :deep(.n-tab-pane) {
    padding: 0;
  }
}
</style>
