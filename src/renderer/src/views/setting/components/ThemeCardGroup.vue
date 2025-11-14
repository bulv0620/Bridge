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
  gap: 16px;
}

.theme-card {
  width: 120px;
  padding: 12px;
  border-radius: 6px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.25s;
  border: 1px solid var(--el-border-color);

  display: flex;
  flex-direction: column;
  align-items: center;

  &:hover {
    box-shadow: var(--el-box-shadow-light);
  }

  &.active {
    border: 1px solid var(--el-color-primary);
  }
}

.preview {
  width: 100%;
  height: 60px;
  border-radius: 6px;
  margin-bottom: 8px;
  border: 1px solid var(--el-border-color);
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
