<script setup lang="ts">
import { ArrowBackCircle, ArrowForwardCircle } from '@vicons/ionicons5'
import { useThemeVars } from 'naive-ui'
defineProps<{
  isDirectory: boolean
  source: FileInfo | null
  destination: FileInfo | null
}>()

const type = defineModel<FileSyncResolition>('type', { required: true })

const themeVars = useThemeVars()

function handleActionClick(resolution: FileSyncResolition) {
  if (type.value === resolution) {
    type.value = 'ignore'
  } else {
    type.value = resolution
  }

  // todo
}
</script>

<template>
  <span v-if="isDirectory">{{ '-' }}</span>
  <div v-else class="resolution-content">
    <n-icon
      size="20"
      :color="type === 'toLeft' ? themeVars.successColor : themeVars.borderColor"
      class="icon-button"
      @click="handleActionClick('toLeft')"
    >
      <ArrowBackCircle />
    </n-icon>
    <n-icon
      size="20"
      :color="type === 'toRight' ? themeVars.successColor : themeVars.borderColor"
      class="icon-button"
      @click="handleActionClick('toRight')"
    >
      <ArrowForwardCircle />
    </n-icon>
  </div>
</template>

<style lang="less" scoped>
.resolution-content {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 14px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.icon-button {
  cursor: pointer;
}
</style>
