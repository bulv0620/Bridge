<script setup lang="ts">
import { DiffFile } from '@renderer/utils/file-system'
import { computed, h, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import DiffTypeTag from './DiffTypeTag.vue'
import DiffActionButton from './DiffActionButton.vue'
import DiffDetail from './DiffDetail.vue'
import { DataTableBaseColumn, DataTableFilterState } from 'naive-ui'

const props = withDefaults(
  defineProps<{
    loading: boolean
    processing: boolean
  }>(),
  {
    loading: false,
    processing: false,
  },
)

const { t } = useI18n()

const diffTableData = defineModel<DiffFile[]>('data')
const diffTypeColumn = reactive({
  title: computed(() => t('views.fileSync.diffType')),
  key: 'diffType',
  align: 'center',
  width: 140,
  filterOptionValues: [],
  filterOptions: [
    {
      label: t('views.fileSync.onlySource'),
      value: 'onlySource',
    },
    {
      label: t('views.fileSync.onlyTarget'),
      value: 'onlyTarget',
    },
    {
      label: t('views.fileSync.conflict'),
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
})
const columns = computed(() => [
  {
    type: 'expand',
    expandable: () => !props.processing,
    renderExpand: (row: DiffFile) => {
      return h(DiffDetail, { diffFile: row })
    },
  },
  {
    title: t('views.fileSync.index'),
    key: 'key',
    align: 'center',
    width: 60,
    render(_: DiffFile, index: number) {
      return index + 1
    },
  },
  diffTypeColumn,
  {
    title: t('views.fileSync.sourceFile'),
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
    title: t('views.fileSync.targetFile'),
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
    title: t('views.fileSync.action'),
    key: 'operation',
    align: 'center',
    width: 100,
    render(row: DiffFile) {
      return h(DiffActionButton, {
        status: row.status!,
        processing: props.processing,
        action: row.action,
        'onUpdate:action': (val) => {
          row.action = val
        },
      })
    },
  },
])

const tableRef = ref<any>()
const scrollTo = (index: number) => {
  tableRef.value?.scrollTo({ index })
}

const clearFilter = () => {
  diffTypeColumn.filterOptionValues = []
}

const handleUpdateFilter = (filters: DataTableFilterState, sourceColumn: DataTableBaseColumn) => {
  console.log(filters)
  diffTypeColumn.filterOptionValues = filters[sourceColumn.key] as any
}

defineExpose({
  scrollTo,
  clearFilter,
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
    @update:filters="handleUpdateFilter"
  />
</template>
