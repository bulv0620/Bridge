<script setup lang="ts">
import { PushOutline } from '@vicons/ionicons5'

defineProps<{
  show: Boolean
}>()
</script>

<template>
  <div v-if="show" class="overlay">
    <n-icon size="80">
      <PushOutline />
    </n-icon>
    <div>{{ $t('common.dropHere') }}</div>
  </div>
</template>

<style scoped>
.overlay {
  pointer-events: none;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 2px;
  display: flex;
  gap: 8px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 24px;
  font-weight: bold;
  z-index: 10;
}
</style>
