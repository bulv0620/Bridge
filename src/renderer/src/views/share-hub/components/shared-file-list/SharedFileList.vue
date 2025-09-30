<script setup lang="ts">
import { useSharing } from '@renderer/composables/share-hub/useSharing'
import FileItem from '../file-item/FileItem.vue'
import { LogoApple, LogoTux, LogoWindows, Laptop } from '@vicons/ionicons5'

const { otherDevices } = useSharing()
</script>

<template>
  <n-card :title="$t('views.shareHub.sharedFiles')" class="shared-list" size="small">
    <div class="shared-list__content">
      <n-scrollbar v-if="otherDevices.length > 0" style="height: 100%">
        <n-collapse>
          <n-collapse-item
            v-for="device in otherDevices"
            :key="device.id"
            :title="device.ip"
            :name="device.id"
          >
            <FileItem v-for="item in device.data.files" :key="item.id" :file-item="item"></FileItem>
            <template #header-extra>
              <n-icon>
                <LogoWindows v-if="device.platform === 'win32'"></LogoWindows>
                <LogoApple v-else-if="device.platform === 'darwin'"></LogoApple>
                <LogoTux v-else-if="device.platform === 'linux'"></LogoTux>
                <Laptop v-else></Laptop>
              </n-icon>
            </template>
          </n-collapse-item>
        </n-collapse>
      </n-scrollbar>
      <n-empty v-else class="empty" :description="$t('views.shareHub.noFiles')"></n-empty>
    </div>
  </n-card>
</template>

<style lang="less" scoped>
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
</style>
