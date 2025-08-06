import { useMessage } from 'naive-ui'
import { useDiffList } from './useDiffList'
import { useI18n } from 'vue-i18n'
import { EDiffStatus, useSyncTool } from './useSyncTool'
import { FtpFileSystem } from '@renderer/utils/file-system'
import { useSyncForm } from './useSyncForm'
import { useFolderWhiteList } from './useFolderWhiteList'

const crypto = window.api.crypto

export function useFileDiff() {
  const { loading, diffTableData } = useDiffList()
  const message = useMessage()
  const { t } = useI18n()
  const { diffFileListsUnified, getFileSystemInstance, getDiffAction } = useSyncTool()
  const { whiteList: folderWhiteList } = useFolderWhiteList()
  const { sourceFolder, targetFolder, syncType, percentage } = useSyncForm()

  async function startDiff() {
    percentage.value = 0
    diffTableData.value = []
    try {
      loading.value = true

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
      loading.value = false
    }
  }

  return { startDiff }
}
