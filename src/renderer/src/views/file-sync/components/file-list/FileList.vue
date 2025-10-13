<script setup lang="ts">
import FileNameWithIcon from './cells/FileNameWithIcon.vue'
import SyncResolution from './cells/SyncResolution.vue'
import { useFileList } from '@renderer/composables/file-sync/useFileList'
import { useSyncForm } from '@renderer/composables/file-sync/useSyncForm'
import { reactive } from 'vue'
import { VxeTable, VxeColumn, VxeTablePropTypes } from 'vxe-table'

const { diffFileList, cellStyle, rowClassName, getFormatDate, getFileSize, getFileList } =
  useFileList()
const { isComparing, isSyncing } = useSyncForm()

const treeConfig = reactive<VxeTablePropTypes.TreeConfig>({
  transform: true,
  rowField: 'id',
  parentField: 'parentId',
  lazy: true,
  hasChildField: 'isDirectory',
  loadMethod({ row }) {
    // 异步加载子节点
    return getFileList(row)
  },
})
</script>

<template>
  <VxeTable
    class="diff-file-table"
    :data="diffFileList"
    size="small"
    round
    height="100%"
    :row-config="{ isHover: true, keyField: 'id' }"
    :tree-config="treeConfig"
    :virtual-y-config="{ enabled: true, gt: 0 }"
    :cell-style="cellStyle"
    :row-class-name="rowClassName"
    :loading="isComparing || isSyncing"
  >
    <template #loading>
      <n-space vertical>
        <n-spin size="medium">
          <template #description>
            <n-text v-if="isComparing" type="primary">
              {{ $t('views.fileSync.comparing') }}...
            </n-text>
            <n-text v-else-if="isSyncing" type="primary">
              {{ $t('views.fileSync.syncing') }}...
            </n-text>
          </template>
        </n-spin>
      </n-space>
    </template>
    <VxeColumn
      field="fileName"
      :title="$t('views.fileSync.fileName')"
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
    <VxeColumn field="leftSize" :title="$t('views.fileSync.leftSize')" :min-width="120">
      <template #default="{ row }">
        {{ getFileSize('source', row) }}
      </template>
    </VxeColumn>
    <VxeColumn field="leftDate" :title="$t('views.fileSync.leftDate')" :min-width="200">
      <template #default="{ row }">
        {{ getFormatDate('source', row) }}
      </template>
    </VxeColumn>
    <VxeColumn
      field="resolution"
      :title="$t('views.fileSync.resolution')"
      :min-width="120"
      align="center"
    >
      <template #default="{ row }">
        <SyncResolution
          :id="row.id"
          v-model:type="row.resolution"
          v-model:byte="row.transferBytes"
          :is-directory="row.isDirectory"
          :source="row.source"
          :destination="row.destination"
        ></SyncResolution>
      </template>
    </VxeColumn>
    <VxeColumn field="rightSize" :title="$t('views.fileSync.rightSize')" :min-width="120">
      <template #default="{ row }">
        {{ getFileSize('destination', row) }}
      </template>
    </VxeColumn>
    <VxeColumn field="rightDate" :title="$t('views.fileSync.rightDate')" :min-width="200">
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
