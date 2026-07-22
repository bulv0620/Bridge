<script setup lang="ts">
import { Monitor } from '@element-plus/icons-vue'
import { useRemoteRef } from '@renderer/composables/remote-ref/useRemoteRef'
import { useTaskList } from '@renderer/composables/share-zone/useTaskList'

const devices = useRemoteRef<OnlineDevice[]>('online-devices', [])

const { createSendingTask } = useTaskList()
</script>

<template>
  <aside class="devices">
    <div class="devices-header">
      <h2>{{ $t('views.sharedZone.availableDevices') }}</h2>
      <span>{{ devices.length }}</span>
    </div>
    <el-scrollbar v-if="devices.length" class="device-list">
      <button
        v-for="d in devices"
        :key="d.id"
        type="button"
        class="device-card"
        :disabled="!d.services.cap.includes('file-push')"
        @click="createSendingTask(d)"
      >
        <span class="device-icon-wrap">
          <el-icon class="device-icon"><Monitor></Monitor></el-icon>
          <span class="online-dot"></span>
        </span>
        <div class="device-info">
          <div class="name">{{ d.device.name }}</div>
          <div class="status">{{ d.ip }}</div>
        </div>
      </button>
    </el-scrollbar>
    <div v-else class="devices-empty">
      <span class="empty-icon">
        <el-icon><Monitor /></el-icon>
      </span>
      <strong>{{ $t('views.sharedZone.noDevice') }}</strong>
    </div>
  </aside>
</template>

<style lang="less" scoped>
.devices {
  min-width: 0;
  min-height: 0;
  flex: 1;
  padding: 10px 10px 6px;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .devices-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    min-height: 30px;
    padding: 0 4px;
    margin-bottom: 6px;

    h2 {
      margin: 0;
      font-size: 15px;
      font-weight: 650;
      line-height: 1.35;
    }

    > span {
      color: var(--el-text-color-placeholder);
      font: 600 11px/1 monospace;
    }
  }

  .device-list {
    min-height: 0;
    flex: 1;

    :deep(.el-scrollbar__view) {
      padding-right: 2px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
      gap: 4px;
    }

    .device-card {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 12px;
      min-height: 56px;
      padding: 8px 10px;
      border-radius: 9px;
      cursor: pointer;
      border: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      text-align: left;
      transition:
        color var(--bridge-motion),
        background var(--bridge-motion);

      &:disabled {
        cursor: not-allowed;
        opacity: 0.5;

        &:hover {
          background: transparent;
        }
      }

      &:hover {
        background: color-mix(in srgb, var(--bridge-surface) 72%, transparent);
      }

      .device-icon-wrap {
        width: 34px;
        height: 34px;
        flex: none;
        position: relative;
        border-radius: 9px;
        display: grid;
        place-items: center;
        color: var(--el-color-primary);
        background: color-mix(in srgb, var(--el-color-primary-light-9) 82%, transparent);

        .device-icon {
          font-size: 18px;
        }

        .online-dot {
          width: 8px;
          height: 8px;
          position: absolute;
          right: -1px;
          bottom: -1px;
          border: 2px solid var(--bridge-surface);
          border-radius: 50%;
          background: var(--el-color-success);
        }
      }

      .device-info {
        min-width: 0;

        .name {
          overflow: hidden;
          font-size: 13px;
          font-weight: 600;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .status {
          margin-top: 2px;
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }
      }
    }
  }

  .devices-empty {
    flex: 1;
    min-height: 0;
    padding: 20px 10px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 6px;
    text-align: center;
    font-size: 14px;
    color: var(--el-text-color-placeholder);

    .empty-icon {
      width: 40px;
      height: 40px;
      margin-bottom: 2px;
      border-radius: 12px;
      display: grid;
      place-items: center;
      color: var(--el-text-color-secondary);
      background: color-mix(in srgb, var(--bridge-surface) 72%, transparent);

      .el-icon {
        font-size: 21px;
      }
    }

    strong {
      color: var(--el-text-color-regular);
      font-size: 13px;
      font-weight: 600;
    }
  }
}
</style>
