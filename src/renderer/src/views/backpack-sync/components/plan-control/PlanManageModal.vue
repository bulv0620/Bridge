<script setup lang="ts">
import { NButton, useDialog } from 'naive-ui'
import { computed, h, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { PlanInfo } from './PlanControl.vue'
import PlanDetail from './PlanDetail.vue'
import { dialogPromise } from '@renderer/utils/dialog'

const { t } = useI18n()
const dialog = useDialog()

const props = defineProps<{
  isPlanSaved: boolean
}>()

const emit = defineEmits(['selectPlan', 'deletePlan'])

const visible = ref(false)
const tableData = ref<PlanInfo[]>([])
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
    title: t('views.backpack.planName'),
    key: 'planName',
    align: 'center',
  },
  {
    title: t('views.backpack.action'),
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
              handleSelectPlan(row)
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
              handleDeletePlan(row)
            },
          },
          { default: () => t('common.delete') },
        ),
      ]
    },
  },
])

const open = () => {
  visible.value = true

  const planList = localStorage.getItem('planList')
  const planListData = planList ? JSON.parse(planList) : []

  tableData.value = planListData
}

const handleSelectPlan = async (row: PlanInfo) => {
  if (!props.isPlanSaved) {
    await dialogPromise(dialog.warning, {
      title: t('common.warning'),
      content: t('views.backpack.selectPlanConfirm'),
      positiveText: t('common.confirm'),
      negativeText: t('common.cancel'),
    })
  }
  emit('selectPlan', row)
  visible.value = false
}

const handleDeletePlan = async (row: PlanInfo) => {
  await dialogPromise(dialog.warning, {
    title: t('common.warning'),
    content: t('views.backpack.deletePlanConfirm'),
    positiveText: t('common.confirm'),
    negativeText: t('common.cancel'),
  })

  const index = tableData.value.findIndex((plan: PlanInfo) => plan.planId === row.planId)
  if (index !== -1) {
    tableData.value.splice(index, 1)
    localStorage.setItem('planList', JSON.stringify(tableData.value))
  }
  emit('deletePlan', row.planId)
}

defineExpose({
  open,
})
</script>

<template>
  <n-modal
    v-model:show="visible"
    style="width: 600px"
    preset="card"
    :title="$t('views.backpack.planList')"
  >
    <n-data-table
      :columns="columns"
      :data="tableData"
      :bordered="false"
      :max-height="280"
      size="small"
      :row-key="(rowData: PlanInfo) => rowData.planId"
    />

    <template #footer>
      <n-flex justify="end">
        <n-button size="small" @click="visible = false">{{ t('common.close') }}</n-button>
      </n-flex>
    </template>
  </n-modal>
</template>
