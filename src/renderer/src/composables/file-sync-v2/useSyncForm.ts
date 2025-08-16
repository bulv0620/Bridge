import { reactive } from 'vue'
import { i18n } from '@renderer/locales'
import { useDiscreteApi } from '../discrete-api/useDiscreteApi'

const { t } = i18n.global
const { confirm } = useDiscreteApi()

const syncForm = reactive<FileSyncPlan>({
  name: t('views.fileSyncV2.newPlan'),
  sourceEndpoint: null,
  destinationEndpoint: null,
  ignoredFolders: [],
  syncStrategy: 'mirror',
})

async function resetForm() {
  await confirm('warning', {
    title: t('common.warning'),
    content: t('views.fileSyncV2.newPlanConfirm'),
    positiveText: t('common.confirm'),
    negativeText: t('common.cancel'),
  })

  syncForm.name = t('views.fileSyncV2.newPlan')
  syncForm.sourceEndpoint = null
  syncForm.destinationEndpoint = null
  syncForm.ignoredFolders = []
  syncForm.syncStrategy = 'mirror'
}

export function useSyncForm() {
  return {
    syncForm,
    resetForm,
  }
}
