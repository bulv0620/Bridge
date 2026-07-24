<script setup lang="ts">
import { computed } from 'vue'
import {
  CircleCheck,
  CircleClose,
  Close,
  Delete,
  Document,
  FolderOpened,
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { useTaskList } from '@renderer/composables/share-zone/useTaskList'
import { formatBytes, formatBytesPerSecond, round } from '@renderer/utils/format'

type ActivityItem = SendingItem | SentItem | ReceivingItem | ReceivedItem
type ProgressItem = SendingItem | ReceivingItem

const {
  activeTab,
  tabs,
  sendingList,
  sentList,
  receivingList,
  receivedList,
  abortTask,
  deleteTask,
  openFolder,
} = useTaskList()

const activeItems = computed<ActivityItem[]>(() => {
  const lists = [sendingList.value, sentList.value, receivingList.value, receivedList.value]
  return lists[activeTab.value] as ActivityItem[]
})

function hasProgress(item: ActivityItem): item is ProgressItem {
  return 'progress' in item
}

function progressValue(item: ProgressItem) {
  return round(item.progress.percentage * 100)
}

function resultOf(item: ActivityItem) {
  return 'result' in item ? item.result : undefined
}

function resultLabel(item: ActivityItem) {
  const result = resultOf(item)
  if (result === 'success') return 'common.success'
  if (result === 'cancelled') return 'views.sharedZone.cancelled'
  if (result === 'rejected') return 'views.sharedZone.rejected'
  if (result === 'expired') return 'views.sharedZone.expired'
  return 'common.failed'
}

function finishedAt(item: ActivityItem) {
  return 'finishedAt' in item ? dayjs(item.finishedAt).format('HH:mm') : ''
}

function canOpen(item: ActivityItem) {
  const received = item as ReceivedItem
  return activeTab.value === 3 && received.result === 'success' && Boolean(received.save?.path)
}

function canShowActions(item: ActivityItem) {
  if (activeTab.value === 1 || activeTab.value === 3) return true
  return activeTab.value === 0 && 'status' in item && item.status === 'sending'
}

function openReceived(item: ActivityItem) {
  const path = (item as ReceivedItem).save?.path
  if (path) openFolder(path)
}

function removeItem(item: ActivityItem) {
  if (activeTab.value === 0) {
    abortTask(item.id)
  } else if (activeTab.value === 1) {
    deleteTask('sent', item.id)
  } else if (activeTab.value === 3) {
    deleteTask('received', item.id)
  }
}
</script>

<template>
  <section class="activity-panel">
    <nav class="activity-tabs" :aria-label="$t('views.sharedZone.transferTasks')">
      <button
        v-for="(tab, index) in tabs"
        :key="tab.id"
        type="button"
        :class="{ active: activeTab === index }"
        :aria-pressed="activeTab === index"
        @click="activeTab = index"
      >
        <span>{{ tab.name }}</span>
        <span v-if="tab.num" class="count">{{ tab.num }}</span>
      </button>
    </nav>

    <div class="activity-body">
      <el-scrollbar v-if="activeItems.length" class="activity-scroll">
        <div class="activity-list">
          <article v-for="item in activeItems" :key="item.id" class="activity-item">
            <span class="file-icon"
              ><el-icon><Document /></el-icon
            ></span>

            <div class="item-info">
              <strong :title="item.meta.filename">{{ item.meta.filename }}</strong>
              <span>{{ item.meta.device.name }} · {{ formatBytes(item.meta.size) }}</span>
            </div>

            <div v-if="hasProgress(item)" class="progress-info">
              <div class="progress-meta">
                <span>{{ formatBytesPerSecond(item.progress.speed || 0) }}</span>
                <strong>{{ progressValue(item) }}%</strong>
              </div>
              <el-progress :percentage="progressValue(item)" :stroke-width="4" :show-text="false" />
            </div>

            <div v-else class="result-info" :class="resultOf(item)">
              <el-icon v-if="resultOf(item) === 'success'"><CircleCheck /></el-icon>
              <el-icon v-else><CircleClose /></el-icon>
              <span>{{ $t(resultLabel(item)) }}</span>
              <time>{{ finishedAt(item) }}</time>
            </div>

            <div v-if="canShowActions(item)" class="item-actions">
              <el-button
                v-if="canOpen(item)"
                circle
                text
                :icon="FolderOpened"
                :title="$t('views.sharedZone.openFolder')"
                :aria-label="$t('views.sharedZone.openFolder')"
                @click="openReceived(item)"
              />
              <el-button
                circle
                text
                :icon="activeTab === 0 ? Close : Delete"
                :title="
                  $t(activeTab === 0 ? 'views.sharedZone.abortTask' : 'views.sharedZone.deleteTask')
                "
                :aria-label="
                  $t(activeTab === 0 ? 'views.sharedZone.abortTask' : 'views.sharedZone.deleteTask')
                "
                @click="removeItem(item)"
              />
            </div>
          </article>
        </div>
      </el-scrollbar>

      <div v-else class="empty-status">{{ $t('views.sharedZone.noTasks') }}</div>
    </div>
  </section>
</template>

<style lang="less" scoped>
.activity-panel {
  height: 190px;
  min-height: 150px;
  flex: 0 0 190px;
  padding: 6px;
  border-radius: var(--bridge-radius-md);
  background: var(--bridge-surface-soft);
  box-shadow: inset 0 0 0 1px var(--bridge-stroke);
  display: flex;
  flex-direction: column;
  gap: 2px;

  .activity-tabs {
    min-width: 0;
    display: flex;
    gap: 4px;
    padding-bottom: 4px;
    overflow-x: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }

    button {
      height: 34px;
      padding: 0 11px;
      border: 0;
      border-radius: 8px;
      color: var(--el-text-color-secondary);
      background: transparent;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: inherit;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      transition:
        color var(--bridge-motion),
        background var(--bridge-motion);

      &:hover {
        color: var(--el-text-color-primary);
        background: color-mix(in srgb, var(--bridge-surface) 58%, transparent);
      }

      &.active {
        color: var(--el-color-primary);
        background: var(--bridge-surface);
      }

      .count {
        color: inherit;
        font: 600 11px/1 monospace;
      }
    }
  }

  .activity-body {
    min-height: 0;
    flex: 1;
    overflow: hidden;
    border-radius: 9px;
    background: transparent;

    .activity-scroll {
      height: 100%;
    }

    .activity-list {
      padding: 4px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .activity-item {
      min-height: 58px;
      padding: 7px 8px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      gap: 10px;
      transition: background var(--bridge-motion);

      &:hover {
        background: color-mix(in srgb, var(--bridge-surface) 72%, transparent);
      }

      .file-icon {
        width: 32px;
        height: 32px;
        flex: none;
        border-radius: 9px;
        display: grid;
        place-items: center;
        color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
      }

      .item-info {
        min-width: 0;
        flex: 1;
        display: flex;
        flex-direction: column;

        strong {
          overflow: hidden;
          color: var(--el-text-color-primary);
          font-size: 13px;
          font-weight: 600;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        span {
          margin-top: 2px;
          overflow: hidden;
          color: var(--el-text-color-secondary);
          font-size: 11px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .progress-info {
        width: min(32%, 220px);
        min-width: 130px;

        .progress-meta {
          margin-bottom: 4px;
          display: flex;
          justify-content: space-between;
          color: var(--el-text-color-secondary);
          font: 11px/1 monospace;

          strong {
            color: var(--el-text-color-regular);
          }
        }
      }

      .result-info {
        min-width: 100px;
        display: flex;
        align-items: center;
        gap: 5px;
        color: var(--el-text-color-secondary);
        font-size: 12px;

        &.success {
          color: var(--el-color-success);
        }

        &.failed,
        &.cancelled,
        &.expired {
          color: var(--el-color-danger);
        }

        &.rejected {
          color: var(--el-color-warning);
        }

        time {
          margin-left: 3px;
          color: var(--el-text-color-placeholder);
          font: 11px/1 monospace;
        }
      }

      .item-actions {
        flex: none;
        display: flex;

        :deep(.el-button) {
          margin: 0;
        }
      }
    }

    .empty-status {
      height: 100%;
      display: grid;
      place-items: center;
      color: var(--el-text-color-placeholder);
      font-size: 13px;
    }
  }
}

@media (max-width: 760px) {
  .activity-panel {
    .activity-tabs button {
      padding-inline: 8px;
      font-size: 12px;
    }

    .activity-item .progress-info {
      min-width: 100px;
    }
  }
}

@media (max-height: 680px) {
  .activity-panel {
    height: 168px;
    flex-basis: 168px;
  }
}
</style>
