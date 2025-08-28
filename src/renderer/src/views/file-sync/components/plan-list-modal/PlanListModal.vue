<script setup lang="ts">
import { h, computed } from 'vue'
import { NButton, NDataTable } from 'naive-ui'
import { useSyncPlan } from '@renderer/composables/file-sync/useSyncPlan'

const { planListModalVisible, planList, selectPlan, removePlan } = useSyncPlan()

// 时间格式化工具
function formatTime(ts?: number) {
  if (!ts) return '-'
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// 表格列定义
const columns = computed(() => [
  {
    title: '名称',
    key: 'name',
  },
  {
    title: '时间',
    key: 'timestamp',
    render(row: FileSyncPlan) {
      return formatTime(row.timestamp)
    },
  },
  {
    title: '操作',
    key: 'actions',
    render(row: FileSyncPlan) {
      return [
        h(
          NButton,
          {
            size: 'small',
            type: 'primary',
            style: 'margin-right: 8px;',
            onClick: () => selectPlan(row),
          },
          { default: () => '选择' },
        ),
        h(
          NButton,
          {
            size: 'small',
            type: 'error',
            onClick: () => removePlan(row.id!),
          },
          { default: () => '删除' },
        ),
      ]
    },
  },
])
</script>

<template>
  <n-modal
    v-model:show="planListModalVisible"
    style="width: 600px"
    preset="card"
    :title="$t('views.fileSync.savedPlans')"
    :mask-closable="false"
  >
    <n-data-table :columns="columns" :data="planList" :bordered="false" />
  </n-modal>
</template>
