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
  const file = props.fileItem
  const type = file.type || ''
  const ext = file.fileName?.split('.').pop()?.toLowerCase() || '' // 兜底扩展名

  if ((file as any).isDirectory) {
    return { icon: Folder, color: '#f9a825' }
  }

  // 图片
  if (type.startsWith('image/')) {
    return { icon: Image, color: '#42a5f5' }
  }

  // 视频
  if (type.startsWith('video/')) {
    return { icon: Videocam, color: '#ab47bc' }
  }

  // 音频
  if (type.startsWith('audio/')) {
    return { icon: MusicalNotes, color: '#ef5350' }
  }

  // 代码 / 脚本类
  if (
    ['application/javascript', 'text/javascript', 'application/json', 'text/html', 'text/css'].some(
      (t) => type.includes(t),
    ) ||
    ['js', 'ts', 'vue', 'json', 'html', 'css', 'py', 'java', 'cpp'].includes(ext)
  ) {
    return { icon: CodeSlash, color: '#26a69a' }
  }

  // 文档类
  if (
    [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/markdown',
      'text/plain',
    ].some((t) => type.includes(t)) ||
    ['txt', 'md', 'log', 'doc', 'docx', 'pdf'].includes(ext)
  ) {
    return { icon: DocumentText, color: '#5c6bc0' }
  }

  // 兜底
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
    background: rgb(250, 250, 252);
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
