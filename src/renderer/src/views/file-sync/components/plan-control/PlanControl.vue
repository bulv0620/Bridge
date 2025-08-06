<script setup lang="ts">
import { FileTrayFull, Document, Save } from '@vicons/ionicons5'
import { FiberNewOutlined, FiberManualRecordFilled } from '@vicons/material'
import { computed, nextTick, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDialog, useMessage } from 'naive-ui'
import { dialogPromise } from '@renderer/utils/dialog'
import { deepClone, deepEqual } from '@renderer/utils/object'
import PlanNameModal from './PlanNameModal.vue'
import PlanManageModal from './PlanManageModal.vue'
import PlanNameEditor from './PlanNameEditor.vue'
import { ESyncType, FolderInfo } from '@renderer/composables/file-sync/useSyncTool'

withDefaults(
  defineProps<{
    processing: boolean
  }>(),
  {
    processing: false,
  },
)

export interface PlanInfo {
  planId: string
  planName: string
  sourceFolder: FolderInfo
  targetFolder: FolderInfo
  folderWhiteList: string[]
  syncType: ESyncType
}

const { t } = useI18n()
const dialog = useDialog()
const message = useMessage()

const tempPlanData = ref<PlanInfo | null>(null)

const planId = ref('')
const planName = defineModel<string>('planName', { required: true })
const sourceFolder = defineModel<FolderInfo>('sourceFolder', { required: true })
const targetFolder = defineModel<FolderInfo>('targetFolder', { required: true })
const folderWhiteList = defineModel<string[]>('folderWhiteList', { required: true })
const syncType = defineModel<ESyncType>('syncType', { required: true })

const planNameModalRef = ref<InstanceType<typeof PlanNameModal> | null>(null)
const planManageModal = ref<InstanceType<typeof PlanManageModal> | null>(null)

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

const isPlanSaved = computed(() => {
  return deepEqual(currentPlanData.value, tempPlanData.value)
})

const isNewPlan = computed(() => {
  return !planId.value
})

onMounted(() => {
  tempPlanData.value = deepClone({
    planId: planId.value,
    planName: planName.value,
    sourceFolder: sourceFolder.value,
    targetFolder: targetFolder.value,
    folderWhiteList: folderWhiteList.value,
    syncType: syncType.value,
  })
})

// 修改方案名称
const handleNameEditSave = (newName: string) => {
  // 已保存的方案
  const planList = localStorage.getItem('planList')
  const planListData = planList ? JSON.parse(planList) : []

  if (planListData.find((plan: PlanInfo) => plan.planName === newName)) {
    message.error(t('views.fileSync.planNameDuplicate'))
    return
  }

  planName.value = newName
}

// 新方案
const handleCreateNewPlan = async (valid: boolean = true) => {
  if (!deepEqual(currentPlanData.value, tempPlanData.value) && valid) {
    await dialogPromise(dialog.warning, {
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

// 保存方案
const handleSavePlan = async () => {
  if (deepEqual(currentPlanData.value, tempPlanData.value)) {
    // 没有修改
    return
  }

  if (!isComplete.value) {
    await dialogPromise(dialog.warning, {
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
    const planNameResult = await planNameModalRef.value?.prompt(
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

// 打开方案管理modal
const handleOpenPlanManageModal = () => {
  planManageModal.value?.open()
}

const handleSelectPlan = (plan: PlanInfo) => {
  planId.value = plan.planId
  planName.value = plan.planName
  sourceFolder.value = plan.sourceFolder
  targetFolder.value = plan.targetFolder
  folderWhiteList.value = plan.folderWhiteList
  syncType.value = plan.syncType

  // 更新临时数据
  tempPlanData.value = deepClone(plan)
}

const handleDeletePlan = (id: string) => {
  if (id === planId.value) {
    planId.value = ''
  }
}
</script>

<template>
  <n-flex justify="space-between">
    <div class="title">
      <n-icon v-if="!isPlanSaved" :size="12">
        <FiberManualRecordFilled></FiberManualRecordFilled>
      </n-icon>
      <PlanNameEditor :value="planName" @save="handleNameEditSave"></PlanNameEditor>
      <n-icon v-if="isNewPlan" :size="32">
        <FiberNewOutlined></FiberNewOutlined>
      </n-icon>
    </div>
    <n-flex>
      <n-popover trigger="hover" placement="bottom" :delay="500" :disabled="processing">
        <template #trigger>
          <n-button circle :disabled="processing" @click="handleCreateNewPlan">
            <template #icon>
              <n-icon> <Document /> </n-icon>
            </template>
          </n-button>
        </template>
        <span>{{ $t('views.fileSync.newPlan') }}</span>
      </n-popover>

      <n-popover trigger="hover" placement="bottom" :delay="500" :disabled="processing">
        <template #trigger>
          <n-button circle :disabled="processing" @click="handleSavePlan">
            <template #icon>
              <n-icon> <Save /> </n-icon>
            </template>
          </n-button>
        </template>
        <span>{{ $t('views.fileSync.savePlan') }}</span>
      </n-popover>

      <n-popover trigger="hover" placement="bottom" :delay="500" :disabled="processing">
        <template #trigger>
          <n-button circle :disabled="processing" @click="handleOpenPlanManageModal">
            <template #icon>
              <n-icon> <FileTrayFull /> </n-icon>
            </template>
          </n-button>
        </template>
        <span>{{ $t('views.fileSync.savedPlans') }}</span>
      </n-popover>
      <PlanNameModal ref="planNameModalRef"></PlanNameModal>
      <PlanManageModal
        ref="planManageModal"
        :is-plan-saved="isPlanSaved"
        @select-plan="handleSelectPlan"
        @delete-plan="handleDeletePlan"
      ></PlanManageModal>
    </n-flex>
  </n-flex>
</template>

<style lang="less" scoped>
.title {
  height: 100%;
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: large;
  font-weight: 400;
}
</style>
