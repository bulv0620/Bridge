<script setup lang="ts">
import { defineProps } from 'vue'

defineProps<{
  icon: any
  size?: number | string
  color?: string
}>()
</script>

<template>
  <component
    :is="icon"
    :style="{
      width: size + 'px',
      height: size + 'px',
      fill: color,
    }"
  />
</template>

<style scoped>
svg {
  display: inline-block;
}
</style>
