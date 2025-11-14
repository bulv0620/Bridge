<script setup lang="ts">
import { useThemeVars } from 'naive-ui'
import { computed } from 'vue'

defineProps<{
  options: { label: string; value: string }[]
  value: string
}>()

const emit = defineEmits(['update:value'])

const onSelect = (val: string) => {
  emit('update:value', val)
}

const themeVars = useThemeVars()

const cardColor = computed(() => {
  return themeVars.value.cardColor
})
const borderColor = computed(() => {
  return themeVars.value.borderColor
})
const boxShadow1 = computed(() => {
  return themeVars.value.boxShadow1
})
const primaryColor = computed(() => {
  return themeVars.value.primaryColor
})
const borderRadius = computed(() => {
  return themeVars.value.borderRadius
})
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
  border-radius: v-bind(borderRadius);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.25s;
  background: v-bind(cardColor);
  border: 1px solid v-bind(borderColor);

  display: flex;
  flex-direction: column;
  align-items: center;

  &:hover {
    box-shadow: v-bind(boxShadow1);
  }

  &.active {
    border: 1px solid v-bind(primaryColor);
  }
}

.preview {
  width: 100%;
  height: 60px;
  border-radius: v-bind(borderRadius);
  margin-bottom: 8px;
  border: 1px solid v-bind(borderColor);
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
