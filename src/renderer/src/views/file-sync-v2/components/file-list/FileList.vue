<script setup lang="ts">
import { computed, h } from 'vue'
import { type DataTableColumns } from 'naive-ui'
import FileNameWithIcon from './cells/FileNameWithIcon.vue'
import SyncTypeAction from './cells/SyncTypeAction.vue'
import { useFileList } from '@renderer/composables/file-sync-v2/useFileList'
import { formatBytes } from '@renderer/utils/format'
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { expandedRowKeys, diffFileList, getCellProps, getRowClassName } = useFileList()

const columns = computed<DataTableColumns<FileDifference>>(() => [
  {
    title: t('views.fileSyncV2.fileName'),
    key: 'fileName',
    fixed: 'left',
    minWidth: 200,
    resizable: true,
    ellipsis: {
      tooltip: true,
    },
    // render(row) {
    //   return h(FileNameWithIcon, {
    //     fileName: row.fileName,
    //     isDirectory: row.isDirectory,
    //   })
    // },
  },
  {
    title: t('views.fileSyncV2.leftSize'),
    key: 'LSize',
    width: 120,
    align: 'right',
    render(row) {
      return row.isDirectory ? '-' : row.source ? formatBytes(row.source.size) : ''
    },
    cellProps: (row) => getCellProps(row, 'source'),
  },
  {
    title: t('views.fileSyncV2.leftDate'),
    key: 'LDate',
    minWidth: 200,
    align: 'right',
    render(row) {
      return row.isDirectory
        ? '-'
        : row.source
          ? dayjs(row.source.timestamp).format('YYYY-MM-DD HH:mm:ss')
          : ''
    },
    cellProps: (row) => getCellProps(row, 'source'),
  },
  {
    title: t('views.fileSyncV2.resolution'),
    key: 'resolution',
    width: 120,
    align: 'center',
    render(row) {
      return h(SyncTypeAction, {
        type: row.resolution,
        isDirectory: row.isDirectory,
        'onUpdate:type': (type) => (row.resolution = type),
      })
    },
  },
  {
    title: t('views.fileSyncV2.rightSize'),
    key: 'RSize',
    width: 120,
    align: 'right',
    render(row) {
      return row.isDirectory ? '-' : row.destination ? formatBytes(row.destination.size) : ''
    },
    cellProps: (row) => getCellProps(row, 'destination'),
  },
  {
    title: t('views.fileSyncV2.rightDate'),
    key: 'RDate',
    minWidth: 200,
    align: 'right',
    render(row) {
      return row.isDirectory
        ? '-'
        : row.destination
          ? dayjs(row.destination.timestamp).format('YYYY-MM-DD HH:mm:ss')
          : ''
    },
    cellProps: (row) => getCellProps(row, 'destination'),
  },
])
</script>

<template>
  <n-data-table
    v-model:expanded-row-keys="expandedRowKeys"
    size="small"
    virtual-scroll
    :columns="columns"
    :data="diffFileList"
    :row-key="(row: FileDifference) => row.id"
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
