<template>
  <n-modal
    v-model:show="visible"
    :style="`width: ${modalWidth}px`"
    preset="card"
    :title="title"
    :on-after-leave="handleNegativeClick"
  >
    <n-radio-group v-model:value="selectedValue">
      <n-space vertical>
        <n-radio
          v-for="option in options"
          :key="option.value"
          :value="option.value"
          :label="option.label"
        />
      </n-space>
    </n-radio-group>
    <template #footer>
      <n-flex>
        <n-button type="primary" size="small" @click="handlePositiveClick">
          {{ confirmText }}
        </n-button>
        <n-button size="small" @click="visible = false">{{ cancelText }}</n-button>
      </n-flex>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NModal, NSpace, NRadioGroup, NRadio } from 'naive-ui'
import { useI18n } from 'vue-i18n'

interface SelectModalOption {
  label: string
  value: any
}

interface SelectModalConfig {
  title?: string
  width?: number
  defaultValue?: any
  confirmText?: string
  cancelText?: string
}

const { t } = useI18n()

const visible = ref(false)
const title = ref('请选择')
const modalWidth = ref(300)
const options = ref<SelectModalOption[]>([])
const selectedValue = ref<any>(null)
const confirmText = ref<string>('')
const cancelText = ref<string>('')
const resolveRef = ref<((value: any) => void) | null>(null)

const select = (opts: SelectModalOption[], config: SelectModalConfig) => {
  return new Promise<any>((resolve) => {
    title.value = config.title || t('common.select')
    options.value = opts
    modalWidth.value = config.width || 300
    selectedValue.value = config.defaultValue

    confirmText.value = config.confirmText || t('common.confirm')
    cancelText.value = config.cancelText || t('common.cancel')

    visible.value = true
    resolveRef.value = resolve
  })
}

const handlePositiveClick = () => {
  if (resolveRef.value) {
    resolveRef.value(selectedValue.value)
    resolveRef.value = null
  }
  visible.value = false
}

const handleNegativeClick = () => {
  if (resolveRef.value) {
    resolveRef.value(null)
    resolveRef.value = null
  }
  visible.value = false
}

defineExpose({
  select,
})
</script>
