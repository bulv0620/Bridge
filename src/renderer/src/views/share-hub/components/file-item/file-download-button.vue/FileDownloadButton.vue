<script setup lang="ts">
import { useDownloader } from '@renderer/composables/share-hub/useDownloader'
import { DownloadOutline, Pause, Play } from '@vicons/ionicons5'

const props = defineProps<{
  fileItem: SharedFileInfo
  device: OnlineDevice
}>()

const { start, pause, resume, paused, downloading, finished } = useDownloader({
  fileId: props.fileItem.id,
  serverIp: props.device.ip,
  serverPort: props.device.httpPort,
  onFinish,
})

function onFinish() {
  console.log('下载完成')
}
</script>

<template>
  <CommonButton
    v-if="!downloading"
    tooltip="下载"
    :icon="DownloadOutline"
    :button-props="{ size: 'small', circle: true, secondary: true }"
    placement="bottom"
    :delay="500"
    @click="start"
  />
  <template v-else-if="!finished">
    <CommonButton
      v-if="!paused"
      tooltip="暂停"
      :icon="Pause"
      :button-props="{ size: 'small', circle: true, secondary: true }"
      placement="bottom"
      :delay="500"
      @click="pause"
    />
    <CommonButton
      v-else
      tooltip="继续"
      :icon="Play"
      :button-props="{ size: 'small', circle: true, secondary: true }"
      placement="bottom"
      :delay="500"
      @click="resume"
    />
  </template>
</template>
