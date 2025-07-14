<script setup lang="ts">
import { nextTick, ref, watch, h, computed } from 'vue'
import { Refresh, FolderOutline, TrashBinOutline } from '@vicons/ionicons5'
import { FileDownloadOutlined, FileUploadOutlined } from '@vicons/material'
import { useFtp } from '@renderer/composables/ftp'
import dayjs from 'dayjs'
import { FileInfo } from '@renderer/utils/file-system/FileSystem.adstract'
import FileNameWithIcon from './FileNameWithIcon.vue'
import { useDialog, useMessage } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import FileBreadcrumb from './Breadcrumb.vue'
import FileDownloadModal from './FileDownloadModal.vue'
import FileUploadModal from './FileUploadModal.vue'
import FolderNameDialog from './FolderNameDialog.vue'
import { dialogPromise } from '@renderer/utils/dialog'
const stream = window.api.stream

const { currentInstance, currentInstancePath } = useFtp()
const message = useMessage()
const dialog = useDialog()
const { t } = useI18n()

const loading = ref(false)
const delLoading = ref(false)
const uploadLoading = ref(false)

const fileUploadModalRef = ref<InstanceType<typeof FileUploadModal> | null>(null)
const fileDownloadModalRef = ref<InstanceType<typeof FileDownloadModal> | null>(null)
const folderNameDialogRef = ref<InstanceType<typeof FolderNameDialog> | null>(null)

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

// 打开上传弹窗
async function handleOpenUpload() {
  try {
    const file = await selectFile()

    if (data.value.find((row) => row.fileName === file.name && !row.isDirectory)) {
      await dialogPromise(dialog.warning, {
        title: t('common.warning'),
        content: t('views.ftpClient.confirmOverwrite'),
        positiveText: t('common.confirm'),
        negativeText: t('common.cancel'),
      })
    }
    uploadLoading.value = true

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const fileStrem = stream.Readable.from(buffer)
    const remotePath = `${currentInstancePath.value.join('/')}/${file.name}`
    await currentInstance.value?.writeFileStream(remotePath, fileStrem)

    getFiles()
  } catch (error) {
    console.error(error)
  } finally {
    uploadLoading.value = false
  }
}

// 选择文件
function selectFile() {
  return new Promise<File>((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'

    input.addEventListener('change', () => {
      if (!input.files || input.files.length === 0) {
        reject(new Error('No file selected'))
        return
      }

      const file = input.files[0]
      resolve(file)
    })

    input.addEventListener('cancel', () => {
      reject(new Error('File selection canceled'))
    })

    document.body.appendChild(input) // 确保输入框在 DOM 中
    input.click()
    document.body.removeChild(input) // 选择后移除输入框
  })
}

// 打开下载弹窗
function handleOpenDownload() {
  fileDownloadModalRef.value?.open()
}

// 创建文件夹
async function handleCreateFolder() {
  const name = await folderNameDialogRef.value?.open()

  if (name) {
    const path = currentInstancePath.value.join('/')

    await currentInstance.value?.createFolder(path, name)

    getFiles()
  }
}

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

  try {
    delLoading.value = true
    const checkedItems = checkedRowKeys.value.map((key) => {
      return data.value.find((row) => row.key === key)
    })

    for (const item of checkedItems) {
      if (!item) continue
      if (item.isDirectory) {
        await currentInstance.value?.delFolder(item.filePath)
      } else {
        await currentInstance.value?.delFile(item.filePath)
      }
    }

    getFiles()
  } catch (error) {
    console.error(error)
  } finally {
    delLoading.value = false
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
  <div class="file-browser">
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
          placement="bottom"
          :delay="500"
          :loading="uploadLoading"
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
          :loading="delLoading"
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
      :loading="loading || delLoading"
      size="small"
      :columns="columns"
      :data="data"
      virtual-scroll
      flex-height
      style="height: 100%; user-select: none"
    />
    <FileDownloadModal ref="fileDownloadModalRef" />
    <FileUploadModal ref="fileUploadModalRef" @upload-finished="getFiles" />
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
}
</style>
