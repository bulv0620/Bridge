import { ref, toRaw } from 'vue'
import { useSyncForm } from './useSyncForm'
import { i18n } from '@renderer/locales'
import { ElMessageBox } from 'element-plus'

const { syncForm } = useSyncForm()
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
      await ElMessageBox({
        type: 'warning',
        title: t('common.warning'),
        message: t('views.fileSync.updatePlanConfirm'),
        showCancelButton: true,
      })

      await window.ipc.sync.updatePlan(toRaw(syncForm))
    } else {
      // 新增
      await ElMessageBox({
        type: 'warning',
        title: t('common.warning'),
        message: t('views.fileSync.savePlanConfirm'),
        showCancelButton: true,
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

    await ElMessageBox({
      type: 'warning',
      title: t('common.warning'),
      message: t('views.fileSync.removePlanConfirm'),
      showCancelButton: true,
    })

    if (plan.id === syncForm.id) {
      syncForm.id = undefined
      syncForm.timestamp = undefined
    }

    await window.ipc.sync.removePlan(toRaw(plan))

    getPlanList()
  } catch (error) {
    console.error(error)
  } finally {
    removeLoading.value = false
  }
}

async function selectPlan(plan: FileSyncPlan) {
  Object.assign(syncForm, plan)
  planListModalVisible.value = false
}

async function resetPlan() {
  await ElMessageBox({
    type: 'warning',
    title: t('common.warning'),
    message: t('views.fileSync.newPlanConfirm'),
    showCancelButton: true,
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
