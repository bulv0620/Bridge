import { ref } from 'vue'
import { ESyncType, FolderInfo } from '@renderer/composables/file-sync/useSyncTool'

const sourceFolder = ref<FolderInfo>({ type: '', path: '' })
const targetFolder = ref<FolderInfo>({ type: '', path: '' })
const syncType = ref(ESyncType.mirror)
const pauseFlag = ref(false)
const percentage = ref(0)

export function useSyncForm() {
  return {
    sourceFolder,
    targetFolder,
    syncType,
    pauseFlag,
    percentage,
  }
}
