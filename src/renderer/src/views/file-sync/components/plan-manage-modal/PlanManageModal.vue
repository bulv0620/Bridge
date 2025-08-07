<script setup lang="ts">
import { NButton } from 'naive-ui'
import { computed, h } from 'vue'
import { useI18n } from 'vue-i18n'
import PlanDetail from './cells/PlanDetail.vue'
import { PlanInfo, usePlanManage } from '@renderer/composables/file-sync/usePlanManage'

const { t } = useI18n()

const { manageModalVisible, savedPlanList, selectPlan, deletePlan } = usePlanManage()

const columns = computed(() => [
  {
    type: 'expand',
    renderExpand: (row: PlanInfo) => {
      return h(PlanDetail, { plan: row })
    },
  },
  {
    title: '#',
    key: 'no',
    align: 'center',
    width: 50,
    render(_: any, index: number) {
      return h('span', {}, index + 1)
    },
  },
  {
    title: t('views.fileSync.planName'),
    key: 'planName',
    align: 'center',
  },
  {
    title: t('views.fileSync.action'),
    key: 'actions',
    align: 'center',
    render(row: any) {
      return [
        h(
          NButton,
          {
            strong: true,
            tertiary: true,
            size: 'small',
            onClick: () => {
              selectPlan(row)
            },
            style: { marginRight: '5px' },
          },
          { default: () => t('common.select') },
        ),
        h(
          NButton,
          {
            strong: true,
            tertiary: true,
            size: 'small',
            onClick: () => {
              deletePlan(row)
            },
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
    v-model:show="manageModalVisible"
    style="width: 600px"
    preset="card"
    :title="$t('views.fileSync.planList')"
  >
    <n-data-table
      :columns="columns"
      :data="savedPlanList"
      :bordered="false"
      :max-height="280"
      size="small"
      :row-key="(rowData: PlanInfo) => rowData.planId"
    />

    <template #footer>
      <n-flex justify="end">
        <n-button size="small" @click="manageModalVisible = false">{{
          t('common.close')
        }}</n-button>
      </n-flex>
    </template>
  </n-modal>
</template>
