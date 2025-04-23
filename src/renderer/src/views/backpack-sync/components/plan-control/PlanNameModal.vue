<template>
  <n-modal
    v-model:show="visible"
    style="width: 400px"
    preset="card"
    :title="$t('views.backpack.planName')"
    :on-after-leave="handleNegativeClick"
  >
    <n-input ref="inputRef" v-model:value="form.planName" :status="form.planName ? '' : 'error'" />

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
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const visible = ref(false)

const form = ref({
  planName: '',
})
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

const handlePositiveClick = () => {
  if (!form.value.planName) {
    return
  }

  if (savedPlanNameList.value.includes(form.value.planName)) {
    // 方案名称重复
    return
  }

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
