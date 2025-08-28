<script setup lang="ts">
import { useSyncForm } from '@renderer/composables/file-sync/useSyncForm'
import { useSyncPlan } from '@renderer/composables/file-sync/useSyncPlan'
import { DocumentOutline, SaveOutline, FileTrayFullOutline } from '@vicons/ionicons5'

const { isSyncing, isComparing } = useSyncForm()
const { resetPlan, savePlan, saveLoading, openPlanListModal, queryLoading } = useSyncPlan()
</script>

<template>
  <n-space>
    <CommonButton
      :tooltip="$t('views.fileSync.newPlan')"
      :icon="DocumentOutline"
      :button-props="{ size: 'small', circle: true, type: 'primary' }"
      placement="bottom"
      :delay="500"
      :disabled="isSyncing || isComparing"
      @click="resetPlan"
    />
    <CommonButton
      :tooltip="$t('views.fileSync.savePlan')"
      :icon="SaveOutline"
      :button-props="{ size: 'small', circle: true }"
      placement="bottom"
      :delay="500"
      :disabled="isSyncing || isComparing"
      :loading="saveLoading"
      @click="savePlan"
    />
    <CommonButton
      :tooltip="$t('views.fileSync.savedPlans')"
      :icon="FileTrayFullOutline"
      :button-props="{ size: 'small', circle: true }"
      placement="bottom"
      :delay="500"
      :disabled="isSyncing || isComparing"
      :loading="queryLoading"
      @click="openPlanListModal"
    />
  </n-space>
</template>
