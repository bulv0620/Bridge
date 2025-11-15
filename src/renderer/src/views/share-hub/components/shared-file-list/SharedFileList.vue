<script setup lang="ts">
import { useSharing } from '@renderer/composables/share-hub/useSharing'
import FileItem from '../file-item/FileItem.vue'
import { LogoApple, LogoTux, LogoWindows, Laptop, Wifi } from '@vicons/ionicons5'
import { useRouter } from 'vue-router'

const router = useRouter()
const { onlineDevices } = useSharing()

function handleDownload(item: SharedFileInfo, device: OnlineDevice) {
  router.push({
    name: 'Downloader',
    query: {
      url: `http://${device.ip}:${device.httpPort}/download/${item.id}`,
    },
  })
}
</script>

<template>
  <div class="box shared-list">
    <!-- 标题 -->
    <div class="box-header">
      {{ $t('views.shareHub.sharedFiles') }}
    </div>

    <!-- 内容区域 -->
    <div class="box-content shared-list__content">
      <!-- 有在线设备 -->
      <el-scrollbar v-if="onlineDevices.length > 0" height="100%">
        <el-collapse style="padding: 0">
          <el-collapse-item
            v-for="device in onlineDevices"
            :key="device.id"
            :title="device.ip"
            :name="device.id"
          >
            <!-- 文件列表 -->
            <FileItem
              v-for="item in device.data.files"
              :key="item.id"
              :file-item="item"
              :device="device"
              @download="handleDownload(item, device)"
            />

            <!-- 右侧平台图标 -->
            <template #title="{ isActive }">
              <div
                class="collapse-title"
                :style="{ color: isActive ? 'var(--el-color-primary)' : '' }"
              >
                <el-icon>
                  <LogoWindows v-if="device.platform === 'win32'" />
                  <LogoApple v-else-if="device.platform === 'darwin'" />
                  <LogoTux v-else-if="device.platform === 'linux'" />
                  <Laptop v-else />
                </el-icon>
                <span>{{ device.ip }}</span>
              </div>
            </template>
          </el-collapse-item>
        </el-collapse>
      </el-scrollbar>

      <!-- 无在线设备 -->
      <el-empty v-else class="empty" :description="$t('views.shareHub.noDevice')">
        <template #image>
          <el-icon :size="48">
            <Wifi />
          </el-icon>
        </template>
      </el-empty>
    </div>
  </div>
</template>

<style lang="less" scoped>
/* 通用 .box 外观 */
.box {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color);
  overflow: hidden;
}

/* 标题栏 */
.box-header {
  padding: 12px 14px;
  font-size: 14px;
  font-weight: 600;
  border-bottom: 1px solid var(--el-border-color);
  background: var(--el-fill-color-light);
}

/* 内容区域 */
.box-content {
  flex: 1;
  overflow: hidden;
  padding: 8px;
}

/* 你之前的布局保留 */
.shared-list {
  height: 100%;

  .shared-list__content {
    height: 100%;
    position: relative;

    .empty {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
    }
  }
}

.collapse-title {
  display: flex;
  gap: 6px;
  align-items: center;
  user-select: none;
}

:deep(.el-collapse-item__content) {
  line-height: 1;
  padding-bottom: 0;
}

:deep(.el-collapse-item__header) {
  /* padding-right: 8px; */
  padding: 0 12px;
  width: calc(100% - 24px);
}
</style>
