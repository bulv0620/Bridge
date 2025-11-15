<script setup lang="ts">
import { ArrowRight20Filled, ArrowStepOver20Filled, ArrowSplit20Filled } from '@vicons/fluent'
import { useI18n } from 'vue-i18n'
import { useSyncForm } from '@renderer/composables/file-sync/useSyncForm'

const { t } = useI18n()
const { isComparing, isSyncing } = useSyncForm()

const strategy = defineModel<SyncStrategy>('strategy', { required: true })

// 图标映射
const strategyIconMap: Record<SyncStrategy, any> = {
  mirror: ArrowRight20Filled,
  incremental: ArrowStepOver20Filled,
  bidirectional: ArrowSplit20Filled,
}

// 下拉菜单选项
const strategyOptions = [
  { label: t('views.fileSync.mirror'), key: 'mirror', icon: strategyIconMap.mirror },
  { label: t('views.fileSync.incremental'), key: 'incremental', icon: strategyIconMap.incremental },
  {
    label: t('views.fileSync.bidirectional'),
    key: 'bidirectional',
    icon: strategyIconMap.bidirectional,
  },
]

function selectStrategy(type: SyncStrategy) {
  strategy.value = type
}
</script>

<template>
  <el-dropdown trigger="click" :disabled="isComparing || isSyncing" @command="selectStrategy">
    <!-- 触发按钮 -->
    <el-button circle :disabled="isComparing || isSyncing">
      <el-icon>
        <component :is="strategyIconMap[strategy]" />
      </el-icon>
    </el-button>

    <!-- 下拉内容 -->
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item v-for="opt in strategyOptions" :key="opt.key" :command="opt.key">
          <el-icon style="margin-right: 6px">
            <component :is="opt.icon" />
          </el-icon>
          {{ opt.label }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>
