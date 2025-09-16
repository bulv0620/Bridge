<script setup lang="ts">
import { formatBytes } from '@renderer/utils/format'
import {
  Document,
  Image,
  Videocam,
  MusicalNotes,
  CodeSlash,
  DocumentText,
  TrashBinOutline,
  Folder,
} from '@vicons/ionicons5'
import { FileDownloadOutlined } from '@vicons/material'
import { computed } from 'vue'
import dayjs from 'dayjs'
import { useThemeVars } from 'naive-ui'
import { changeColor } from 'seemly'
import { useNow } from '@vueuse/core'

const props = defineProps<{
  file: SharedFileInfo
}>()

const themeVars = useThemeVars()
const now = useNow({ interval: 1000 })

const expPercentage = computed(() => {
  const total = props.file.status.expiresAt - props.file.status.createdAt
  const left = props.file.status.expiresAt - now.value.getTime()
  if (total <= 0) return 0
  return Math.max(0, Math.min(100, (left / total) * 100))
})

const iconInfo = computed(() => {
  if (['folder'].includes(props.file.type)) {
    return { icon: Folder, color: '#f9a825' } // amber
  }
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(props.file.type)) {
    return { icon: Image, color: '#42a5f5' } // blue
  }
  if (['mp4', 'mkv', 'mov', 'avi', 'webm'].includes(props.file.type)) {
    return { icon: Videocam, color: '#ab47bc' } // purple
  }
  if (['mp3', 'wav', 'ogg', 'flac'].includes(props.file.type)) {
    return { icon: MusicalNotes, color: '#ef5350' } // red
  }
  if (['js', 'ts', 'vue', 'json', 'html', 'css', 'py', 'java', 'cpp'].includes(props.file.type)) {
    return { icon: CodeSlash, color: '#26a69a' } // teal
  }
  if (['txt', 'md', 'log', 'doc', 'docx', 'pdf'].includes(props.file.type)) {
    return { icon: DocumentText, color: '#5c6bc0' } // indigo
  }

  return { icon: Document, color: '#9e9e9e' } // grey
})

const progressColor = computed(() => {
  if (expPercentage.value > 50) {
    return themeVars.value.infoColor
  } else if (expPercentage.value > 20) {
    return themeVars.value.warningColor
  } else {
    return themeVars.value.errorColor
  }
})

const progressRailColor = computed(() => {
  if (expPercentage.value > 50) {
    return changeColor(themeVars.value.infoColor, { alpha: 0.2 })
  } else if (expPercentage.value > 20) {
    return changeColor(themeVars.value.warningColor, { alpha: 0.2 })
  } else {
    return changeColor(themeVars.value.errorColor, { alpha: 0.2 })
  }
})
</script>

<template>
  <n-card size="small">
    <div style="display: flex; gap: 12px">
      <n-icon
        size="24"
        class="file-icon__icon"
        :component="iconInfo.icon"
        :color="iconInfo.color"
        style="margin-top: 8px"
      />
      <div style="flex: 1; overflow: hidden">
        <n-ellipsis style="width: 100%">{{ file.fileName }}</n-ellipsis>
        <n-text :depth="3" style="font-size: 13px">
          {{ file.type === 'folder' ? '-' : formatBytes(file.size) }}
        </n-text>
        <br />
        <n-text :depth="3" style="font-size: 13px">
          {{ dayjs(file.status.createdAt).format('YYYY-MM-DD HH:mm:ss') }}
        </n-text>
      </div>
    </div>

    <template #action>
      <div style="display: flex; gap: 12px; align-items: center">
        <CommonButton
          :tooltip="$t('views.shareHub.download')"
          :icon="FileDownloadOutlined"
          :button-props="{
            size: 'small',
            circle: true,
            strong: true,
            secondary: true,
            type: 'success',
          }"
          placement="bottom"
          :delay="500"
        />
        <CommonButton
          :tooltip="$t('views.shareHub.remove')"
          :icon="TrashBinOutline"
          :button-props="{
            size: 'small',
            circle: true,
            strong: true,
            secondary: true,
            type: 'error',
          }"
          placement="bottom"
          :delay="500"
        />
        <n-progress
          style="width: 24px; margin-left: auto"
          type="circle"
          :stroke-width="20"
          :percentage="expPercentage"
          :color="progressColor"
          :rail-color="progressRailColor"
          :show-indicator="false"
        />
      </div>
    </template>
  </n-card>
</template>
