<script setup lang="ts">
import { useSyncForm } from '@renderer/composables/file-sync-v2/useSyncForm'
import { DocumentOutline, SaveOutline, FileTrayFullOutline } from '@vicons/ionicons5'

const { resetForm, isSyncing, isComparing } = useSyncForm()
</script>

<template>
  <n-space>
    <CommonButton
      :tooltip="$t('views.fileSyncV2.newPlan')"
      :icon="DocumentOutline"
      :button-props="{ size: 'small', circle: true, type: 'primary' }"
      placement="bottom"
      :delay="500"
      :disabled="isSyncing || isComparing"
      @click="resetForm"
    />
    <CommonButton
      :tooltip="$t('views.fileSyncV2.savePlan')"
      :icon="SaveOutline"
      :button-props="{ size: 'small', circle: true }"
      placement="bottom"
      :delay="500"
      :disabled="isSyncing || isComparing"
    />
    <CommonButton
      :tooltip="$t('views.fileSyncV2.savedPlans')"
      :icon="FileTrayFullOutline"
      :button-props="{ size: 'small', circle: true }"
      placement="bottom"
      :delay="500"
      :disabled="isSyncing || isComparing"
    />
  </n-space>
</template>
