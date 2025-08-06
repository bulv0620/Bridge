import { useFtpClient } from '@renderer/composables/ftp-client/useFtpClient'
import { FileInfo } from '@renderer/utils/file-system/FileSystem.adstract'
import { useMessage } from 'naive-ui'
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFileList } from './useFileList'

const { currentInstance } = useFtpClient()

const loading = ref(false)
const visible = ref(false)

const delFiles = ref<FileInfo[]>([])
const currentDelIndex = ref(0)

const errorFlag = ref(false)
const stopFlag = ref(false)

const percentage = computed(() => {
  if (delFiles.value.length === 0) return 0
  return Math.round((currentDelIndex.value / delFiles.value.length) * 100)
})
const currentDownloadFile = computed(() => {
  return delFiles.value[currentDelIndex.value] || null
})
const complete = computed(() => {
  return currentDelIndex.value === delFiles.value.length
})

export function useFileDeleteModal() {
  const { t } = useI18n()
  const message = useMessage()

  const { getFiles } = useFileList()

  function openFileDeleteModal(files: FileInfo[]) {
    delFiles.value = files

    loading.value = false
    visible.value = true

    errorFlag.value = false
    stopFlag.value = false

    currentDelIndex.value = 0

    doDel()
  }

  async function doDel() {
    for (const file of delFiles.value) {
      if (stopFlag.value) break

      try {
        if (file.isDirectory) {
          await currentInstance.value?.delFolder(file.filePath)
        } else {
          await currentInstance.value?.delFile(file.filePath)
        }
        await wait(50)

        currentDelIndex.value++

        await nextTick()
      } catch (error: any) {
        console.error(error)
        message.error(error.message)
        errorFlag.value = true
        break
      }
    }
    if (errorFlag.value) {
      message.error(t('views.ftpClient.deleteFailed'))
    } else if (stopFlag.value) {
      message.info(t('views.ftpClient.deleteCancel'))
    } else {
      message.success(t('views.ftpClient.deleteComplete'))
    }
    currentInstance.value?.disconnect()

    getFiles()
  }

  function wait(ms: number) {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve()
      }, ms)
    })
  }

  function closeModal() {
    stopFlag.value = true
  }

  return {
    loading,
    visible,
    delFiles,
    currentDelIndex,
    errorFlag,
    stopFlag,
    percentage,
    currentDownloadFile,
    complete,
    openFileDeleteModal,
    closeModal,
  }
}
