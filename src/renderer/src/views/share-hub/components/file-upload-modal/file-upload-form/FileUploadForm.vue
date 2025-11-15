<script setup lang="ts">
import { ElForm } from 'element-plus'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { expireTypeOptions } from '@renderer/utils/expires-time'

const { t } = useI18n()

// 表单 Ref
const formRef = ref<InstanceType<typeof ElForm>>()

// v-model:fileInfo
const fileInfo = defineModel<SharedFileInfo>('fileInfo', { required: true })

// 校验规则（Element Plus 格式）
const rules = computed(() => ({
  'status.total': [
    { required: true, message: t('views.shareHub.totalRequired') },
    {
      validator: (_, value: number, callback) => {
        if (value <= 0) {
          callback(new Error(t('views.shareHub.totalPositive')))
        } else {
          callback()
        }
      },
      trigger: ['blur', 'change'],
    },
  ],
  'status.expireType': [
    { required: true, message: t('views.shareHub.expiresAtRequired'), trigger: ['blur', 'change'] },
  ],
}))

function validate() {
  return formRef.value?.validate()
}

function restoreValidation() {
  return formRef.value?.resetFields()
}

defineExpose({
  validate,
  restoreValidation,
})
</script>

<template>
  <el-form ref="formRef" :model="fileInfo" :rules="rules" label-width="auto" label-position="top">
    <!-- 文件名 -->
    <el-form-item :label="t('views.shareHub.fileName')" prop="fileName">
      <el-input v-model="fileInfo.fileName" disabled />
    </el-form-item>

    <!-- 文件路径 -->
    <el-form-item :label="t('views.shareHub.filePath')" prop="filePath">
      <el-input v-model="fileInfo.filePath" disabled />
    </el-form-item>

    <!-- 可消费次数 -->
    <el-form-item :label="t('views.shareHub.total')" prop="status.total">
      <el-input-number
        v-model="fileInfo.status.total"
        :min="1"
        :max="5"
        style="width: 100%"
        :placeholder="t('views.shareHub.totalPlaceholder')"
      />
    </el-form-item>

    <!-- 过期时间 -->
    <el-form-item :label="t('views.shareHub.expiresAt')" prop="status.expireType">
      <el-select
        v-model="fileInfo.status.expireType"
        style="width: 100%"
        :placeholder="t('views.shareHub.expiresAtRequired')"
      >
        <el-option
          v-for="item in expireTypeOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </el-form-item>
  </el-form>
</template>
