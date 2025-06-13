<script setup lang="ts">
import {
  FolderOutline,
  DocumentOutline,
  ImageOutline,
  VideocamOutline,
  MusicalNotesOutline,
  CodeSlashOutline,
  DocumentTextOutline,
} from '@vicons/ionicons5'

const props = defineProps<{
  fileName: string
  isDirectory: boolean
}>()

const getIcon = () => {
  if (props.isDirectory) return FolderOutline

  const ext = props.fileName.split('.').pop()?.toLowerCase() || ''

  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) {
    return ImageOutline
  }
  if (['mp4', 'mkv', 'mov', 'avi', 'webm'].includes(ext)) {
    return VideocamOutline
  }
  if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) {
    return MusicalNotesOutline
  }
  if (['js', 'ts', 'vue', 'json', 'html', 'css', 'py', 'java', 'cpp'].includes(ext)) {
    return CodeSlashOutline
  }
  if (['txt', 'md', 'log', 'doc', 'docx', 'pdf'].includes(ext)) {
    return DocumentTextOutline
  }

  return DocumentOutline
}
</script>

<template>
  <div class="file-icon">
    <n-icon size="18" class="file-icon__icon" :component="getIcon()" />
    <span class="file-icon__name">{{ fileName }}</span>
  </div>
</template>

<style scoped lang="less">
.file-icon {
  display: flex;
  align-items: center;
  gap: 6px;

  &__icon {
    color: var(--n-text-color-disabled);
  }

  &__name {
    word-break: break-all;
  }
}
</style>
