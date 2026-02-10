<script setup lang="ts">
import { TrashBin, Document } from '@vicons/ionicons5'
import { useTaskList } from '@renderer/composables/share-zone/useTaskList'
import { formatBytes, formatBytesPerSecond } from '@renderer/utils/format'

const { receivingList } = useTaskList()
</script>

<template>
  <div class="table-container">
    <el-table
      :data="receivingList"
      style="width: 100%"
      height="100%"
      :header-cell-style="{
        background: 'var(--el-bg-color)',
        fontSize: '12px',
        color: 'var(--el-text-color-secondary)',
      }"
    >
      <el-table-column :label="$t('views.sharedZone.filename')" min-width="220">
        <template #default="{ row }">
          <div class="file-info">
            <el-icon class="file-icon"><Document /></el-icon>
            <span class="file-name" :title="row.meta.filename">{{ row.meta.filename }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column :label="$t('views.sharedZone.sourceDevice')" min-width="120">
        <template #default="{ row }">
          <span class="source-device">{{ row.meta.device.name }}</span>
        </template>
      </el-table-column>

      <!-- <el-table-column label="状态" min-width="120" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.status === 'pending'" type="warning">等待中</el-tag>
          <el-tag v-else-if="row.status === 'receiving'" type="primary">接收中</el-tag>
        </template>
      </el-table-column> -->

      <el-table-column :label="$t('views.sharedZone.progress')" min-width="170">
        <template #default="{ row }">
          <el-progress
            :percentage="row.progress.percentage * 100"
            :status="row.progress.percentage === 1 ? 'success' : ''"
            :stroke-width="6"
            :show-text="true"
          />
        </template>
      </el-table-column>

      <el-table-column :label="$t('views.sharedZone.speed')" min-width="120">
        <template #default="{ row }">
          <span class="speed-text">{{ formatBytesPerSecond(row.progress.speed) }}</span>
        </template>
      </el-table-column>

      <el-table-column :label="$t('views.sharedZone.size')" min-width="120">
        <template #default="{ row }">
          <span class="speed-text">
            {{ formatBytes(row.progress.transferred) }}/{{ formatBytes(row.progress.total) }}
          </span>
        </template>
      </el-table-column>

      <el-table-column :label="$t('views.sharedZone.operation')" width="100" fixed="right">
        <template #default>
          <div class="action-btns">
            <el-button
              :icon="TrashBin"
              link
              type="danger"
              :title="$t('views.sharedZone.deleteTask')"
            />
          </div>
        </template>
      </el-table-column>

      <template #empty>
        <div class="empty-status">{{ $t('views.sharedZone.noTasks') }}</div>
      </template>
    </el-table>
  </div>
</template>

<style lang="less" scoped>
.table-container {
  height: 100%;

  :deep(.el-table) {
    .file-info {
      display: flex;
      align-items: center;
      gap: 8px;
      .file-icon {
        font-size: 18px;
        color: var(--el-color-primary);
      }
      .file-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .speed-text {
      font-family: monospace;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    .el-button [class^='el-icon'] {
      font-size: 16px;
    }
  }
}
</style>
