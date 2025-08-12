<script setup lang="ts">
import { Albums, Document, Save } from '@vicons/ionicons5'
import { onMounted } from 'vue'
import { deepClone } from '@renderer/utils/object'
import { usePlanManage } from '@renderer/composables/file-sync/usePlanManage'
import { useFileSync } from '@renderer/composables/file-sync/useFileSync'

const { processing } = useFileSync()
const {
  sourceFolder,
  targetFolder,
  syncType,
  folderWhiteList,
  tempPlanData,
  planId,
  planName,
  openPlanManageModal,
  createNewPlan,
  savePlan,
} = usePlanManage()

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
</script>

<template>
  <n-flex>
    <CommonButton
      :tooltip="$t('views.fileSync.newPlan')"
      :icon="Document"
      :button-props="{ size: 'small', circle: true }"
      placement="bottom"
      :delay="500"
      :disabled="processing"
      @click="createNewPlan"
    />
    <CommonButton
      :tooltip="$t('views.fileSync.savePlan')"
      :icon="Save"
      :button-props="{ size: 'small', circle: true }"
      placement="bottom"
      :delay="500"
      :disabled="processing"
      @click="savePlan"
    />
    <CommonButton
      :tooltip="$t('views.fileSync.savedPlans')"
      :icon="Albums"
      :button-props="{ size: 'small', circle: true }"
      placement="bottom"
      :delay="500"
      :disabled="processing"
      @click="openPlanManageModal"
    />
  </n-flex>
</template>
