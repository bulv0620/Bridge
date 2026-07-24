<script setup lang="ts">
import { TrashBin, Document, FolderOpen } from '@vicons/ionicons5'
import { useTaskList } from '@renderer/composables/share-zone/useTaskList'
import dayjs from 'dayjs'

const { receivedList, openFolder, deleteTask } = useTaskList()
</script>

<template>
  <div class="table-container">
    <el-table
      :data="receivedList"
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

      <el-table-column
        :label="$t('views.sharedZone.sourceDevice')"
        min-width="150"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <span class="source-device">{{ row.meta.device.name }}</span>
        </template>
      </el-table-column>

      <el-table-column :label="$t('views.sharedZone.result')" min-width="120">
        <template #default="{ row }">
          <el-tag v-if="row.result === 'success'" type="success">{{ $t('common.success') }}</el-tag>
          <el-tag v-else type="danger">{{ $t('common.failed') }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column
        :label="$t('views.sharedZone.finishedTime')"
        min-width="200"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <span class="finished-time">
            {{ dayjs(row.finishedAt).format('YYYY-MM-DD HH:mm:ss') }}
          </span>
        </template>
      </el-table-column>

      <el-table-column :label="$t('views.sharedZone.operation')" width="100" fixed="right">
        <template #default="{ row }">
          <div class="action-btns">
            <el-button
              :icon="FolderOpen"
              link
              type="warning"
              :title="$t('views.sharedZone.openFolder')"
              :disabled="row.result !== 'success'"
              @click="openFolder(row.save.path)"
            />
            <el-button
              :icon="TrashBin"
              link
              type="danger"
              :title="$t('views.sharedZone.deleteTask')"
              @click="deleteTask('received', row.id)"
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

    .el-button [class^='el-icon'] {
      font-size: 16px;
    }
  }
}
</style>
