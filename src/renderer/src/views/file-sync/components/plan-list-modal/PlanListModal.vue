<script setup lang="ts">
import { h, computed } from 'vue'
import { NButton, NDataTable } from 'naive-ui'
import { useSyncPlan } from '@renderer/composables/file-sync/useSyncPlan'
import dayjs from 'dayjs'

const { planListModalVisible, planList, selectPlan, removePlan } = useSyncPlan()

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
      return dayjs(row.timestamp).format('YYYY-MM-DD HH:mm:ss')
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
            onClick: () => removePlan(row),
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
    size="small"
    :title="$t('views.fileSync.savedPlans')"
    :mask-closable="false"
  >
    <n-data-table :columns="columns" :data="planList" :bordered="false" />
    <template #footer> </template>
  </n-modal>
</template>
