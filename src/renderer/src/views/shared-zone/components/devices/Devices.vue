<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { Iphone, Monitor } from '@element-plus/icons-vue'
import { ref } from 'vue'
import { Wifi } from '@vicons/ionicons5'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const file = ref<File | null>(null)

const devices = [
  { name: 'iphone15Pro', icon: Iphone },
  { name: 'windowsPcHome', icon: Monitor },
  { name: 'ipadPro129', icon: Iphone },
]

function sendTo(device: any) {
  if (!file.value) {
    ElMessage.warning(t('views.sharedZone.selectFileFirst'))
    return
  }

  ElMessage.info(t('views.sharedZone.sendingTo', { device: t(`devices.${device.name}`) }))

  setTimeout(() => {
    ElMessage.success(t('views.sharedZone.sendSuccess'))
    file.value = null
  }, 1500)
}
</script>

<template>
  <div class="devices">
    <div class="devices-header">
      <span>{{ $t('views.sharedZone.availableDevices') }}</span>
    </div>
    <el-scrollbar v-if="devices.length" class="device-list">
      <div v-for="d in devices" :key="d.name" class="device-card" @click="sendTo(d)">
        <el-icon class="device-icon"><component :is="d.icon" /></el-icon>
        <div class="device-info">
          <div class="name">{{ d.name }}</div>
          <div class="status">192.168.1.105</div>
        </div>
      </div>
    </el-scrollbar>
    <div v-else class="devices-empty">
      <el-empty :description="$t('views.sharedZone.noDevice')">
        <template #image>
          <el-icon :size="60">
            <Wifi />
          </el-icon>
        </template>
      </el-empty>
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
  }
}
</style>
