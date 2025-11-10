<script setup lang="ts">
import { NProgress, NTag } from 'naive-ui'
import { useTaskList } from '@renderer/composables/downloader/useTaskList'
import { VxeTable, VxeColumn } from 'vxe-table'

const { tableData, tableRef } = useTaskList()
</script>

<template>
  <div class="table">
    <VxeTable
      ref="tableRef"
      :data="tableData"
      size="small"
      round
      height="100%"
      :row-config="{ isHover: true, keyField: 'gid' }"
      :virtual-y-config="{ enabled: true, gt: 0 }"
    >
      <vxe-column type="checkbox" width="45" align="center"></vxe-column>
      <VxeColumn field="name" :title="$t('views.downloader.taskName')" resizable :min-width="200">
        <template #default="{ row }">
          <n-ellipsis style="width: 100%">{{ row.name }}</n-ellipsis>
        </template>
      </VxeColumn>
      <VxeColumn
        field="status"
        :title="$t('views.downloader.taskStatus')"
        resizable
        :min-width="110"
      >
        <template #default="{ row }">
          <n-tag :type="row.status.type" size="small">{{ row.status.label }}</n-tag>
        </template>
      </VxeColumn>
      <VxeColumn
        field="progress"
        :title="$t('views.downloader.taskProgress')"
        resizable
        :min-width="200"
      >
        <template #default="{ row }">
          <n-progress
            type="line"
            :percentage="row.progress"
            :height="12"
            indicator-placement="inside"
          ></n-progress>
        </template>
      </VxeColumn>
      <VxeColumn
        field="size"
        :title="$t('views.downloader.taskSize')"
        resizable
        :min-width="140"
        show-overflow="ellipsis"
      ></VxeColumn>
      <VxeColumn
        field="speed"
        :title="$t('views.downloader.taskSpeed')"
        resizable
        :min-width="100"
        show-overflow="ellipsis"
      ></VxeColumn>
      <VxeColumn
        field="eta"
        :title="$t('views.downloader.taskTimeLeft')"
        :min-width="100"
        show-overflow="ellipsis"
      ></VxeColumn>
    </VxeTable>
  </div>
</template>

<style lang="less" scoped>
.table {
  flex: 1;
  overflow: hidden;
}
</style>
