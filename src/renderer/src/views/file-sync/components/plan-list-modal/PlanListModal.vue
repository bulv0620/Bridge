<script setup lang="ts">
import { h, computed } from 'vue'
import { NButton, NDataTable } from 'naive-ui'
import { useSyncPlan } from '@renderer/composables/file-sync/useSyncPlan'
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'

const { planListModalVisible, planList, selectPlan, removePlan } = useSyncPlan()

const { t } = useI18n()
// 表格列定义
const columns = computed(() => [
  {
    title: t('views.fileSync.planName'),
    key: 'name',
  },
  {
    title: t('views.fileSync.timestamp'),
    key: 'timestamp',
    render(row: FileSyncPlan) {
      return dayjs(row.timestamp).format('YYYY-MM-DD HH:mm:ss')
    },
  },
  {
    title: t('views.fileSync.actions'),
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
          { default: () => t('common.select') },
        ),
        h(
          NButton,
          {
            size: 'small',
            type: 'error',
            onClick: () => removePlan(row),
          },
          { default: () => t('common.delete') },
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
    <n-data-table :columns="columns" :data="planList" :bordered="false" :max-height="260" />
    <template #footer> </template>
  </n-modal>
</template>
