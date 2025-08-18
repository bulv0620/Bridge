import { computed, reactive, ref, toRaw, watch } from 'vue'
import { i18n } from '@renderer/locales'
import { useDiscreteApi } from '../discrete-api/useDiscreteApi'
import { useFileList } from './useFileList'

const { t } = i18n.global
const { confirm } = useDiscreteApi()

const { diffFileList } = useFileList()

const syncForm = reactive<FileSyncPlan>({
  name: t('views.fileSyncV2.newPlan'),
  sourceConfig: null,
  destinationConfig: null,
  ignoredFolders: [],
  syncStrategy: 'mirror',
})
const isComparing = ref(false)
const isSyncing = ref(false)

const isFormCompleted = computed(() => {
  return !!syncForm.sourceConfig && !!syncForm.destinationConfig
})

async function resetForm() {
  await confirm('warning', {
    title: t('common.warning'),
    content: t('views.fileSyncV2.newPlanConfirm'),
    positiveText: t('common.confirm'),
    negativeText: t('common.cancel'),
  })

  syncForm.name = t('views.fileSyncV2.newPlan')
  syncForm.sourceConfig = null
  syncForm.destinationConfig = null
  syncForm.ignoredFolders = []
  syncForm.syncStrategy = 'mirror'
}

watch(
  () => syncForm.sourceConfig,
  (newVal) => {
    window.ipc.sync.setStorageEngineConfig('source', toRaw(newVal))
  },
)

watch(
  () => syncForm.destinationConfig,
  (newVal) => {
    window.ipc.sync.setStorageEngineConfig('destination', toRaw(newVal))
  },
)

watch(
  () => syncForm.ignoredFolders,
  (newVal) => {
    window.ipc.sync.setIgnoredFolders(toRaw(newVal))
  },
)

watch(
  () => syncForm.syncStrategy,
  (newVal) => {
    window.ipc.sync.setSyncStrategy(newVal)
  },
)

async function startCompare() {
  isComparing.value = true
  try {
    diffFileList.value = await window.ipc.sync.compare()
  } catch (error) {
    console.error(error)
  } finally {
    isComparing.value = false
  }
}

export function useSyncForm() {
  return {
    syncForm,
    isFormCompleted,
    isComparing,
    isSyncing,
    resetForm,
    startCompare,
  }
}
