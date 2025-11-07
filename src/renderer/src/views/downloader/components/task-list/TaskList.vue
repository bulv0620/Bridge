<script setup lang="ts">
import { computed, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { NProgress, NTag } from 'naive-ui'
import { DownloadTaskInfo, useTaskList } from '@renderer/composables/downloader/useTaskList'

const { t } = useI18n()

const { tableData, checkedRowKeys } = useTaskList()

const columns = computed(() => [
  { type: 'selection' },
  {
    key: 'name',
    title: t('views.downloader.taskName'),
    ellipsis: {
      tooltip: true,
    },
  },
  {
    key: 'status',
    title: t('views.downloader.taskStatus'),
    width: 110,
    render(row: DownloadTaskInfo) {
      return h(
        NTag,
        { type: row.status.type as any, size: 'small' },
        { default: () => row.status.label },
      )
    },
  },
  {
    key: 'progress',
    title: t('views.downloader.taskProgress'),
    render(row: DownloadTaskInfo) {
      return h(NProgress, {
        type: 'line',
        percentage: row.progress,
        height: 12,
        indicatorPlacement: 'inside',
      })
    },
  },
  {
    key: 'size',
    title: t('views.downloader.taskSize'),
    ellipsis: {
      tooltip: true,
    },
  },
  {
    key: 'speed',
    title: t('views.downloader.taskSpeed'),
    width: 110,
    ellipsis: {
      tooltip: true,
    },
  },
  {
    key: 'eta',
    title: t('views.downloader.taskTimeLeft'),
    width: 90,
    ellipsis: {
      tooltip: true,
    },
  },
])
</script>

<template>
  <div class="table">
    <n-data-table
      v-model:checked-row-keys="checkedRowKeys"
      size="small"
      :columns="columns"
      :data="tableData"
      virtual-scroll
      flex-height
      style="height: 100%"
      :row-key="(row: DownloadTaskInfo) => row.gid"
    >
    </n-data-table>
  </div>
</template>

<style lang="less" scoped>
.table {
  flex: 1;
  overflow: hidden;
}
</style>
