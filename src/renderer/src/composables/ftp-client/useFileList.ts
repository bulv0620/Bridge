import { ref } from 'vue'
import { useFtpClient } from '@renderer/composables/ftp-client/useFtpClient'
import { FileInfo } from '@renderer/utils/file-system/FileSystem.adstract'
import { useDiscreteApi } from '../discrete-api/useDiscreteApi'
import { i18n } from '@renderer/locales'

const crypto = window.api.crypto

const { message } = useDiscreteApi()
const { t } = i18n.global
const { currentInstance, currentInstancePath } = useFtpClient()

const loading = ref(false)

const fileList = ref<FileInfo[]>([])
const checkedRowKeys = ref([])

async function getFiles() {
  try {
    loading.value = true

    fileList.value = []
    checkedRowKeys.value = []

    const valid = await currentInstance.value?.validate()
    if (!valid) {
      message.error(t('views.ftpClient.invalidInstance'))
      return
    }

    const result = await currentInstance.value?.listDir(currentInstancePath.value?.join('/'))

    if (result) {
      fileList.value = result.map((el) => ({
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

function openFolder(row: FileInfo) {
  if (row.isDirectory) {
    currentInstancePath.value?.push(row.fileName)
  }
}

export function useFileList() {
  return {
    currentInstance,
    currentInstancePath,
    loading,
    fileList,
    checkedRowKeys,
    getFiles,
    openFolder,
  }
}
