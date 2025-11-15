<script setup lang="ts">
import { DownloadTaskInfo, useTaskList } from '@renderer/composables/downloader/useTaskList'
import { ElIcon, TableColumnCtx } from 'element-plus'
import ContextMenu from '@imengyu/vue3-context-menu'
import { useTheme } from '@renderer/composables/setting/useTheme'
import { h } from 'vue'
import { Folder, Pause, Play, Stop, TrashBinOutline } from '@vicons/ionicons5'
import { useI18n } from 'vue-i18n'
import { useDownloaderActions } from '@renderer/composables/downloader/useDownloaderAction'

const { tableData, tableRef, checkedRows } = useTaskList()
const { startTask, pauseTask, stopTask, removeTask } = useDownloaderActions()
const { currentTheme } = useTheme()
const { t } = useI18n()

function handleSelectionChange(rows: DownloadTaskInfo[]) {
  checkedRows.value = rows
}

function handleContextmenu(
  row: DownloadTaskInfo,
  _: TableColumnCtx<DownloadTaskInfo>,
  e: MouseEvent,
) {
  console.log(row.origin.status)
  ContextMenu.showContextMenu({
    x: e.x,
    y: e.y + 15,
    theme: currentTheme.value,
    items: [
      {
        label: t('views.downloader.openFolder'),
        divided: true,
        icon: h(ElIcon, { size: 14 }, { default: () => h(Folder) }),
        disabled: !['complete'].includes(row.origin.status),
        onClick: () => {
          window.ipc.file.openFolder(row.origin.files?.[0]?.path)
        },
      },
      {
        label: t('views.downloader.startTask'),
        icon: h(ElIcon, { size: 14 }, { default: () => h(Play) }),
        disabled: !['waiting', 'paused'].includes(row.origin.status),
        onClick: () => {
          startTask(row.origin)
        },
      },
      {
        label: t('views.downloader.pauseTask'),
        icon: h(ElIcon, { size: 14 }, { default: () => h(Pause) }),
        disabled: !['active'].includes(row.origin.status),
        onClick: () => {
          pauseTask(row.origin)
        },
      },
      {
        label: t('views.downloader.stopTask'),
        icon: h(ElIcon, { size: 14 }, { default: () => h(Stop) }),
        disabled: !['active', 'waiting', 'paused'].includes(row.origin.status),
        onClick: () => {
          stopTask(row.origin)
        },
      },
      {
        label: t('views.downloader.removeTask'),
        icon: h(ElIcon, { size: 14 }, { default: () => h(TrashBinOutline) }),
        disabled: !['complete', 'error', 'removed'].includes(row.origin.status),
        onClick: () => {
          removeTask(row.origin)
        },
      },
    ],
  })
}
</script>

<template>
  <div class="table">
    <el-table
      ref="tableRef"
      :data="tableData"
      height="100%"
      row-key="gid"
      border
      @selection-change="handleSelectionChange"
      @row-contextmenu="handleContextmenu"
    >
      <el-table-column type="selection" width="40" reserve-selection fixed />
      <el-table-column
        prop="name"
        :label="$t('views.downloader.taskName')"
        resizable
        :min-width="200"
        fixed
      >
        <template #default="{ row }">
          <div style="width: 100%; line-height: normal">
            <el-text truncated style="width: 100%">{{ row.name }}</el-text>
          </div>
        </template>
      </el-table-column>
      <el-table-column
        prop="status"
        :label="$t('views.downloader.taskStatus')"
        resizable
        :min-width="120"
      >
        <template #default="{ row }">
          <el-tag :type="row.status.type" size="small">{{ row.status.label }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="progress"
        :label="$t('views.downloader.taskProgress')"
        resizable
        :min-width="200"
      >
        <template #default="{ row }">
          <el-progress
            :percentage="row.progress"
            :status="
              row.origin.status === 'complete'
                ? 'success'
                : row.origin.status !== 'active'
                  ? 'warning'
                  : ''
            "
            :text-inside="true"
            :stroke-width="15"
          ></el-progress>
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
