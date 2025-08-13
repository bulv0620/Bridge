<script setup lang="ts">
import { ref } from 'vue'
import { CloseOutline, Wifi } from '@vicons/ionicons5'
import WindowsSvg from '@renderer/assets/svg/windows.svg'
import LinuxSvg from '@renderer/assets/svg/linux.svg'
import AppleSvg from '@renderer/assets/svg/apple.svg'
import { useThemeVars } from 'naive-ui'

interface DeviceInfo {
  ip: string
  port: number
  name: string
  system: 'mac' | 'win' | 'linux'
}

const themeVars = useThemeVars()

const showOnlineDevicePopover = ref(false)

const onlineDeviceList = ref<DeviceInfo[]>([
  {
    ip: '192.168.0.1',
    port: 20111,
    name: '主机1',
    system: 'win',
  },
  {
    ip: '192.168.0.2',
    port: 20111,
    name: '主机2',
    system: 'mac',
  },
  // {
  //   ip: '192.168.0.3',
  //   port: 20111,
  //   name: '主机3',
  //   system: 'linux',
  // },
  // {
  //   ip: '192.168.0.4',
  //   port: 20111,
  //   name: '主机4',
  //   system: 'linux',
  // },
  // {
  //   ip: '192.168.0.5',
  //   port: 20111,
  //   name: '主机5',
  //   system: 'linux',
  // },
])
</script>

<template>
  <n-popover
    to="#share-hub-drawer-target"
    trigger="manual"
    :show="showOnlineDevicePopover"
    placement="top-start"
    :show-arrow="false"
    style="width: 280px"
  >
    <template #trigger>
      <n-button
        size="tiny"
        type="primary"
        secondary
        strong
        @click="showOnlineDevicePopover = !showOnlineDevicePopover"
      >
        {{ $t('views.shareHub.onlineDevice') }}: {{ onlineDeviceList.length }}
      </n-button>
    </template>

    <template #header>
      <n-space justify="space-between" align="center">
        <n-text :depth="2">{{ $t('views.shareHub.deviceList') }}</n-text>
        <n-button size="tiny" secondary strong @click="showOnlineDevicePopover = false">
          <template #icon>
            <n-icon><CloseOutline></CloseOutline></n-icon>
          </template>
        </n-button>
      </n-space>
    </template>
    <n-scrollbar style="height: 200px">
      <n-list v-if="onlineDeviceList.length > 0" hoverable>
        <n-list-item v-for="device in onlineDeviceList" :key="device.ip">
          <n-thing>
            <template #header>
              <n-space align="center">
                <n-badge processing dot type="success" />
                <n-ellipsis
                  :tooltip="{ delay: 500, placement: 'top-start' }"
                  style="font-size: 14px; width: 160px"
                >
                  {{ device.name }}
                </n-ellipsis>
              </n-space>
            </template>
            <template #header-extra>
              <n-icon
                :color="
                  {
                    win: themeVars.infoColor,
                    mac: themeVars.errorColor,
                    linux: themeVars.warningColor,
                  }[device.system]
                "
              >
                <WindowsSvg v-if="device.system === 'win'"></WindowsSvg>
                <AppleSvg v-else-if="device.system === 'mac'"></AppleSvg>
                <LinuxSvg v-else-if="device.system === 'linux'"></LinuxSvg>
              </n-icon>
            </template>
            <template #description>
              <n-text :depth="3" style="font-size: 13px">{{ device.ip }}</n-text>
            </template>
          </n-thing>
        </n-list-item>
      </n-list>
      <n-empty v-else class="empty" :description="$t('views.shareHub.noDevice')">
        <template #icon>
          <n-icon><Wifi></Wifi></n-icon>
        </template>
      </n-empty>
    </n-scrollbar>
  </n-popover>
</template>

<style scoped lang="less">
.empty {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
</style>
