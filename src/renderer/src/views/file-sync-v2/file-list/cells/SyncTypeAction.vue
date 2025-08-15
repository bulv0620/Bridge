<script setup lang="ts">
import {
  // ArrowBackRound,
  // ArrowForwardRound,
  KeyboardDoubleArrowLeftRound,
  KeyboardDoubleArrowRightRound,
} from '@vicons/material'
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
  <n-space v-else justify="center" align="center">
    <n-icon
      size="18"
      :color="type === 'toLeft' ? themeVars.successColor : themeVars.borderColor"
      class="icon-button"
      @click="handleActionClick('toLeft')"
    >
      <KeyboardDoubleArrowLeftRound />
    </n-icon>
    <n-icon
      size="18"
      :color="type === 'toRight' ? themeVars.successColor : themeVars.borderColor"
      class="icon-button"
      @click="handleActionClick('toRight')"
    >
      <KeyboardDoubleArrowRightRound />
    </n-icon>
  </n-space>
</template>

<style lang="less" scoped>
.icon-button {
  cursor: pointer;
}
</style>
