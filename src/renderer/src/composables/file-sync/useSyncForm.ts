import { computed, ref } from 'vue'
import { ESyncType, FolderInfo } from '@renderer/composables/file-sync/useSyncTool'
import { i18n } from '@renderer/locales'

const { t } = i18n.global

const sourceFolder = ref<FolderInfo>({ type: '', path: '' })
const targetFolder = ref<FolderInfo>({ type: '', path: '' })
const syncType = ref(ESyncType.mirror)

const syncOptions = computed(() => {
  return [
    { label: t('views.fileSync.mirrorSync'), value: ESyncType.mirror },
    { label: t('views.fileSync.twoWaySync'), value: ESyncType.twoWay },
    { label: t('views.fileSync.incrementalSync'), value: ESyncType.increment },
  ]
})

export function useSyncForm() {
  return {
    sourceFolder,
    targetFolder,
    syncType,
    syncOptions,
  }
}
