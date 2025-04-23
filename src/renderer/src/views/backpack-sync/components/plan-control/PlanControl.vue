<script setup lang="ts">
import { FileTrayFull, Document, Save } from '@vicons/ionicons5'
import { FolderInfo } from '../folder-selection-input/FolderSelectionInput.vue'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDialog } from 'naive-ui'
import { dialogPromise } from '@renderer/utils/dialog'
import { deepClone, deepEqual } from '@renderer/utils/object'
import { ESyncType } from '@renderer/utils/file-system'
import PlanNameModal from './PlanNameModal.vue'

withDefaults(
  defineProps<{
    processing: boolean
  }>(),
  {
    processing: false,
  },
)

interface PlanInfo {
  planId: string
  planName: string
  sourceFolder: FolderInfo
  targetFolder: FolderInfo
  folderWhiteList: string[]
  syncType: ESyncType
}

const { t } = useI18n()
const dialog = useDialog()

let tempPlanData: PlanInfo | null = null

const planId = ref('')
const planName = defineModel<string>('planName', { required: true })
const sourceFolder = defineModel<FolderInfo>('sourceFolder', { required: true })
const targetFolder = defineModel<FolderInfo>('targetFolder', { required: true })
const folderWhiteList = defineModel<string[]>('folderWhiteList', { required: true })
const syncType = defineModel<ESyncType>('syncType', { required: true })

const planNameModalRef = ref<InstanceType<typeof PlanNameModal> | null>(null)

const isComplete = computed(() => {
  return (
    planName.value &&
    sourceFolder.value.type &&
    sourceFolder.value.path &&
    targetFolder.value.type &&
    targetFolder.value.path
  )
})

const currentPlanData = computed(() => ({
  planId: planId.value,
  planName: planName.value,
  sourceFolder: sourceFolder.value,
  targetFolder: targetFolder.value,
  folderWhiteList: folderWhiteList.value,
  syncType: syncType.value,
}))

onMounted(() => {
  tempPlanData = deepClone({
    planId: planId.value,
    planName: planName.value,
    sourceFolder: sourceFolder.value,
    targetFolder: targetFolder.value,
    folderWhiteList: folderWhiteList.value,
    syncType: syncType.value,
  })
})

// 新方案
const handleCreateNewPlan = async () => {
  if (!deepEqual(currentPlanData.value, tempPlanData) && isComplete.value) {
    await dialogPromise(dialog.warning, {
      title: t('common.warning'),
      content: t('views.backpack.newPlanConfirm'),
      positiveText: t('common.confirm'),
      negativeText: t('common.cancel'),
    })
  }

  planId.value = ''
  planName.value = t('views.backpack.newPlan')
  sourceFolder.value = { type: '', path: '' }
  targetFolder.value = { type: '', path: '' }
  folderWhiteList.value = []

  // 重置临时数据
  tempPlanData = deepClone({
    planId: planId.value,
    planName: planName.value,
    sourceFolder: sourceFolder.value,
    targetFolder: targetFolder.value,
    folderWhiteList: folderWhiteList.value,
    syncType: syncType.value,
  })
}

// 保存方案
const handleSavePlan = async () => {
  if (deepEqual(currentPlanData.value, tempPlanData)) {
    // 没有修改
    return
  }

  if (!isComplete.value) {
    await dialogPromise(dialog.warning, {
      title: t('common.warning'),
      content: t('views.backpack.savePlanConfirm'),
      positiveText: t('common.confirm'),
      negativeText: t('common.cancel'),
    })
  }

  // 已保存的方案
  const planList = localStorage.getItem('planList')
  const planListData = planList ? JSON.parse(planList) : []

  if (!planId.value) {
    // 新方案
    const planNameResult = await planNameModalRef.value?.prompt(
      planName.value,
      planListData.map((el: PlanInfo) => el.planName),
    )
    if (!planNameResult) {
      return
    }
    planName.value = planNameResult
    planId.value = crypto.randomUUID()
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
  tempPlanData = deepClone(planInfo)
}
</script>

<template>
  <n-flex>
    <n-popover trigger="hover" placement="bottom" :delay="500" :disabled="processing">
      <template #trigger>
        <n-button circle :disabled="processing" @click="handleCreateNewPlan">
          <template #icon>
            <n-icon> <Document /> </n-icon>
          </template>
        </n-button>
      </template>
      <span>{{ $t('views.backpack.newPlan') }}</span>
    </n-popover>

    <n-popover trigger="hover" placement="bottom" :delay="500" :disabled="processing">
      <template #trigger>
        <n-button circle :disabled="processing" @click="handleSavePlan">
          <template #icon>
            <n-icon> <Save /> </n-icon>
          </template>
        </n-button>
      </template>
      <span>{{ $t('views.backpack.savePlan') }}</span>
    </n-popover>

    <n-popover trigger="hover" placement="bottom" :delay="500" :disabled="processing">
      <template #trigger>
        <n-button circle :disabled="processing">
          <template #icon>
            <n-icon> <FileTrayFull /> </n-icon>
          </template>
        </n-button>
      </template>
      <span>{{ $t('views.backpack.savedPlans') }}</span>
    </n-popover>
    <PlanNameModal ref="planNameModalRef"></PlanNameModal>
  </n-flex>
</template>
