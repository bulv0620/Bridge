<script setup lang="ts">
import { computed, h } from 'vue'
import { useI18n } from 'vue-i18n'
import DiffTypeTag from './cells/DiffTypeTag.vue'
import DiffActionButton from './cells/DiffActionButton.vue'
import DiffDetail from './cells/DiffDetail.vue'
import { useDiffList } from '@renderer/composables/file-sync/useDiffList'
import { DiffFile } from '@renderer/composables/file-sync/useSyncTool'

const { t } = useI18n()

const { loading, processing, diffTableData, filterOptionValues, tableRef, handleUpdateFilter } =
  useDiffList()

const columns = computed(() => [
  {
    type: 'expand',
    expandable: () => !processing.value,
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
  {
    title: t('views.fileSync.diffType'),
    key: 'diffType',
    align: 'center',
    width: 140,
    filterOptionValues: filterOptionValues.value,
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
  },
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
        processing: processing.value,
        action: row.action,
        'onUpdate:action': (val) => {
          row.action = val
        },
      })
    },
  },
])
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
