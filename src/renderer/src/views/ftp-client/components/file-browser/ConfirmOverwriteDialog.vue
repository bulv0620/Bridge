<template>
  <n-modal
    v-model:show="visible"
    :style="`width: 380px; max-width: 100%`"
    title="提示"
    preset="card"
    :mask-closable="false"
    :esc-key-closable="false"
    @close="onCancel"
  >
    <div>{{ $t('views.ftpClient.confirmOverwrite', { fileName }) }}</div>
    <n-space align="center" style="margin-top: 16px"> </n-space>
    <template #footer>
      <n-space justify="space-between">
        <n-checkbox v-model:checked="remember">{{ $t('common.remember') }}</n-checkbox>

        <n-space>
          <n-button type="primary" size="small" @click="onConfirm">
            {{ $t('common.confirm') }}
          </n-button>
          <n-button size="small" @click="onCancel">{{ $t('common.cancel') }}</n-button>
        </n-space>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NModal, NButton, NCheckbox, NSpace } from 'naive-ui'

const visible = ref(false)
const remember = ref(false)
const fileName = ref('')
let resolver: ((value: [boolean, boolean]) => void) | null = null

/**
 * 打开弹框并返回 Promise，resolve 为 [confirmed, remembered]
 */
function open(name: string): Promise<[boolean, boolean]> {
  visible.value = true
  remember.value = false
  fileName.value = name
  return new Promise((resolve) => {
    resolver = resolve
  })
}

function close() {
  visible.value = false
  resolver = null
}

function onConfirm() {
  if (resolver) {
    resolver([true, remember.value])
  }
  close()
}

function onCancel() {
  if (resolver) {
    resolver([false, remember.value])
  }
  close()
}

defineExpose({ open })
</script>
