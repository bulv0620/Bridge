<script setup lang="ts">
import { TrashBin, Document, FolderOpen } from '@vicons/ionicons5'
import { useTaskList } from '@renderer/composables/share-zone/useTaskList'
import dayjs from 'dayjs'

const { receivedList } = useTaskList()
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
      <el-table-column label="文件名称" min-width="220">
        <template #default="{ row }">
          <div class="file-info">
            <el-icon class="file-icon"><Document /></el-icon>
            <span class="file-name" :title="row.meta.filename">{{ row.meta.filename }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="来源" min-width="150">
        <template #default="{ row }">
          <span class="source-device">{{ row.meta.device.name }}</span>
        </template>
      </el-table-column>

      <el-table-column label="结果" min-width="120">
        <template #default="{ row }">
          <el-tag v-if="row.result === 'success'" type="success">成功</el-tag>
          <el-tag v-else type="danger">失败</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="结束时间" min-width="200">
        <template #default="{ row }">
          <span class="finished-time">
            {{ dayjs(row.finishedAt).format('YYYY-MM-DD HH:mm:ss') }}
          </span>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="100" fixed="right">
        <template #default>
          <div class="action-btns">
            <el-button :icon="FolderOpen" link type="warning" title="打开目录" />
            <el-button :icon="TrashBin" link type="danger" />
          </div>
        </template>
      </el-table-column>

      <template #empty>
        <div class="empty-status">暂无传输任务</div>
      </template>
    </el-table>
  </div>
</template>

<style lang="less" scoped>
.table-container {
  height: 100%;

  // 深度美化表格样式
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
