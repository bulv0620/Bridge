<script setup lang="ts">
defineProps<{
  options: { label: string; value: string }[]
  value: string
}>()

const emit = defineEmits(['update:value'])

const onSelect = (val: string) => {
  emit('update:value', val)
}
</script>

<template>
  <div class="theme-card-group">
    <div
      v-for="item in options"
      :key="item.value"
      class="theme-card"
      :class="{ active: value === item.value }"
      @click="onSelect(item.value)"
    >
      <div class="preview" :data-theme="item.value"></div>
      <div class="label">{{ item.label }}</div>
    </div>
  </div>
</template>

<style scoped lang="less">
.theme-card-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.theme-card {
  width: 128px;
  min-height: 112px;
  padding: 10px;
  border-radius: var(--bridge-radius-md);
  border: 1px solid transparent;
  cursor: pointer;
  background: var(--bridge-surface-soft);
  box-shadow: inset 0 0 0 1px var(--bridge-stroke);
  transition:
    border-color var(--bridge-motion),
    background var(--bridge-motion),
    box-shadow var(--bridge-motion);

  display: flex;
  flex-direction: column;
  align-items: center;

  &:hover {
    background: var(--bridge-surface);
    box-shadow: var(--bridge-shadow-sm);
  }

  &.active {
    border: 1px solid var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  }
}

.preview {
  width: 100%;
  height: 60px;
  border-radius: 8px;
  margin-bottom: 8px;
  box-shadow: inset 0 0 0 1px var(--bridge-stroke);
  overflow: hidden;
  box-sizing: border-box;
}

/* 预览的主题风格 */
.preview[data-theme='light'] {
  background: linear-gradient(#fafafa, #eaeaea);
}
.preview[data-theme='dark'] {
  background: linear-gradient(#333, #111);
}
.preview[data-theme='system'] {
  background: linear-gradient(135deg, #fafafa 50%, #333 50%);
}

.label {
  font-size: 14px;
}
</style>
