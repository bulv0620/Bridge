import { ref } from 'vue'
import { useFtpClient } from '@renderer/composables/ftp-client/useFtpClient'
import { FileInfo } from '@renderer/utils/file-system/FileSystem.adstract'
import { useFileDeleteModal } from '@renderer/composables/ftp-client/useFileDeleteModal'
import { useFileDownloadModal } from '@renderer/composables/ftp-client/useFileDownloadModal'
import { useFileUploadModal } from '@renderer/composables/ftp-client/useFileUploadModal'
import { useFileList } from '@renderer/composables/ftp-client/useFileList'
import { useFolderNameDialog } from '@renderer/composables/ftp-client/useFolderNameDialog'
import { useDiscreteApi } from '../discrete-api/useDiscreteApi'
import { i18n } from '@renderer/locales'

const ipcRenderer = window.electron.ipcRenderer

const { confirm, message } = useDiscreteApi()
const { currentInstance, currentInstancePath } = useFtpClient()
const { t } = i18n.global

const uploadLoading = ref(false)

const { loading: fileListLoading, fileList, checkedRowKeys, getFiles } = useFileList()

const { openFileUploadModal } = useFileUploadModal()
const { openFileDownloadModal } = useFileDownloadModal()
const { openFolderNameDialog } = useFolderNameDialog()
const { openFileDeleteModal } = useFileDeleteModal()

// 打开上传弹窗
async function handleOpenUpload() {
  const files = await ipcRenderer.invoke('select-paths')

  uploadLoading.value = true
  try {
    if (files.length > 0) {
      await openFileUploadModal(files)
    }
  } catch (error) {
    console.error(error)
  } finally {
    uploadLoading.value = false
  }
}

// 打开下载弹窗
async function handleOpenDownload() {
  if (checkedRowKeys.value.length === 0) {
    message.error(t('views.ftpClient.noCheckedItem'))
    return
  }
  const checkedItems = checkedRowKeys.value.map((key) => {
    return fileList.value.find((row) => row.key === key)
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
    openFileDownloadModal(downloadFiles, path, currentInstancePath.value.join('/'))
  }
}

// 创建文件夹
async function handleCreateFolder() {
  const name = await openFolderNameDialog()

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
  await confirm('warning', {
    title: t('common.warning'),
    content: t('views.ftpClient.deleteConfirm'),
    positiveText: t('common.confirm'),
    negativeText: t('common.cancel'),
  })

  const checkedItems = checkedRowKeys.value.map((key) => {
    return fileList.value.find((row) => row.key === key)!
  })

  openFileDeleteModal(checkedItems)
}

export function useFileToolbar() {
  return {
    fileListLoading,
    uploadLoading,
    getFiles,
    handleOpenDownload,
    handleOpenUpload,
    handleCreateFolder,
    handleDeleteCheckedItem,
  }
}
