import { computed, nextTick, ref } from 'vue'
import { ESyncType, FolderInfo } from './useSyncTool'
import { useFolderWhiteList } from './useFolderWhiteList'
import { useSyncForm } from './useSyncForm'
import { deepClone, deepEqual } from '@renderer/utils/object'
import { usePlanNameDialog } from './usePlanNameDialog'
import { i18n } from '@renderer/locales'
import { useDiscreteApi } from '../discrete-api/useDiscreteApi'

export interface PlanInfo {
  planId: string
  planName: string
  sourceFolder: FolderInfo
  targetFolder: FolderInfo
  folderWhiteList: string[]
  syncType: ESyncType
}
const { t } = i18n.global
const { message, confirm } = useDiscreteApi()

const { sourceFolder, targetFolder, syncType } = useSyncForm()
const { folderWhiteList } = useFolderWhiteList()
const { openPlanNameDialog } = usePlanNameDialog()

const tempPlanData = ref<PlanInfo | null>(null)
const planId = ref('')
const planName = ref(t('views.fileSync.newPlan'))

const manageModalVisible = ref(false)
const savedPlanList = ref<PlanInfo[]>([])

const currentPlanData = computed(() => ({
  planId: planId.value,
  planName: planName.value,
  sourceFolder: sourceFolder.value,
  targetFolder: targetFolder.value,
  folderWhiteList: folderWhiteList.value,
  syncType: syncType.value,
}))

const isComplete = computed(() => {
  return (
    planName.value &&
    sourceFolder.value.type &&
    sourceFolder.value.path &&
    targetFolder.value.type &&
    targetFolder.value.path
  )
})

const isNewPlan = computed(() => {
  return !planId.value
})

const isPlanSaved = computed(() => {
  return deepEqual(currentPlanData.value, tempPlanData.value)
})

function openPlanManageModal() {
  manageModalVisible.value = true

  const planList = localStorage.getItem('planList')
  const planListData = planList ? JSON.parse(planList) : []

  savedPlanList.value = planListData
}

async function createNewPlan(valid: boolean = true) {
  if (!deepEqual(currentPlanData.value, tempPlanData.value) && valid) {
    await confirm('warning', {
      title: t('common.warning'),
      content: t('views.fileSync.newPlanConfirm'),
      positiveText: t('common.confirm'),
      negativeText: t('common.cancel'),
    })
  }

  planId.value = ''
  planName.value = t('views.fileSync.newPlan')
  sourceFolder.value = { type: '', path: '' }
  targetFolder.value = { type: '', path: '' }
  folderWhiteList.value = []

  await nextTick()

  // 重置临时数据
  tempPlanData.value = deepClone({
    planId: planId.value,
    planName: planName.value,
    sourceFolder: sourceFolder.value,
    targetFolder: targetFolder.value,
    folderWhiteList: folderWhiteList.value,
    syncType: syncType.value,
  })
}

async function savePlan() {
  if (deepEqual(currentPlanData.value, tempPlanData.value)) {
    // 没有修改
    return
  }

  if (!isComplete.value) {
    await confirm('warning', {
      title: t('common.warning'),
      content: t('views.fileSync.savePlanConfirm'),
      positiveText: t('common.confirm'),
      negativeText: t('common.cancel'),
    })
  }

  // 已保存的方案
  const planList = localStorage.getItem('planList')
  const planListData = planList ? JSON.parse(planList) : []

  if (!planId.value) {
    // 新方案
    const planNameResult = await openPlanNameDialog(
      planName.value,
      planListData.map((el: PlanInfo) => el.planName),
    )
    if (!planNameResult) {
      return
    }
    planName.value = planNameResult
    planId.value = crypto.randomUUID()
    await nextTick()
  }

  // 保存操作
  const planIndex = planListData.findIndex((plan: PlanInfo) => plan.planId === planId.value)

  const planInfo: PlanInfo = {
    planId: planId.value,
    planName: planName.value,
    sourceFolder: sourceFolder.value,
    targetFolder: targetFolder.value,
    folderWhiteList: folderWhiteList.value,
    syncType: syncType.value,
  }

  if (planIndex === -1) {
    // 新增方案
    planListData.push(planInfo)
  } else {
    // 更新方案
    planListData[planIndex] = planInfo
  }
  localStorage.setItem('planList', JSON.stringify(planListData))
  // 更新临时数据
  tempPlanData.value = deepClone(planInfo)
}

async function selectPlan(plan: PlanInfo) {
  if (!isPlanSaved.value) {
    await confirm('warning', {
      title: t('common.warning'),
      content: t('views.fileSync.selectPlanConfirm'),
      positiveText: t('common.confirm'),
      negativeText: t('common.cancel'),
    })
  }

  planId.value = plan.planId
  planName.value = plan.planName
  sourceFolder.value = plan.sourceFolder
  targetFolder.value = plan.targetFolder
  folderWhiteList.value = plan.folderWhiteList
  syncType.value = plan.syncType

  // 更新临时数据
  tempPlanData.value = deepClone(plan)

  manageModalVisible.value = false
}

async function deletePlan(row: PlanInfo) {
  await confirm('warning', {
    title: t('common.warning'),
    content: t('views.fileSync.deletePlanConfirm'),
    positiveText: t('common.confirm'),
    negativeText: t('common.cancel'),
  })

  const index = savedPlanList.value.findIndex((plan: PlanInfo) => plan.planId === row.planId)
  if (index !== -1) {
    savedPlanList.value.splice(index, 1)
    localStorage.setItem('planList', JSON.stringify(savedPlanList.value))
  }

  if (row.planId === planId.value) {
    planId.value = ''
  }
}

function savePlanName(newName: string) {
  // 已保存的方案
  const planList = localStorage.getItem('planList')
  const planListData = planList ? JSON.parse(planList) : []

  if (planListData.find((plan: PlanInfo) => plan.planName === newName)) {
    message.error(t('views.fileSync.planNameDuplicate'))
    return
  }

  planName.value = newName
}

export function usePlanManage() {
  return {
    sourceFolder,
    targetFolder,
    syncType,
    folderWhiteList,
    tempPlanData,
    planId,
    planName,
    manageModalVisible,
    savedPlanList,
    isComplete,
    isNewPlan,
    currentPlanData,
    isPlanSaved,

    openPlanManageModal,
    createNewPlan,
    savePlan,

    selectPlan,
    deletePlan,
    savePlanName,
  }
}
