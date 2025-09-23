<script setup lang="ts">
import {
  Folder,
  Document,
  Image,
  Videocam,
  MusicalNotes,
  CodeSlash,
  DocumentText,
  TrashBinOutline,
} from '@vicons/ionicons5'
import { computed } from 'vue'
import dayjs from 'dayjs'
import { useTheme } from '@renderer/composables/setting/useTheme'

const props = defineProps<{
  fileItem: SharedFileInfo
}>()

const { currentTheme } = useTheme()

const iconInfo = computed(() => {
  if ((props.fileItem as any).isDirectory) {
    return { icon: Folder, color: '#f9a825' }
  }
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(props.fileItem.type)) {
    return { icon: Image, color: '#42a5f5' }
  }
  if (['mp4', 'mkv', 'mov', 'avi', 'webm'].includes(props.fileItem.type)) {
    return { icon: Videocam, color: '#ab47bc' }
  }
  if (['mp3', 'wav', 'ogg', 'flac'].includes(props.fileItem.type)) {
    return { icon: MusicalNotes, color: '#ef5350' }
  }
  if (
    ['js', 'ts', 'vue', 'json', 'html', 'css', 'py', 'java', 'cpp'].includes(props.fileItem.type)
  ) {
    return { icon: CodeSlash, color: '#26a69a' }
  }
  if (['txt', 'md', 'log', 'doc', 'docx', 'pdf'].includes(props.fileItem.type)) {
    return { icon: DocumentText, color: '#5c6bc0' }
  }
  return { icon: Document, color: '#9e9e9e' }
})

const remainingInfo = computed(() => {
  const { remaining, total } = props.fileItem.status
  return `${remaining} / ${total}`
})

const expireInfo = computed(() => {
  return dayjs(props.fileItem.status.expiresAt).format('YYYY-MM-DD HH:mm')
})
</script>

<template>
  <div class="file-item" :class="currentTheme">
    <div class="icon-wrap">
      <n-icon class="icon" :size="24" :component="iconInfo.icon" :color="iconInfo.color" />
    </div>
    <div class="file-meta">
      <div class="file-item__name">
        <n-ellipsis style="width: 100%">{{ fileItem.fileName }}</n-ellipsis>
      </div>
      <div class="file-item__extra">
        <n-ellipsis style="width: 100%">
          <span class="quota">{{ remainingInfo }}</span>
          <span class="expire">{{ $t('views.shareHub.expirationTime') }}: {{ expireInfo }}</span>
        </n-ellipsis>
      </div>
    </div>
    <div class="operation">
      <CommonButton
        tooltip="取消共享"
        :icon="TrashBinOutline"
        :button-props="{ size: 'small', circle: true, secondary: true }"
        placement="bottom"
        :delay="500"
      />
    </div>
  </div>
</template>

<style lang="less" scoped>
.file-item {
  margin-bottom: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.25s ease;

  // 🌞 light 模式
  &.light {
    background: #fff;
    border: 1px solid rgb(239, 239, 245);

    .file-item__name {
      color: #333;
    }
    .file-item__extra {
      color: #666;

      .quota {
        color: #26a69a;
      }
      .expire {
        color: #ef5350;
      }
    }
  }

  // 🌙 dark 模式
  &.dark {
    background: rgba(255, 255, 255, 0.06);
    border: none;

    .file-item__name {
      color: #f0f0f0;
    }
    .file-item__extra {
      color: #aaa;

      .quota {
        color: #4dd0e1; // 青色，夜间更柔和
      }
      .expire {
        color: #ef9a9a; // 浅红，不刺眼
      }
    }
  }

  .file-meta {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .file-item__name {
    width: 100%;
    font-size: 14px;
    font-weight: 500;
  }

  .file-item__extra {
    width: 100%;
    margin-top: 2px;
    font-size: 12px;
    display: flex;
    gap: 12px;

    .quota {
      font-weight: 500;
      margin-right: 6px;
    }
  }

  .operation {
    margin-left: auto;
  }
}
</style>
