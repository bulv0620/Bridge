<template>
  <n-modal
    v-model:show="visible"
    style="width: 400px"
    preset="card"
    :title="$t('views.backpack.planName')"
    :on-after-leave="handleNegativeClick"
  >
    <n-form ref="formRef" :model="form" :rules="rules">
      <n-form-item :show-label="false" path="planName">
        <n-input ref="inputRef" v-model:value="form.planName" />
      </n-form-item>
    </n-form>

    <template #footer>
      <n-flex justify="end">
        <n-button size="small" @click="visible = false">{{ t('common.cancel') }}</n-button>
        <n-button type="primary" size="small" @click="handlePositiveClick">
          {{ t('common.confirm') }}
        </n-button>
      </n-flex>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { FormItemRule, NForm } from 'naive-ui'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const visible = ref(false)

const form = ref({
  planName: '',
})
const formRef = ref<InstanceType<typeof NForm> | null>(null)
const rules = {
  planName: [
    {
      required: true,
      validator(_: FormItemRule, value: string) {
        if (!value) {
          return new Error(t('views.backpack.planNameRequired'))
        } else if (savedPlanNameList.value.includes(value)) {
          return new Error(t('views.backpack.planNameDuplicate'))
        }
        return true
      },
      trigger: ['input', 'blur'],
    },
  ],
}
const savedPlanNameList = ref<string[]>([])
const inputRef = ref<HTMLElement | null>(null)
const resolveRef = ref<((value: any) => void) | null>(null)

const prompt = (defaultName: string, planNameList: string[]) => {
  return new Promise<any>((resolve) => {
    form.value.planName = defaultName
    savedPlanNameList.value = planNameList
    visible.value = true
    resolveRef.value = resolve
  })
}

const handlePositiveClick = async () => {
  if (!form.value.planName) {
    return
  }

  await formRef.value?.validate()

  if (resolveRef.value) {
    resolveRef.value(form.value.planName)
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
  prompt,
})
</script>
