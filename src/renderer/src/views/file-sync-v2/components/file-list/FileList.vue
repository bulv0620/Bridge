<script setup lang="ts">
import FileNameWithIcon from './cells/FileNameWithIcon.vue'
import SyncTypeAction from './cells/SyncTypeAction.vue'
import { useFileList } from '@renderer/composables/file-sync-v2/useFileList'
import { formatBytes } from '@renderer/utils/format'
import dayjs from 'dayjs'
import { reactive } from 'vue'
import { VxeTable, VxeColumn, VxeTablePropTypes } from 'vxe-table'

const treeConfig = reactive<VxeTablePropTypes.TreeConfig>({
  transform: true,
  rowField: 'id',
  parentField: 'parentId',
})

const { expandedRowKeys, diffFileList, getCellProps, getRowClassName } = useFileList()

function getFormatDate(type: 'source' | 'destination', differenceItem: FileDifference) {
  if (differenceItem.isDirectory) {
    return '-'
  }
  const target = type === 'source' ? differenceItem.source : differenceItem.destination
  if (!target) return ''
  else {
    return dayjs(target.timestamp).format('YYYY-MM-DD HH:mm:ss')
  }
}

function getFileSize(type: 'source' | 'destination', differenceItem: FileDifference) {
  if (differenceItem.isDirectory) {
    return '-'
  }
  const target = type === 'source' ? differenceItem.source : differenceItem.destination
  if (!target) return ''
  else {
    return formatBytes(target.size)
  }
}
</script>

<template>
  <VxeTable
    :data="diffFileList"
    size="small"
    height="100%"
    show-overflow="tooltip"
    :tree-config="treeConfig"
  >
    <VxeColumn
      field="fileName"
      :title="$t('views.fileSyncV2.fileName')"
      :width="200"
      resizable
      tree-node
    >
      <template #default="{ row }">
        <FileNameWithIcon
          :file-name="row.fileName"
          :is-directory="row.isDirectory"
        ></FileNameWithIcon>
      </template>
    </VxeColumn>
    <VxeColumn :title="$t('views.fileSyncV2.leftSize')" :width="120">
      <template #default="{ row }">
        {{ getFileSize('source', row) }}
      </template>
    </VxeColumn>
    <VxeColumn :title="$t('views.fileSyncV2.leftDate')" :min-width="200">
      <template #default="{ row }">
        {{ getFormatDate('source', row) }}
      </template>
    </VxeColumn>
    <VxeColumn :title="$t('views.fileSyncV2.resolution')" :width="120" align="center">
      <template #default="{ row }">
        <SyncTypeAction
          v-model:type="row.resolution"
          :is-directory="row.isDirectory"
        ></SyncTypeAction>
      </template>
    </VxeColumn>
    <VxeColumn :title="$t('views.fileSyncV2.rightSize')" :width="120">
      <template #default="{ row }">
        {{ getFileSize('destination', row) }}
      </template>
    </VxeColumn>
    <VxeColumn :title="$t('views.fileSyncV2.rightDate')" :min-width="200">
      <template #default="{ row }">
        {{ getFormatDate('destination', row) }}
      </template>
    </VxeColumn>
  </VxeTable>
</template>

<style lang="less" scoped>
:deep(.n-data-table-td) {
  vertical-align: middle !important;
}

:deep(.grey-row .n-data-table-td) {
  color: var(--n-th-icon-color) !important;
}
</style>
