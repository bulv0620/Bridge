<template>
  <n-popover
    :trigger="popoverConfig.trigger"
    :delay="popoverConfig.delay"
    :placement="popoverConfig.placement"
    :disabled="popoverConfig.disabled"
  >
    <template #trigger>
      <n-button v-bind="buttonConfig" @click="onClick">
        <template #icon>
          <component :is="icon" v-if="icon" />
        </template>
        <slot></slot>
      </n-button>
    </template>
    <div class="common-button-popover-content">
      <slot name="tooltip">{{ tooltip }}</slot>
    </div>
  </n-popover>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ButtonProps } from 'naive-ui'
import type { PopoverTrigger, PopoverPlacement } from 'naive-ui'

// 定义 props
const props = defineProps({
  tooltip: { type: String, default: '' },
  icon: [Object, String],
  // 按钮配置
  buttonProps: { type: Object as () => Partial<ButtonProps>, default: () => ({}) },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  // popover 配置
  trigger: { type: String as () => PopoverTrigger, default: 'hover' },
  delay: { type: Number, default: 500 },
  placement: { type: String as () => PopoverPlacement, default: 'top' },
})

const emit = defineEmits(['click'])

const buttonConfig = computed(() => ({
  ...props.buttonProps,
  loading: props.loading,
  disabled: props.disabled,
}))
const popoverConfig = computed(() => ({
  trigger: props.trigger,
  delay: props.delay,
  placement: props.placement,
  disabled: props.disabled,
}))

function onClick(evt: Event) {
  if (!buttonConfig.value.disabled) {
    emit('click', evt)
  }
}
</script>

<style scoped>
.common-button-popover-content {
  /* 可以根据设计调节样式 */
  white-space: nowrap;
}
</style>
