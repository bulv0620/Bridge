<script setup lang="ts">
import { Monitor } from '@element-plus/icons-vue'
import { useRemoteRef } from '@renderer/composables/remote-ref/useRemoteRef'
import { useTaskList } from '@renderer/composables/share-zone/useTaskList'

const devices = useRemoteRef<OnlineDevice[]>('online-devices', [])

const { createSendingTask } = useTaskList()
</script>

<template>
  <div class="devices">
    <div class="devices-header">
      <span>{{ $t('views.sharedZone.availableDevices') }}</span>
    </div>
    <el-scrollbar v-if="devices.length" class="device-list">
      <div
        v-for="d in devices"
        :key="d.id"
        class="device-card"
        :class="{ disabled: !d.services.cap.includes('file-push') }"
        @click="createSendingTask(d)"
      >
        <el-icon class="device-icon"><Monitor></Monitor></el-icon>
        <div class="device-info">
          <div class="name">{{ d.device.name }}</div>
          <div class="status">{{ d.ip }}</div>
        </div>
      </div>
    </el-scrollbar>
    <div v-else class="devices-empty">
      <span>{{ $t('views.sharedZone.noDevice') }}</span>
    </div>
  </div>
</template>

<style lang="less" scoped>
.devices {
  width: 300px;
  background: var(--el-bg-color);
  border-radius: 12px;
  display: flex;
  flex-direction: column;

  .devices-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    font-weight: 600;
    font-size: 14px;
  }

  .device-list {
    flex: 1;

    .device-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 10px;
      cursor: pointer;
      border: 1px solid var(--el-border-color-light);
      background: var(--el-fill-color-light);
      margin-bottom: 8px;
      transition: all 0.2s;

      &.disabled {
        cursor: not-allowed;
        background: var(--el-fill-color-lighter);
        border-color: var(--el-border-color-lighter);

        .device-icon {
          color: var(--el-text-color-placeholder);
        }

        .device-info {
          .name,
          .status {
            color: var(--el-text-color-placeholder);
          }
        }

        &:hover {
          // 禁用态不响应 hover
          border-color: var(--el-border-color-lighter);
          background: var(--el-fill-color-lighter);
        }
      }

      &:hover {
        border-color: var(--el-color-primary-light-5);
        background: var(--el-color-primary-light-9);
      }

      .device-icon {
        font-size: 20px;
        color: var(--el-text-color-secondary);
      }

      .device-info {
        .name {
          font-size: 14px;
          font-weight: 500;
        }

        .status {
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }
      }
    }
  }

  .devices-empty {
    flex: 1;
    overflow: auto;
    padding: 16px;
    position: relative;

    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 14px;
    color: var(--el-text-color-placeholder);
  }
}
</style>
