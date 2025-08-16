<script setup lang="ts">
import { NIcon } from 'naive-ui'
import { Component, computed, h } from 'vue'
import { SwapHorizontal, ArrowForward, Add } from '@vicons/ionicons5'
import EndpointCard from './form-item/EndpointCard.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const options = computed(() => [
  {
    label: t('views.fileSyncV2.mirror'),
    key: 'mirror',
    icon: renderIcon(ArrowForward),
  },
  {
    label: t('views.fileSyncV2.incremental'),
    key: 'incremental',
    icon: renderIcon(Add),
  },
  {
    label: t('views.fileSyncV2.bidirectional'),
    key: 'bidirectional',
    icon: renderIcon(SwapHorizontal),
  },
])

function renderIcon(icon: Component) {
  return () => {
    return h(NIcon, null, {
      default: () => h(icon),
    })
  }
}
</script>

<template>
  <div class="sync-form">
    <EndpointCard type="source"></EndpointCard>

    <n-dropdown :options="options">
      <n-button size="small" circle secondary plain>
        <template #icon>
          <n-icon><ArrowForward></ArrowForward></n-icon>
        </template>
      </n-button>
    </n-dropdown>

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
