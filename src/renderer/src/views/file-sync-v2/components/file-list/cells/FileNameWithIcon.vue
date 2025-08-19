<script setup lang="ts">
import {
  Folder,
  Document,
  Image,
  Videocam,
  MusicalNotes,
  CodeSlash,
  DocumentText,
} from '@vicons/ionicons5'
import { computed } from 'vue'

const props = defineProps<{
  fileName: string
  isDirectory: boolean
}>()

const ext = computed(() => props.fileName.split('.').pop()?.toLowerCase() || '')

const iconInfo = computed(() => {
  if (props.isDirectory) {
    return { icon: Folder, color: '#f9a825' } // amber
  }

  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext.value)) {
    return { icon: Image, color: '#42a5f5' } // blue
  }
  if (['mp4', 'mkv', 'mov', 'avi', 'webm'].includes(ext.value)) {
    return { icon: Videocam, color: '#ab47bc' } // purple
  }
  if (['mp3', 'wav', 'ogg', 'flac'].includes(ext.value)) {
    return { icon: MusicalNotes, color: '#ef5350' } // red
  }
  if (['js', 'ts', 'vue', 'json', 'html', 'css', 'py', 'java', 'cpp'].includes(ext.value)) {
    return { icon: CodeSlash, color: '#26a69a' } // teal
  }
  if (['txt', 'md', 'log', 'doc', 'docx', 'pdf'].includes(ext.value)) {
    return { icon: DocumentText, color: '#5c6bc0' } // indigo
  }

  return { icon: Document, color: '#9e9e9e' } // grey
})
</script>

<template>
  <div class="filename-content">
    <n-icon size="14" class="icon" :component="iconInfo.icon" :color="iconInfo.color" />
    <div style="flex: 1; overflow: hidden">
      <n-ellipsis class="name" style="width: 100%">{{ fileName }}</n-ellipsis>
    </div>
  </div>
</template>

<style lang="less" scoped>
.filename-content {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
