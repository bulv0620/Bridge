<script setup lang="ts">
import { useActiveSyncSession } from '@renderer/composables/file-sync/useActiveSyncSession'
import EndpointCard from './form-item/EndpointCard.vue'
import StrategyDropdown from './form-item/StrategyDropdown.vue'

const { activeSessionState } = useActiveSyncSession()
</script>

<template>
  <div class="sync-form">
    <EndpointCard
      v-model:endpoint="activeSessionState!.formData.sourceConfig"
      type="source"
    ></EndpointCard>
    <StrategyDropdown
      v-model:strategy="activeSessionState!.formData.syncStrategy"
    ></StrategyDropdown>
    <EndpointCard
      v-model:endpoint="activeSessionState!.formData.destinationConfig"
      type="destination"
    ></EndpointCard>
  </div>
</template>

<style lang="less" scoped>
.sync-form {
  padding: 16px;
  padding-bottom: 0;
  display: flex;
  gap: 12px;
  align-items: center;
}
</style>
