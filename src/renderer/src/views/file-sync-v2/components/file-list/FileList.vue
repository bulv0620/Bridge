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

const { diffFileList, cellStyle, rowClassName } = useFileList()

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
    :scroll-x="{
      enabled: true,
      gt: 100,
      oSize: 5,
    }"
    :tree-config="treeConfig"
    :cell-style="cellStyle"
    :row-class-name="rowClassName"
  >
    <VxeColumn
      field="fileName"
      :title="$t('views.fileSyncV2.fileName')"
      :width="200"
      resizable
      tree-node
      fixed="left"
    >
      <template #default="{ row }">
        <FileNameWithIcon
          :file-name="row.fileName"
          :is-directory="row.isDirectory"
        ></FileNameWithIcon>
      </template>
    </VxeColumn>
    <VxeColumn field="leftSize" :title="$t('views.fileSyncV2.leftSize')" :min-width="120">
      <template #default="{ row }">
        {{ getFileSize('source', row) }}
      </template>
    </VxeColumn>
    <VxeColumn field="leftDate" :title="$t('views.fileSyncV2.leftDate')" :min-width="200">
      <template #default="{ row }">
        {{ getFormatDate('source', row) }}
      </template>
    </VxeColumn>
    <VxeColumn
      field="resolution"
      :title="$t('views.fileSyncV2.resolution')"
      :min-width="120"
      align="center"
    >
      <template #default="{ row }">
        <SyncTypeAction
          v-model:type="row.resolution"
          :is-directory="row.isDirectory"
        ></SyncTypeAction>
      </template>
    </VxeColumn>
    <VxeColumn field="rightSize" :title="$t('views.fileSyncV2.rightSize')" :min-width="120">
      <template #default="{ row }">
        {{ getFileSize('destination', row) }}
      </template>
    </VxeColumn>
    <VxeColumn field="rightDate" :title="$t('views.fileSyncV2.rightDate')" :min-width="200">
      <template #default="{ row }">
        {{ getFormatDate('destination', row) }}
      </template>
    </VxeColumn>
  </VxeTable>
</template>

<style lang="less">
.grey-row {
  color: rgba(100, 100, 100, 0.5) !important;
}
</style>
