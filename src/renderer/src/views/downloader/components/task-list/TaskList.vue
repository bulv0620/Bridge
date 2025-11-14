<script setup lang="ts">
import { NProgress, NTag } from 'naive-ui'
import { DownloadTaskInfo, useTaskList } from '@renderer/composables/downloader/useTaskList'

const { tableData, tableRef, checkedRows } = useTaskList()

function handleSelectionChange(rows: DownloadTaskInfo[]) {
  checkedRows.value = rows
}
</script>

<template>
  <div class="table">
    <el-table
      ref="tableRef"
      :data="tableData"
      height="100%"
      row-key="gid"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" reserve-selection />
      <el-table-column
        prop="name"
        :label="$t('views.downloader.taskName')"
        resizable
        :min-width="200"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          {{ row.name }}
        </template>
      </el-table-column>
      <el-table-column
        prop="status"
        :label="$t('views.downloader.taskStatus')"
        resizable
        :min-width="110"
      >
        <template #default="{ row }">
          <n-tag :type="row.status.type" size="small">{{ row.status.label }}</n-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="progress"
        :label="$t('views.downloader.taskProgress')"
        resizable
        :min-width="200"
      >
        <template #default="{ row }">
          <n-progress
            type="line"
            :percentage="row.progress"
            :status="{ active: 'info', complete: 'success' }[row.origin.status] || 'warning'"
            :height="12"
            :processing="row.origin.status === 'active'"
            indicator-placement="inside"
          ></n-progress>
        </template>
      </el-table-column>
      <el-table-column
        prop="size"
        :label="$t('views.downloader.taskSize')"
        resizable
        :min-width="170"
        show-overflow-tooltip
      ></el-table-column>
      <el-table-column
        prop="speed"
        :label="$t('views.downloader.taskSpeed')"
        resizable
        :min-width="110"
        show-overflow-tooltip
      ></el-table-column>
      <el-table-column
        prop="eta"
        :label="$t('views.downloader.taskTimeLeft')"
        :min-width="110"
        show-overflow-tooltip
      ></el-table-column>
    </el-table>
  </div>
</template>

<style lang="less" scoped>
.table {
  flex: 1;
  overflow: hidden;
}
</style>
