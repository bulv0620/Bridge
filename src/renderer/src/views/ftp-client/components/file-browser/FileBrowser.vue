<script setup lang="ts">
import { nextTick, ref, watch, h, computed } from 'vue'
import { Refresh, FolderOutline, TrashBinOutline } from '@vicons/ionicons5'
import { FileDownloadOutlined, FileUploadOutlined } from '@vicons/material'
import { useFtp } from '@renderer/composables/ftp'
import dayjs from 'dayjs'
import { FileInfo } from '@renderer/utils/file-system/FileSystem.adstract'
import FileNameWithIcon from './FileNameWithIcon.vue'
import { useMessage } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import FileBreadcrumb from './Breadcrumb.vue'
import FileDownloadModal from './FileDownloadModal.vue'
import FileUploadModal from './FileUploadModal.vue'

const { currentInstance, currentInstancePath } = useFtp()
const message = useMessage()
const { t } = useI18n()

const loading = ref(false)

const fileUploadModalRef = ref<InstanceType<typeof FileUploadModal> | null>(null)
const fileDownloadModalRef = ref<InstanceType<typeof FileDownloadModal> | null>(null)

// 文件列表数据
const data = ref<FileInfo[]>([])
// 列表列配置
const columns = computed(() => [
  {
    type: 'selection',
  },
  {
    title: t('views.ftpClient.fileName'),
    key: 'fileName',
    ellipsis: { tooltip: true },
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
        onClick: () => handleOpenFolder(row),
      })
    },
  },
  {
    title: t('views.ftpClient.fileDate'),
    key: 'timestamp',
    ellipsis: { tooltip: true },
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
    ellipsis: { tooltip: true },
    sorter: (a: FileInfo, b: FileInfo) => {
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1
      }
      return a.size - b.size
    },
    render(row: FileInfo) {
      return row.isDirectory ? '_' : formatFileSize(row.size)
    },
  },
])

// 转换文件大小为可读格式
// 例如：1024 -> 1.00 KB, 1048576 -> 1.00 MB
function formatFileSize(size: number): string {
  if (isNaN(size) || size < 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  let index = 0

  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index++
  }

  return `${size.toFixed(2)} ${units[index]}`
}

// 获取当前目录下的文件列表
async function getFiles() {
  try {
    loading.value = true

    data.value = []

    const valid = await currentInstance.value?.validate()
    if (!valid) {
      message.error(t('views.ftpClient.invalidInstance'))
      return
    }

    const result = await currentInstance.value?.listDir(currentInstancePath.value?.join('/'))

    if (result) {
      data.value = result.map((el) => ({
        ...el,
        key: crypto.randomUUID(),
      }))
    }

    currentInstance.value?.disconnect()
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 双击行时的处理逻辑
function handleOpenFolder(row: FileInfo) {
  if (row.isDirectory) {
    currentInstancePath.value?.push(row.fileName)
  }
}

// 打开上传弹窗
function handleOpenUpload() {
  fileUploadModalRef.value?.open()
}

// 打开下载弹窗
function handleOpenDownload() {
  fileDownloadModalRef.value?.open()
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
  <div class="file-browser">
    <n-space justify="space-between">
      <FileBreadcrumb></FileBreadcrumb>

      <n-space>
        <CommonButton
          :tooltip="$t('views.ftpClient.download')"
          :icon="FileDownloadOutlined"
          :button-props="{ size: 'small', circle: true }"
          placement="bottom"
          delay="500"
          @click="handleOpenDownload"
        />
        <CommonButton
          :tooltip="$t('views.ftpClient.upload')"
          :icon="FileUploadOutlined"
          :button-props="{ size: 'small', circle: true }"
          placement="bottom"
          delay="500"
          @click="handleOpenUpload"
        />
        <CommonButton
          :tooltip="$t('views.ftpClient.createFolder')"
          :icon="FolderOutline"
          :button-props="{ size: 'small', circle: true }"
          placement="bottom"
          delay="500"
        />
        <CommonButton
          :tooltip="$t('views.ftpClient.delete')"
          :icon="TrashBinOutline"
          :button-props="{ size: 'small', circle: true }"
          placement="bottom"
          delay="500"
        />
        <CommonButton
          :tooltip="$t('views.ftpClient.refresh')"
          :icon="Refresh"
          :loading="loading"
          :button-props="{ size: 'small', circle: true }"
          placement="bottom"
          delay="500"
          @click="getFiles"
        />
      </n-space>
    </n-space>
    <n-data-table
      :loading="loading"
      size="small"
      :columns="columns"
      :data="data"
      virtual-scroll
      flex-height
      style="height: 100%; user-select: none"
    />
    <FileDownloadModal ref="fileDownloadModalRef" />
    <FileUploadModal ref="fileUploadModalRef" />
  </div>
</template>

<style lang="less" scoped>
.file-browser {
  height: calc(100% - 24px);
  padding: 12px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
