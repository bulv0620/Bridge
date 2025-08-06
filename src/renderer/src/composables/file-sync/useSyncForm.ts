import { computed, ref } from 'vue'
import { ESyncType, FolderInfo } from '@renderer/composables/file-sync/useSyncTool'
import { useI18n } from 'vue-i18n'

const sourceFolder = ref<FolderInfo>({ type: '', path: '' })
const targetFolder = ref<FolderInfo>({ type: '', path: '' })
const syncType = ref(ESyncType.mirror)
const pauseFlag = ref(false)
const percentage = ref(0)

export function useSyncForm() {
  const { t } = useI18n()

  const syncOptions = computed(() => {
    return [
      { label: t('views.fileSync.mirrorSync'), value: ESyncType.mirror },
      { label: t('views.fileSync.twoWaySync'), value: ESyncType.twoWay },
      { label: t('views.fileSync.incrementalSync'), value: ESyncType.increment },
    ]
  })

  return {
    sourceFolder,
    targetFolder,
    syncType,
    pauseFlag,
    percentage,
    syncOptions,
  }
}
