<script setup lang="ts">
import { NInput } from 'naive-ui'
import { nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const loading = ref(false)
const visible = ref(false)
const resolveRef = ref<((value: string) => void) | null>(null)
const nameText = ref('')

const inputRef = ref<InstanceType<typeof NInput> | null>(null)

function open() {
  visible.value = true
  nameText.value = ''

  nextTick(() => {
    inputRef.value?.focus()
  })

  return new Promise<string>((resolve) => {
    resolveRef.value = resolve
  })
}

async function handlePositive() {
  visible.value = false
  resolveRef.value?.(nameText.value)
}

function handleNegative() {
  visible.value = false
  resolveRef.value?.('')
}

defineExpose({
  open,
})
</script>

<template>
  <n-modal
    v-model:show="visible"
    :style="`width: 400px; max-width: 100%`"
    preset="card"
    :title="$t('views.ftpClient.createFolder')"
    :on-after-leave="handleNegative"
    :mask-closable="false"
  >
    <n-input
      ref="inputRef"
      v-model:value="nameText"
      :placeholder="$t('views.ftpClient.inputFolderName')"
      @keypress.enter="handlePositive"
    ></n-input>

    <template #footer>
      <n-flex>
        <n-button type="primary" size="small" :loading="loading" @click="handlePositive">
          {{ t('common.confirm') }}
        </n-button>
        <n-button size="small" @click="visible = false">
          {{ t('common.cancel') }}
        </n-button>
      </n-flex>
    </template>
  </n-modal>
</template>
