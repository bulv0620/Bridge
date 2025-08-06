<script setup lang="ts">
import { nextTick, ref, watch, h, computed } from 'vue'
import { Refresh, FolderOutline, TrashBinOutline } from '@vicons/ionicons5'
import { FileDownloadOutlined, FileUploadOutlined } from '@vicons/material'
import { useFtpClient } from '@renderer/composables/ftp-client/useFtpClient'
import dayjs from 'dayjs'
import { FileInfo } from '@renderer/utils/file-system/FileSystem.adstract'
import FileNameWithIcon from './FileNameWithIcon.vue'
import { useDialog, useMessage } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import FileBreadcrumb from './Breadcrumb.vue'
import FileDownloadModal from './FileDownloadModal.vue'
import FileUploadModal from './FileUploadModal.vue'
import FileDeleteModal from './FileDeleteModal.vue'
import FolderNameDialog from './FolderNameDialog.vue'
import { dialogPromise } from '@renderer/utils/dialog'
import { PushOutline } from '@vicons/ionicons5'

const ipcRenderer = window.electron.ipcRenderer

const { currentInstance, currentInstancePath } = useFtpClient()
const message = useMessage()
const dialog = useDialog()
const { t } = useI18n()
const uploadLoading = ref(false)
const loading = ref(false)

// #region 文件查询相关
// 文件列表数据
const data = ref<FileInfo[]>([])
// 选中行
const checkedRowKeys = ref([])
// 列表列配置
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
        onClick: () => handleOpenFolder(row),
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
    checkedRowKeys.value = []

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
// #endregion

// #region 文件上传相关
const fileUploadModalRef = ref<InstanceType<typeof FileUploadModal> | null>(null)

// 打开上传弹窗
async function handleOpenUpload() {
  const files = await ipcRenderer.invoke('select-paths')

  uploadLoading.value = true
  try {
    if (files.length > 0) {
      await fileUploadModalRef.value?.open(files)
    }
  } catch (error) {
    console.error(error)
  } finally {
    uploadLoading.value = false
  }
}
// #endregion

// #region 拖拽上传
const isDragging = ref(false)
let dragCounter = 0

function onDragEnter(e: DragEvent) {
  e.preventDefault()
  dragCounter++
  isDragging.value = true
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
}

function onDragLeave() {
  dragCounter--
  if (dragCounter <= 0) {
    isDragging.value = false
  }
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  dragCounter = 0

  const files = e.dataTransfer?.files

  if (files?.length) {
    uploadFiles(Array.from(files).map((f) => f.path))
  }
}

async function uploadFiles(files: string[]) {
  try {
    uploadLoading.value = true
    if (files.length > 0) {
      await fileUploadModalRef.value?.open(files)
    }
  } catch (error) {
    console.error(error)
  } finally {
    uploadLoading.value = false
  }
}
// #endregion

// #region 文件下载相关
const fileDownloadModalRef = ref<InstanceType<typeof FileDownloadModal> | null>(null)
// 打开下载弹窗
async function handleOpenDownload() {
  if (checkedRowKeys.value.length === 0) {
    message.error(t('views.ftpClient.noCheckedItem'))
    return
  }
  const checkedItems = checkedRowKeys.value.map((key) => {
    return data.value.find((row) => row.key === key)
  })

  const downloadFiles: FileInfo[] = []

  for (const item of checkedItems) {
    if (!item) return
    if (item.isDirectory) {
      const files = await currentInstance.value?.getAllFiles(item.filePath)
      downloadFiles.push(...files!)
    } else {
      downloadFiles.push(item)
    }
  }

  await currentInstance.value?.disconnect()

  if (downloadFiles.length === 0) {
    message.error(t('views.ftpClient.noFile'))
    return
  }

  // 选择下载路径
  const path = await ipcRenderer.invoke('select-folder')

  if (path) {
    fileDownloadModalRef.value?.open(downloadFiles, path, currentInstancePath.value.join('/'))
  }
}
// #endregion

// #region 创建文件夹相关
const folderNameDialogRef = ref<InstanceType<typeof FolderNameDialog> | null>(null)
// 创建文件夹
async function handleCreateFolder() {
  const name = await folderNameDialogRef.value?.open()

  if (name) {
    const path = currentInstancePath.value.join('/')

    await currentInstance.value?.createFolder(path, name)

    getFiles()
  }
}
// #endregion

// #region 删除相关
const fileDeleteModalRef = ref<InstanceType<typeof FileDeleteModal> | null>(null)
// 删除选中的文件、文件夹
async function handleDeleteCheckedItem() {
  if (checkedRowKeys.value.length === 0) {
    message.error(t('views.ftpClient.noCheckedItem'))
    return
  }
  await dialogPromise(dialog.warning, {
    title: t('common.warning'),
    content: t('views.ftpClient.deleteConfirm'),
    positiveText: t('common.confirm'),
    negativeText: t('common.cancel'),
  })

  const checkedItems = checkedRowKeys.value.map((key) => {
    return data.value.find((row) => row.key === key)!
  })

  fileDeleteModalRef.value?.open(checkedItems)
}
// #endregion

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
    class="file-browser"
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
    <n-space justify="space-between">
      <FileBreadcrumb></FileBreadcrumb>

      <n-space>
        <CommonButton
          :tooltip="$t('views.ftpClient.download')"
          :icon="FileDownloadOutlined"
          :button-props="{ size: 'small', circle: true }"
          placement="bottom"
          :delay="500"
          @click="handleOpenDownload"
        />
        <CommonButton
          :tooltip="$t('views.ftpClient.upload')"
          :icon="FileUploadOutlined"
          :button-props="{ size: 'small', circle: true }"
          :loading="uploadLoading"
          placement="bottom"
          :delay="500"
          @click="handleOpenUpload"
        />
        <CommonButton
          :tooltip="$t('views.ftpClient.createFolder')"
          :icon="FolderOutline"
          :button-props="{ size: 'small', circle: true }"
          placement="bottom"
          :delay="500"
          @click="handleCreateFolder"
        />
        <CommonButton
          :tooltip="$t('views.ftpClient.delete')"
          :icon="TrashBinOutline"
          :button-props="{ size: 'small', circle: true }"
          placement="bottom"
          :delay="500"
          @click="handleDeleteCheckedItem"
        />
        <CommonButton
          :tooltip="$t('views.ftpClient.refresh')"
          :icon="Refresh"
          :loading="loading"
          :button-props="{ size: 'small', circle: true }"
          placement="bottom"
          :delay="500"
          @click="getFiles"
        />
      </n-space>
    </n-space>
    <n-data-table
      v-model:checked-row-keys="checkedRowKeys"
      :loading="loading"
      size="small"
      :columns="columns"
      :data="data"
      virtual-scroll
      flex-height
      style="height: 100%"
    />
    <FileDownloadModal ref="fileDownloadModalRef" />
    <FileDeleteModal ref="fileDeleteModalRef" @refresh="getFiles" />
    <FileUploadModal ref="fileUploadModalRef" @refresh="getFiles" />
    <FolderNameDialog ref="folderNameDialogRef" />
  </div>
</template>

<style lang="less" scoped>
.file-browser {
  height: calc(100% - 24px);
  padding: 12px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  .overlay {
    pointer-events: none;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.3);
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
