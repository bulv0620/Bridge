import { useDiffList } from './useDiffList'
import { EDiffStatus, useSyncTool } from './useSyncTool'
import { FtpFileSystem } from '@renderer/utils/file-system'
import { useSyncForm } from './useSyncForm'
import { useFolderWhiteList } from './useFolderWhiteList'
import { i18n } from '@renderer/locales'
import { useDiscreteApi } from '../discrete-api/useDiscreteApi'
import { ref } from 'vue'

const crypto = window.api.crypto

const { t } = i18n.global
const { message } = useDiscreteApi()

const diffLoading = ref(false)

const { diffTableData } = useDiffList()
const { diffFileListsUnified, getFileSystemInstance, getDiffAction } = useSyncTool()
const { folderWhiteList } = useFolderWhiteList()
const { sourceFolder, targetFolder, syncType } = useSyncForm()

async function startDiff() {
  diffTableData.value = []
  try {
    diffLoading.value = true

    if (!sourceFolder.value.path || !targetFolder.value.path) return

    const source = getFileSystemInstance(sourceFolder.value, folderWhiteList.value)
    const target = getFileSystemInstance(targetFolder.value, folderWhiteList.value)

    const sourceValid = await source.validate()
    if (!sourceValid) {
      message.error(t('views.fileSync.sourceInvalid'))
      return
    }
    const targetValid = await target.validate()
    if (!targetValid) {
      message.error(t('views.fileSync.targetInvalid'))
      return
    }

    const sourceFiles = await source.getAllFiles()
    const targetFiles = await target.getAllFiles()

    const diff = diffFileListsUnified(sourceFiles, targetFiles)

    diffTableData.value = diff.map(function (diffFile) {
      return {
        key: crypto.randomUUID(),
        ...diffFile,
        action: getDiffAction(diffFile, syncType.value),
        status: EDiffStatus.waiting,
      }
    })

    if (source instanceof FtpFileSystem) source.disconnect()
    if (target instanceof FtpFileSystem) target.disconnect()
  } catch (error) {
    console.error(error)
  } finally {
    diffLoading.value = false
  }
}

export function useFileDiff() {
  return { diffLoading, startDiff }
}
