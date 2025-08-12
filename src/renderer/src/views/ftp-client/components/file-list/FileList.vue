<script setup lang="ts">
import dayjs from 'dayjs'
import { nextTick, watch, h, computed, useTemplateRef } from 'vue'
import { FileInfo } from '@renderer/utils/file-system/FileSystem.adstract'
import FileNameWithIcon from './cells/FileNameWithIcon.vue'
import { formatBytes } from '@renderer/utils/format'
import { useI18n } from 'vue-i18n'
import { useFileList } from '@renderer/composables/ftp-client/useFileList'

import { useDropZone } from '@vueuse/core'
import { useFileUploadModal } from '@renderer/composables/ftp-client/useFileUploadModal'
import DropZoneOverlay from '@renderer/components/DropZoneOverlay.vue'

const { t } = useI18n()

const { openFileUploadModal } = useFileUploadModal()

const dropZoneRef = useTemplateRef('dropZoneRef')
const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop,
  multiple: true,
})

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

function onDrop(files: File[] | null) {
  if (files && files.length > 0) {
    openFileUploadModal(files.map((el) => el.path))
  }
}

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
  <div ref="dropZoneRef" class="file-list">
    <DropZoneOverlay :show="isOverDropZone"></DropZoneOverlay>
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
}
</style>
