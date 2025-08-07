<script setup lang="ts">
import { FiberNewOutlined, FiberManualRecordFilled } from '@vicons/material'
import { usePlanManage } from '@renderer/composables/file-sync/usePlanManage'
import PlanNameEditor from '../plan-name-editor/PlanNameEditor.vue'

const { planName, isNewPlan, isPlanSaved, savePlanName } = usePlanManage()
</script>

<template>
  <div class="title">
    <n-icon v-if="!isPlanSaved" :size="12">
      <FiberManualRecordFilled></FiberManualRecordFilled>
    </n-icon>
    <PlanNameEditor :value="planName" @save="savePlanName"></PlanNameEditor>
    <n-icon v-if="isNewPlan">
      <FiberNewOutlined></FiberNewOutlined>
    </n-icon>
  </div>
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
