import { ref, toRaw } from 'vue'
import { useSyncForm } from './useSyncForm'
import { useDiscreteApi } from '../discrete-api/useDiscreteApi'
import { i18n } from '@renderer/locales'

const { syncForm } = useSyncForm()
const { confirm } = useDiscreteApi()
const { t } = i18n.global

const saveLoading = ref(false)
const removeLoading = ref(false)
const queryLoading = ref(false)
const planListModalVisible = ref(false)
const planList = ref<FileSyncPlan[]>([])

async function getPlanList() {
  try {
    queryLoading.value = true
    planList.value = await window.ipc.sync.getAllPlan()
  } catch (error) {
    console.error(error)
  } finally {
    queryLoading.value = false
  }
}

async function savePlan() {
  try {
    saveLoading.value = true
    if (syncForm.id) {
      // 修改
      await confirm('warning', {
        title: t('common.warning'),
        content: t('views.fileSync.updatePlanConfirm'),
        positiveText: t('common.confirm'),
        negativeText: t('common.cancel'),
      })

      await window.ipc.sync.updatePlan(toRaw(syncForm))
    } else {
      // 新增
      await confirm('info', {
        title: t('common.warning'),
        content: t('views.fileSync.savePlanConfirm'),
        positiveText: t('common.confirm'),
        negativeText: t('common.cancel'),
      })

      const planInfo = await window.ipc.sync.addPlan(toRaw(syncForm))
      syncForm.id = planInfo.id
      syncForm.timestamp = planInfo.timestamp
    }
  } catch (error) {
    console.error(error)
  } finally {
    saveLoading.value = false
  }
}

async function removePlan(plan: FileSyncPlan) {
  try {
    removeLoading.value = true

    await confirm('warning', {
      title: t('common.warning'),
      content: t('views.fileSync.removePlanConfirm'),
      positiveText: t('common.confirm'),
      negativeText: t('common.cancel'),
    })

    await window.ipc.sync.removePlan(plan)
  } catch (error) {
    console.error(error)
  } finally {
    removeLoading.value = false
  }
}

async function selectPlan(plan: FileSyncPlan) {
  Object.assign(syncForm, plan)
}

async function resetPlan() {
  await confirm('warning', {
    title: t('common.warning'),
    content: t('views.fileSync.newPlanConfirm'),
    positiveText: t('common.confirm'),
    negativeText: t('common.cancel'),
  })

  syncForm.id = undefined
  syncForm.timestamp = undefined
  syncForm.name = t('views.fileSync.newPlan')
  syncForm.sourceConfig = null
  syncForm.destinationConfig = null
  syncForm.ignoredFolders = []
  syncForm.syncStrategy = 'mirror'
}

async function openPlanListModal() {
  await getPlanList()
  planListModalVisible.value = true
}

export function useSyncPlan() {
  return {
    planListModalVisible,
    planList,
    saveLoading,
    removeLoading,
    queryLoading,
    savePlan,
    getPlanList,
    removePlan,
    selectPlan,
    resetPlan,
    openPlanListModal,
  }
}
