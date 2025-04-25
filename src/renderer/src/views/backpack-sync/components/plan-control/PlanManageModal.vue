<script setup lang="ts">
import { NButton } from 'naive-ui'
import { computed, h, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { PlanInfo } from './PlanControl.vue'

const { t } = useI18n()

const visible = ref(false)
const tableData = ref<PlanInfo[]>(JSON.parse(localStorage.getItem('planList') || '[]'))
const columns = computed(() => [
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
              console.log('Select', row)
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
              console.log('Del', row)
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
}

defineExpose({
  open,
})
</script>

<template>
  <n-modal
    v-model:show="visible"
    style="width: 500px"
    preset="card"
    :title="$t('views.backpack.planList')"
  >
    <n-data-table
      :columns="columns"
      :data="tableData"
      :bordered="false"
      :max-height="150"
      size="small"
    />

    <template #footer>
      <n-flex justify="end">
        <n-button size="small" @click="visible = false">{{ t('common.cancel') }}</n-button>
      </n-flex>
    </template>
  </n-modal>
</template>
