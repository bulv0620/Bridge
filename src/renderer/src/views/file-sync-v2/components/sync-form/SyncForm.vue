<script setup lang="ts">
import { useSyncForm } from '@renderer/composables/file-sync-v2/useSyncForm'
import EndpointCard from './form-item/EndpointCard.vue'
import StrategyDropdown from './form-item/StrategyDropdown.vue'

const { syncForm } = useSyncForm()
</script>

<template>
  <div class="sync-form">
    <EndpointCard v-model:endpoint="syncForm.sourceEndpoint" type="source"></EndpointCard>
    <StrategyDropdown v-model:strategy="syncForm.syncStrategy"></StrategyDropdown>
    <EndpointCard type="destination"></EndpointCard>
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
