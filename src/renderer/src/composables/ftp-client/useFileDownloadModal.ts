import { useFtpClient } from '@renderer/composables/ftp-client/useFtpClient'
import { LocalFileSystem } from '@renderer/utils/file-system'
import { FileInfo } from '@renderer/utils/file-system/FileSystem.adstract'
import { useMessage } from 'naive-ui'
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOverwriteConfirm } from './useOverwriteConfirm'

const path = window.api.path

const { currentInstance } = useFtpClient()
const { overwriteConfirm } = useOverwriteConfirm()

const loading = ref(false)
const visible = ref(false)

const downloadFiles = ref<FileInfo[]>([])
const downloadPath = ref('')
const currentFtpPath = ref('/')
const currentDownloadIndex = ref(0)
const errorFlag = ref(false)
const stopFlag = ref(false)

const conflictHandleType = ref<'' | 'ignore' | 'cover'>('')

const percentage = computed(() => {
  if (downloadFiles.value.length === 0) return 0
  return Math.round((currentDownloadIndex.value / downloadFiles.value.length) * 100)
})
const currentDownloadFile = computed(() => {
  return downloadFiles.value[currentDownloadIndex.value] || null
})
const complete = computed(() => {
  return currentDownloadIndex.value === downloadFiles.value.length
})

export function useFileDownloadModal() {
  const { t } = useI18n()
  const message = useMessage()

  function openFileDownloadModal(files: FileInfo[], path: string, ftpPath: string) {
    downloadFiles.value = files
    downloadPath.value = path
    currentFtpPath.value = ftpPath || '/'
    currentDownloadIndex.value = 0

    loading.value = false
    visible.value = true

    errorFlag.value = false
    stopFlag.value = false
    conflictHandleType.value = ''

    download()
  }

  async function download() {
    const localFileSystem = new LocalFileSystem(downloadPath.value)

    for (const file of downloadFiles.value) {
      if (stopFlag.value) break

      try {
        const downloadToPath = path.posix.relative(currentFtpPath.value, file.filePath)

        const exist = await localFileSystem.exists(downloadToPath)
        if (exist) {
          if (!conflictHandleType.value) {
            // 无记录的操作选项
            const [confirmFlag, rememberFlag] = await overwriteConfirm(file.fileName)

            // 记住选择
            if (rememberFlag) {
              conflictHandleType.value = confirmFlag ? 'cover' : 'ignore'
            }

            if (confirmFlag) {
              await localFileSystem.delFile(downloadToPath)
            } else {
              currentDownloadIndex.value++
              continue
            }
          } else if (conflictHandleType.value === 'ignore') {
            currentDownloadIndex.value++
            continue
          } else if (conflictHandleType.value === 'cover') {
            await localFileSystem.delFile(downloadToPath)
          }
        }

        const stream = await currentInstance.value!.getFileStream(file.relativePath)
        const meta = file.meta

        await localFileSystem.writeFileStream(downloadToPath, stream)
        await localFileSystem.setMeta(downloadToPath, meta)
        currentDownloadIndex.value++

        await nextTick()
      } catch (error: any) {
        console.error(error)
        message.error(error.message)
        errorFlag.value = true
        break
      }
    }
    if (errorFlag.value) {
      message.error(t('views.ftpClient.downloadFailed'))
    } else if (stopFlag.value) {
      message.info(t('views.ftpClient.downloadCancel'))
    } else {
      message.success(t('views.ftpClient.downloadComplete'))
    }
    currentInstance.value?.disconnect()
  }

  function closeModal() {
    stopFlag.value = true
  }

  return {
    loading,
    visible,
    downloadFiles,
    downloadPath,
    currentFtpPath,
    currentDownloadIndex,
    errorFlag,
    stopFlag,
    conflictHandleType,
    percentage,
    currentDownloadFile,
    complete,
    openFileDownloadModal,
    closeModal,
  }
}
