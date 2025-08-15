<script setup lang="ts">
import { h } from 'vue'
import { type DataTableColumns } from 'naive-ui'
import FileNameWithIcon from './cells/FileNameWithIcon.vue'
import SyncTypeAction from './cells/SyncTypeAction.vue'
import { useFileList } from '@renderer/composables/file-sync-v2/useFileList'
import { formatBytes } from '@renderer/utils/format'
import dayjs from 'dayjs'

const { expandedRowKeys, diffFileList, diffFileTableRef, getCellProps, getRowClassName } =
  useFileList()

const columns: DataTableColumns<DiffInfo> = [
  {
    title: 'fileName',
    key: 'fileName',
    fixed: 'left',
    minWidth: 200,
    resizable: true,
    render(row) {
      return h(FileNameWithIcon, {
        fileName: row.fileName,
        isDirectory: row.isDirectory,
      })
    },
  },
  {
    title: 'L Size',
    key: 'LSize',
    width: 120,
    align: 'right',
    render(row) {
      return row.isDirectory ? '-' : row.sourceFile ? formatBytes(row.sourceFile.size) : ''
    },
    cellProps: (row) => getCellProps(row, 'source'),
  },
  {
    title: 'L Date',
    key: 'LDate',
    minWidth: 200,
    align: 'right',
    render(row) {
      return row.isDirectory
        ? '-'
        : row.sourceFile
          ? dayjs(row.sourceFile.timestamp).format('YYYY-MM-DD HH:mm:ss')
          : ''
    },
    cellProps: (row) => getCellProps(row, 'source'),
  },
  {
    title: 'action',
    key: 'action',
    width: 120,
    align: 'center',
    render(row) {
      return h(SyncTypeAction, {
        type: row.action,
        isDirectory: row.isDirectory,
        'onUpdate:type': (type) => (row.action = type),
      })
    },
  },
  {
    title: 'R Size',
    key: 'RSize',
    width: 120,
    align: 'right',
    render(row) {
      return row.isDirectory ? '-' : row.targetFile ? formatBytes(row.targetFile.size) : ''
    },
    cellProps: (row) => getCellProps(row, 'target'),
  },
  {
    title: 'R Date',
    key: 'RDate',
    minWidth: 200,
    align: 'right',
    render(row) {
      return row.isDirectory
        ? '-'
        : row.targetFile
          ? dayjs(row.targetFile.timestamp).format('YYYY-MM-DD HH:mm:ss')
          : ''
    },
    cellProps: (row) => getCellProps(row, 'target'),
  },
]
</script>

<template>
  <n-data-table
    ref="diffFileTableRef"
    v-model:expanded-row-keys="expandedRowKeys"
    size="small"
    :columns="columns"
    :data="diffFileList"
    :row-key="(row: DiffInfo) => row.id"
    flex-height
    scroll-x="min-content"
    style="height: 100%; width: 100%"
    :row-class-name="getRowClassName"
  />
</template>

<style lang="less" scoped>
:deep(.n-data-table-td) {
  vertical-align: middle !important;
}

:deep(.grey-row .n-data-table-td) {
  color: var(--n-th-icon-color) !important;
}
</style>
