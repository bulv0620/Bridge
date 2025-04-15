<script setup lang="ts">
import { DiffFile } from '@renderer/utils/file-system'
import { computed, h, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import DiffTypeTag from './DiffTypeTag.vue'
import DiffActionButton from './DiffActionButton.vue'
import DiffDetail from './DiffDetail.vue'

withDefaults(
  defineProps<{
    loading: boolean
  }>(),
  {
    loading: false,
  },
)

const { t } = useI18n()

const diffTableData = defineModel<DiffFile[]>('data')
const columns = computed(() => [
  {
    type: 'expand',
    renderExpand: (row: DiffFile) => {
      return h(DiffDetail, { diffFile: row })
    },
  },
  {
    title: t('views.backpack.index'),
    key: 'key',
    align: 'center',
    width: 60,
    render(_: DiffFile, index: number) {
      return index + 1
    },
  },
  {
    title: t('views.backpack.diffType'),
    key: 'diffType',
    align: 'center',
    width: 140,
    filterOptions: [
      {
        label: t('views.backpack.onlySource'),
        value: 'onlySource',
      },
      {
        label: t('views.backpack.onlyTarget'),
        value: 'onlyTarget',
      },
      {
        label: t('views.backpack.conflict'),
        value: 'conflict',
      },
    ],
    filter(value: string, row: DiffFile) {
      return row.diffType === value
    },
    render(row: DiffFile) {
      return h(DiffTypeTag, {
        diffType: row.diffType,
      })
    },
  },
  {
    title: t('views.backpack.sourceFile'),
    key: 'sourceFileName',
    align: 'center',
    resizable: true,
    render(row: DiffFile) {
      return row.source?.fileName
    },
    ellipsis: {
      tooltip: true,
    },
  },
  {
    title: t('views.backpack.targetFile'),
    key: 'targetFileName',
    align: 'center',
    resizable: true,
    render(row: DiffFile) {
      return row.target?.fileName
    },
    ellipsis: {
      tooltip: true,
    },
  },
  {
    title: t('views.backpack.action'),
    key: 'operation',
    align: 'center',
    width: 100,
    render(row: DiffFile) {
      return h(DiffActionButton, {
        diffType: row.diffType,
        action: row.action,
        'onUpdate:action': (val) => {
          row.action = val
        },
      })
    },
  },
])

const tableRef = ref<any>()
const scrollTo = (top: number) => {
  tableRef.value?.scrollTo({
    top: top,
    left: 0,
  })
}

defineExpose({
  scrollTo,
})
</script>

<template>
  <n-data-table
    ref="tableRef"
    :loading="loading"
    size="small"
    virtual-scroll
    :columns="columns"
    :data="diffTableData"
    flex-height
    style="height: 100%"
  />
</template>
