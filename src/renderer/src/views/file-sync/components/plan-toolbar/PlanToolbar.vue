<script setup lang="ts">
import { useSyncForm } from '@renderer/composables/file-sync/useSyncForm'
import { useSyncPlan } from '@renderer/composables/file-sync/useSyncPlan'
import { DocumentOutline, SaveOutline, FileTrayFullOutline } from '@vicons/ionicons5'

const { isSyncing, isComparing } = useSyncForm()
const { resetPlan, savePlan, saveLoading, openPlanListModal, queryLoading } = useSyncPlan()
</script>

<template>
  <div class="plan-toolbar">
    <el-tooltip
      :content="$t('views.fileSync.newPlan')"
      placement="bottom"
      effect="light"
      :show-after="500"
      :hide-after="0"
      :disabled="isSyncing || isComparing"
    >
      <el-button
        type="primary"
        circle
        :icon="DocumentOutline"
        :disabled="isSyncing || isComparing"
        @click="resetPlan()"
      ></el-button>
    </el-tooltip>

    <el-tooltip
      :content="$t('views.fileSync.savePlan')"
      placement="bottom"
      effect="light"
      :show-after="500"
      :hide-after="0"
      :disabled="isSyncing || isComparing"
    >
      <el-button
        circle
        text
        bg
        :icon="SaveOutline"
        :disabled="isSyncing || isComparing"
        :loading="saveLoading"
        @click="savePlan()"
      ></el-button>
    </el-tooltip>

    <el-tooltip
      :content="$t('views.fileSync.savedPlans')"
      placement="bottom"
      effect="light"
      :show-after="500"
      :hide-after="0"
      :disabled="isSyncing || isComparing"
    >
      <el-button
        circle
        text
        bg
        :icon="FileTrayFullOutline"
        :disabled="isSyncing || isComparing"
        :loading="queryLoading"
        @click="openPlanListModal()"
      ></el-button>
    </el-tooltip>
  </div>
</template>

<style lang="less" scoped>
.plan-toolbar {
  display: flex;
}
</style>
