<script setup lang="ts">
import { FormItemRule, NForm, NInput } from 'naive-ui'
import { nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const inputRef = ref<InstanceType<typeof NInput> | null>(null)
const formRef = ref<InstanceType<typeof NForm> | null>(null)

const loading = ref(false)
const visible = ref(false)
const resolveRef = ref<((value: string) => void) | null>(null)
const form = ref({
  nameText: '',
})
const rules = {
  nameText: [
    {
      required: true,
      validator(_: FormItemRule, value: string) {
        if (!value) {
          return new Error(t('views.ftpClient.folderNameRequired'))
        }
        return true
      },
      trigger: ['input', 'blur'],
    },
  ],
}

function open() {
  visible.value = true
  form.value.nameText = ''

  nextTick(() => {
    inputRef.value?.focus()
  })

  return new Promise<string>((resolve) => {
    resolveRef.value = resolve
  })
}

async function handlePositive() {
  if (!form.value.nameText) {
    return
  }

  await formRef.value?.validate()

  resolveRef.value?.(form.value.nameText)
  visible.value = false
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
    <n-form ref="formRef" :model="form" :rules="rules">
      <n-form-item :show-label="false" path="nameText">
        <n-input
          ref="inputRef"
          v-model:value="form.nameText"
          :placeholder="$t('views.ftpClient.inputFolderName')"
          @keypress.enter="handlePositive"
        ></n-input>
      </n-form-item>
    </n-form>

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
