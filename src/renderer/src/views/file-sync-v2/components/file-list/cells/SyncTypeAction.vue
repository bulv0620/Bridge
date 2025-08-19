<script setup lang="ts">
import { ArrowForward, ArrowBack } from '@vicons/ionicons5'
import { useThemeVars } from 'naive-ui'
const props = defineProps<{
  type: 'toLeft' | 'toRight' | 'ignore'
  isDirectory: boolean
}>()

const emit = defineEmits(['update:type'])

const themeVars = useThemeVars()

function handleActionClick(type: 'toLeft' | 'toRight' | 'ignore') {
  if (props.type === type) {
    emit('update:type', 'ignore')
  } else {
    emit('update:type', type)
  }
}
</script>

<template>
  <n-space v-if="isDirectory" justify="center" align="center"> - </n-space>
  <div v-else class="resolution-content">
    <n-icon
      size="18"
      :color="type === 'toLeft' ? themeVars.successColor : themeVars.borderColor"
      class="icon-button"
      @click="handleActionClick('toLeft')"
    >
      <ArrowBack />
    </n-icon>
    <n-icon
      size="18"
      :color="type === 'toRight' ? themeVars.successColor : themeVars.borderColor"
      class="icon-button"
      @click="handleActionClick('toRight')"
    >
      <ArrowForward />
    </n-icon>
  </div>
</template>

<style lang="less" scoped>
.resolution-content {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  height: 22px;
}
.icon-button {
  cursor: pointer;
}
</style>
