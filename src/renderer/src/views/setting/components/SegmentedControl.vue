<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  options: { label: string; value: string }[]
  value: string
  ariaLabel?: string
  labelledby?: string
}>()

const emit = defineEmits(['update:value'])

const activeIndex = computed(() => {
  const index = props.options.findIndex((option) => option.value === props.value)
  return Math.max(index, 0)
})

const onSelect = (value: string | number | boolean | undefined) => {
  if (typeof value === 'string') emit('update:value', value)
}
</script>

<template>
  <el-radio-group
    class="segmented-control"
    :class="[`segments-${options.length}`, `active-${activeIndex}`]"
    :model-value="value"
    :aria-label="ariaLabel"
    :aria-labelledby="labelledby"
    @update:model-value="onSelect"
  >
    <el-radio-button v-for="option in options" :key="option.value" :value="option.value">
      {{ option.label }}
    </el-radio-button>
  </el-radio-group>
</template>

<style scoped lang="less">
.segmented-control {
  position: relative;
  display: grid;
  padding: 3px;
  overflow: hidden;
  isolation: isolate;
  border-radius: 10px;
  background: var(--el-fill-color);
  box-shadow: inset 0 0 0 1px var(--bridge-stroke);

  &.segments-2 {
    grid-template-columns: repeat(2, minmax(64px, 1fr));

    &::before {
      width: calc(50% - 3px);
    }
  }

  &.segments-3 {
    grid-template-columns: repeat(3, minmax(76px, 1fr));

    &::before {
      width: calc(33.333333% - 2px);
    }
  }

  &::before {
    content: '';
    position: absolute;
    z-index: 0;
    top: 3px;
    bottom: 3px;
    left: 3px;
    border-radius: 8px;
    background: var(--bridge-surface);
    box-shadow:
      0 1px 3px rgba(20, 28, 42, 0.12),
      0 1px 1px rgba(20, 28, 42, 0.06);
    transition: transform var(--bridge-motion);
  }

  &.active-1::before {
    transform: translateX(100%);
  }

  &.active-2::before {
    transform: translateX(200%);
  }

  :deep(.el-radio-button) {
    z-index: 1;
    cursor: pointer;
  }

  :deep(.el-radio-button__inner) {
    width: 100%;
    height: 32px;
    padding: 0 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 0 !important;
    border-radius: 7px !important;
    color: var(--el-text-color-secondary);
    background: transparent !important;
    box-shadow: none !important;
    font-weight: 500;
    line-height: 1;
    transition: color var(--bridge-motion);
  }

  :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
    color: var(--el-text-color-primary);
    background: transparent !important;
    box-shadow: none !important;
  }

  :deep(.el-radio-button__original-radio:focus-visible + .el-radio-button__inner) {
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    &::before,
    :deep(.el-radio-button__inner) {
      transition: none;
    }
  }
}
</style>
