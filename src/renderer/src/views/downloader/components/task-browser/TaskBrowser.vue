<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { List, DownloadOutline, TimeOutline, FlagOutline } from '@vicons/ionicons5'
import { useAria2 } from '@renderer/composables/downloader/useAria2'
import { NEllipsis, NProgress, NTag } from 'naive-ui'
import { formatBytes, formatBytesPerSecond, formatTimeLeft } from '@renderer/utils/format'
import { Aria2Status } from '@renderer/utils/aria2/Aria2Types'

const { t } = useI18n()
const { activeTasks, waitingTasks, stoppedTasks, checkedRowKeys } = useAria2()

const activeTab = ref('downloading')
const tabOptions = computed(() => [
  { key: 'all', label: t('views.downloader.all') },
  { key: 'downloading', label: t('views.downloader.downloading') },
  { key: 'waiting', label: t('views.downloader.waiting') },
  { key: 'completed', label: t('views.downloader.completed') },
])

const columns = computed(() => [
  { type: 'selection' },
  {
    key: 'name',
    title: t('views.downloader.taskName'),
    width: 160,
    render(row: Aria2Status) {
      return h(
        NEllipsis,
        { style: { maxWidth: '100%', fontSize: '12px' } },
        {
          default: () =>
            `[${row.files?.length || 0}] ${row.files?.[0]?.path?.split('/').pop() || t('views.downloader.unknown')}`,
        },
      )
    },
  },
  {
    key: 'status',
    title: t('views.downloader.taskStatus'),
    width: 110,
    render(row: Aria2Status) {
      const statusMap = {
        active: { type: 'success', label: t('views.downloader.downloading') },
        waiting: { type: 'warning', label: t('views.downloader.waiting') },
        complete: { type: 'info', label: t('views.downloader.completed') },
        paused: { type: 'default', label: t('views.downloader.paused') },
        error: { type: 'error', label: t('views.downloader.error') },
        removed: { type: 'error', label: t('views.downloader.removed') },
        seeding: { type: 'success', label: t('views.downloader.seeding') },
      }
      let info
      if (
        row.status === 'active' &&
        Number(row.totalLength) > 0 &&
        row.completedLength === row.totalLength
      ) {
        info = statusMap['seeding']
      } else {
        info = statusMap[row.status] || { type: 'default', label: row.status }
      }
      return h(NTag, { type: info.type as any, size: 'small' }, { default: () => info.label })
    },
  },
  {
    key: 'progress',
    title: t('views.downloader.taskProgress'),
    render(row: Aria2Status) {
      return h(NProgress, {
        type: 'line',
        percentage: getTaskPercentage(row),
        height: 12,
        indicatorPlacement: 'inside',
      })
    },
  },
  {
    key: 'size',
    title: t('views.downloader.taskSize'),
    width: 150,
    render(row: Aria2Status) {
      return h(
        NEllipsis,
        { style: { maxWidth: '100%', fontSize: '12px' } },
        {
          default: () => getTaskSize(row),
        },
      )
    },
  },
  {
    key: 'speed',
    title: t('views.downloader.taskSpeed'),
    width: 100,
    render(row: Aria2Status) {
      return h(
        NEllipsis,
        { style: { maxWidth: '100%', fontSize: '12px' } },
        {
          default: () => getTaskSpeed(row),
        },
      )
    },
  },
  {
    key: 'time',
    title: t('views.downloader.taskTimeLeft'),
    width: 90,
    render(row: Aria2Status) {
      return h(
        NEllipsis,
        { style: { maxWidth: '100%', fontSize: '12px' } },
        {
          default: () => getTaskTimeLeft(row),
        },
      )
    },
  },
])

const data = computed(() => {
  if (activeTab.value === 'all') {
    return [...activeTasks.value, ...waitingTasks.value, ...stoppedTasks.value]
  }
  if (activeTab.value === 'downloading') {
    return activeTasks.value
  }
  if (activeTab.value === 'waiting') {
    return waitingTasks.value
  }
  if (activeTab.value === 'completed') {
    return stoppedTasks.value
  }
  return []
})

function getTaskPercentage(row: Aria2Status) {
  if (Number(row.totalLength) === 0) return 0
  return Math.floor((Number(row.completedLength) / Number(row.totalLength)) * 100)
}

function getTaskSize(row: Aria2Status) {
  return `${formatBytes(Number(row.completedLength))}/${formatBytes(Number(row.totalLength))}`
}

function getTaskSpeed(row: Aria2Status) {
  return formatBytesPerSecond(Number(row.downloadSpeed))
}

function getTaskTimeLeft(row: Aria2Status) {
  if (Number(row.downloadSpeed) === 0 || Number(row.totalLength) === 0) return '-'
  const remaining = Number(row.totalLength) - Number(row.completedLength)
  return formatTimeLeft(remaining / Number(row.downloadSpeed))
}
</script>

<template>
  <div class="main">
    <n-space class="tabs">
      <n-tag
        v-for="option in tabOptions"
        :key="option.key"
        class="tasklist-tag"
        :type="activeTab === option.key ? 'primary' : 'default'"
        @click="activeTab = option.key"
      >
        {{ option.label }}
        <template #icon>
          <n-icon>
            <List v-if="option.key === 'all'"></List>
            <DownloadOutline v-else-if="option.key === 'downloading'"></DownloadOutline>
            <TimeOutline v-else-if="option.key === 'waiting'"></TimeOutline>
            <FlagOutline v-else-if="option.key === 'completed'"></FlagOutline>
          </n-icon>
        </template>
      </n-tag>
    </n-space>

    <div class="table">
      <n-data-table
        v-model:checked-row-keys="checkedRowKeys"
        size="small"
        :columns="columns"
        :data="data"
        virtual-scroll
        flex-height
        style="height: 100%"
        :row-key="(row: Aria2Status) => row.gid"
      />
    </div>
  </div>
</template>

<style lang="less" scoped>
.main {
  flex: 1;
  overflow: hidden;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  .tabs {
    .tasklist-tag {
      cursor: pointer;
      user-select: none;
    }
  }

  .table {
    flex: 1;
    overflow: hidden;
  }
}
</style>
