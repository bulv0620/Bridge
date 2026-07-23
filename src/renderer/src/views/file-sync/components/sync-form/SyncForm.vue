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
  min-width: 0;
  padding: var(--bridge-page-padding) var(--bridge-page-padding) 0;
  display: flex;
  gap: 14px;
  align-items: center;
}

@media (max-width: 760px) {
  .sync-form {
    gap: 8px;
  }
}
</style>
