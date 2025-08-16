<script setup lang="ts">
import { NIcon } from 'naive-ui'
import { Component, computed, h } from 'vue'
import { ArrowRight20Filled, ArrowStepOver20Filled, ArrowSplit20Filled } from '@vicons/fluent'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const strategy = defineModel<SyncStrategy>('strategy', { required: true })

const strategyIconMap = {
  mirror: ArrowRight20Filled,
  incremental: ArrowStepOver20Filled,
  bidirectional: ArrowSplit20Filled,
}

const strategyOptions = computed(() => [
  {
    label: t('views.fileSyncV2.mirror'),
    key: 'mirror',
    icon: renderIcon(strategyIconMap.mirror),
  },
  {
    label: t('views.fileSyncV2.incremental'),
    key: 'incremental',
    icon: renderIcon(strategyIconMap.incremental),
  },
  {
    label: t('views.fileSyncV2.bidirectional'),
    key: 'bidirectional',
    icon: renderIcon(strategyIconMap.bidirectional),
  },
])

function renderIcon(icon: Component) {
  return () => {
    return h(NIcon, null, {
      default: () => h(icon),
    })
  }
}

function selectStrategy(type: SyncStrategy) {
  strategy.value = type
}
</script>

<template>
  <n-dropdown :options="strategyOptions" @select="selectStrategy">
    <n-button circle secondary plain>
      <template #icon>
        <n-icon :component="strategyIconMap[strategy]"> </n-icon>
      </template>
    </n-button>
  </n-dropdown>
</template>
