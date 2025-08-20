<script setup lang="ts">
import FileNameWithIcon from './cells/FileNameWithIcon.vue'
import SyncResolution from './cells/SyncResolution.vue'
import { useFileList } from '@renderer/composables/file-sync-v2/useFileList'
import { reactive } from 'vue'
import { VxeTable, VxeColumn, VxeTablePropTypes } from 'vxe-table'

const treeConfig = reactive<VxeTablePropTypes.TreeConfig>({
  transform: true,
  rowField: 'id',
  parentField: 'parentId',
})

const { diffFileList, cellStyle, rowClassName, getFormatDate, getFileSize } = useFileList()
</script>

<template>
  <VxeTable
    class="diff-file-table"
    :data="diffFileList"
    size="small"
    height="100%"
    :row-config="{ isHover: true }"
    :tree-config="treeConfig"
    :virtual-y-config="{ enabled: true, gt: 0 }"
    :scrollbar-config="{ width: 8, height: 8 }"
    :cell-style="cellStyle"
    :row-class-name="rowClassName"
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
        <SyncResolution
          v-model:type="row.resolution"
          v-model:byte="row.transferBytes"
          :is-directory="row.isDirectory"
          :source="row.source"
          :destination="row.destination"
        ></SyncResolution>
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

.diff-file-table {
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-thumb {
    background-color: var(--n-scrollbar-color);
  }
  ::-webkit-scrollbar-thumb:hover,
  ::-webkit-scrollbar-thumb:active {
    background-color: var(--n-scrollbar-color-hover);
  }
}
</style>
