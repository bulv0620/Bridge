<script setup lang="ts">
import { FormRules, NForm } from 'naive-ui'
import { computed, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const formRef = useTemplateRef<InstanceType<typeof NForm>>('formRef')

// 双向绑定的数据模型
const fileInfo = defineModel<SharedFileInfo>('fileInfo', { required: true })

// 校验规则
const rules = computed<FormRules>(() => ({
  'status.total': [
    {
      required: true,
      type: 'number',
      trigger: ['change', 'blur'],
      message: t('views.shareHub.totalRequired', '请输入可消费次数'),
    },
    {
      validator(_, value: number) {
        if (value <= 0) {
          return new Error(t('views.shareHub.totalPositive', '可消费次数必须大于 0'))
        }
        return true
      },
      trigger: ['change', 'blur'],
    },
  ],
  'status.expiresAt': [
    {
      required: true,
      type: 'number',
      trigger: ['change', 'blur'],
      message: t('views.shareHub.expiresAtRequired', '请选择过期时间'),
    },
  ],
}))

function validate() {
  return formRef.value?.validate()
}

function restoreValidation() {
  return formRef.value?.restoreValidation()
}

defineExpose({
  validate,
  restoreValidation,
})
</script>

<template>
  <n-form ref="formRef" size="small" :model="fileInfo" :rules="rules" label-width="120px">
    <!-- 文件名 -->
    <n-form-item :label="t('views.shareHub.fileName')" path="fileName">
      <n-input v-model:value="fileInfo.fileName" disabled />
    </n-form-item>

    <!-- 文件路径 -->
    <n-form-item :label="t('views.shareHub.filePath')" path="filePath">
      <n-input v-model:value="fileInfo.filePath" disabled />
    </n-form-item>

    <!-- 可消费次数 -->
    <n-form-item :label="t('views.shareHub.total')" path="status.total">
      <n-input-number
        v-model:value="fileInfo.status.total"
        :min="1"
        style="width: 100%"
        :placeholder="t('views.shareHub.totalPlaceholder')"
      />
    </n-form-item>

    <!-- 过期时间 -->
    <n-form-item :label="t('views.shareHub.expiresAt')" path="status.expiresAt">
      <n-date-picker
        v-model:value="fileInfo.status.expiresAt"
        type="datetime"
        style="width: 100%"
        :placeholder="t('views.shareHub.expiresAtPlaceholder')"
      />
    </n-form-item>
  </n-form>
</template>
