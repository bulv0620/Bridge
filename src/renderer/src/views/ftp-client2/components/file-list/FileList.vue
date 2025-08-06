<script setup lang="ts">
import dayjs from 'dayjs'
import { nextTick, watch, h, computed } from 'vue'
import { FileInfo } from '@renderer/utils/file-system/FileSystem.adstract'
import FileNameWithIcon from './cells/FileNameWithIcon.vue'
import { formatBytes } from '@renderer/utils/format'
import { useI18n } from 'vue-i18n'
import { useFileList } from '@renderer/composables/ftp-client/useFileList'
import { PushOutline } from '@vicons/ionicons5'
import { useDropFiles } from '@renderer/composables/ftp-client/useDropFile'

const { t } = useI18n()

const { isDragging, onDragEnter, onDragOver, onDragLeave, onDrop } = useDropFiles()
const { currentInstancePath, loading, fileList, checkedRowKeys, getFiles, openFolder } =
  useFileList()

const columns = computed(() => [
  {
    type: 'selection',
  },
  {
    title: t('views.ftpClient.fileName'),
    key: 'fileName',
    ellipsis: { tooltip: true },
    resizable: true,
    sorter: (a: FileInfo, b: FileInfo) => {
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1
      }
      return a.fileName.localeCompare(b.fileName)
    },
    render(row: FileInfo) {
      return h(FileNameWithIcon, {
        fileName: row.fileName,
        isDirectory: row.isDirectory,
        onClick: () => openFolder(row),
      })
    },
  },
  {
    title: t('views.ftpClient.fileDate'),
    key: 'timestamp',
    ellipsis: { tooltip: true },
    resizable: true,
    sorter: (a: FileInfo, b: FileInfo) => {
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1
      }
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    },
    render(row: FileInfo) {
      return dayjs(row.timestamp).format('YYYY-MM-DD HH:mm:ss')
    },
  },
  {
    title: t('views.ftpClient.fileSize'),
    key: 'size',
    width: 170,
    ellipsis: { tooltip: true },
    sorter: (a: FileInfo, b: FileInfo) => {
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1
      }
      return a.size - b.size
    },
    render(row: FileInfo) {
      return row.isDirectory ? '_' : formatBytes(row.size)
    },
  },
])

watch(
  currentInstancePath,
  () => {
    nextTick(() => {
      getFiles()
    })
  },
  {
    immediate: true,
    deep: true,
  },
)
</script>

<template>
  <div
    class="file-list"
    :class="{ active: isDragging }"
    @dragenter.prevent="onDragEnter"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <div v-if="isDragging" class="overlay">
      <n-icon size="80">
        <PushOutline />
      </n-icon>
      <div>{{ $t('views.ftpClient.dropHere') }}</div>
    </div>
    <n-data-table
      v-model:checked-row-keys="checkedRowKeys"
      :loading="loading"
      size="small"
      :columns="columns"
      :data="fileList"
      virtual-scroll
      flex-height
      style="height: 100%"
    />
  </div>
</template>

<style lang="less" scoped>
.file-list {
  flex: 1;
  overflow: hidden;
  position: relative;

  .overlay {
    pointer-events: none;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.3);
    border-radius: 2px;
    display: flex;
    gap: 8px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: white;
    font-size: 24px;
    font-weight: bold;
    z-index: 10;
  }
}
</style>
