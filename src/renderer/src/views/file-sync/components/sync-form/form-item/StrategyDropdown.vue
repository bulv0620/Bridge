<script setup lang="ts">
import { useActiveSyncSession } from '@renderer/composables/file-sync/useActiveSyncSession'
import { ArrowRight20Filled, ArrowStepOver20Filled, ArrowSplit20Filled } from '@vicons/fluent'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { activeSessionState } = useActiveSyncSession()

const strategy = defineModel<SyncStrategy>('strategy', { required: true })

// 图标映射
const strategyIconMap: Record<SyncStrategy, any> = {
  mirror: ArrowRight20Filled,
  incremental: ArrowStepOver20Filled,
  twoWay: ArrowSplit20Filled,
}

// 下拉菜单选项
const strategyOptions = [
  { label: t('views.fileSync.mirror'), key: 'mirror', icon: strategyIconMap.mirror },
  { label: t('views.fileSync.incremental'), key: 'incremental', icon: strategyIconMap.incremental },
  {
    label: t('views.fileSync.twoWay'),
    key: 'twoWay',
    icon: strategyIconMap.twoWay,
  },
]

function selectStrategy(type: SyncStrategy) {
  strategy.value = type
}
</script>

<template>
  <el-dropdown
    trigger="click"
    :disabled="activeSessionState!.isComparing || activeSessionState!.isSyncing"
    @command="selectStrategy"
  >
    <!-- 触发按钮 -->
    <el-button circle :disabled="activeSessionState!.isComparing || activeSessionState!.isSyncing">
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
