<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElForm } from 'element-plus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

/** 暴露给父组件的 formRef */
const formRef = ref<InstanceType<typeof ElForm> | null>(null)

/** 父组件传入的 S3Config */
const s3Config = defineModel<S3Config>('s3Config', { required: true })

/** 表单规则 */
const rules = computed(() => ({
  region: [{ required: true, message: t('views.fileSync.s3RegionRequired'), trigger: 'blur' }],
  accessKeyId: [
    { required: true, message: t('views.fileSync.s3AccessKeyRequired'), trigger: 'blur' },
  ],
  secretAccessKey: [
    { required: true, message: t('views.fileSync.s3SecretKeyRequired'), trigger: 'blur' },
  ],
  bucket: [{ required: true, message: t('views.fileSync.s3BucketRequired'), trigger: 'blur' }],
  endpoint: [
    {
      validator: (_, value, callback) => {
        if (!value) return callback()

        // 简单 URL 验证
        try {
          new URL(value)
          callback()
        } catch {
          callback(new Error(t('views.fileSync.s3EndpointFormat')))
        }
      },
      trigger: 'blur',
    },
  ],
}))

/** 暴露方法给父组件 */
function validate() {
  return formRef.value?.validate()
}

function clearValidate() {
  return formRef.value?.clearValidate()
}

defineExpose({
  validate,
  clearValidate,
})
</script>

<template>
  <el-form ref="formRef" :model="s3Config" :rules="rules" label-position="top">
    <el-row :gutter="12">
      <!-- Region -->
      <el-col :span="12">
        <el-form-item :label="t('views.fileSync.s3Region')" prop="region">
          <el-input
            v-model="s3Config.region"
            :placeholder="t('views.fileSync.s3RegionPlaceholder')"
            clearable
          />
        </el-form-item>
      </el-col>

      <!-- Bucket -->
      <el-col :span="12">
        <el-form-item :label="t('views.fileSync.s3Bucket')" prop="bucket">
          <el-input
            v-model="s3Config.bucket"
            :placeholder="t('views.fileSync.s3BucketPlaceholder')"
            clearable
          />
        </el-form-item>
      </el-col>

      <!-- Access Key -->
      <el-col :span="12">
        <el-form-item :label="t('views.fileSync.s3AccessKey')" prop="accessKeyId">
          <el-input
            v-model="s3Config.accessKeyId"
            :placeholder="t('views.fileSync.s3AccessKeyPlaceholder')"
            clearable
          />
        </el-form-item>
      </el-col>

      <!-- Secret Key -->
      <el-col :span="12">
        <el-form-item :label="t('views.fileSync.s3SecretKey')" prop="secretAccessKey">
          <el-input
            v-model="s3Config.secretAccessKey"
            type="password"
            show-password
            :placeholder="t('views.fileSync.s3SecretKeyPlaceholder')"
          />
        </el-form-item>
      </el-col>

      <!-- Endpoint (optional) -->
      <el-col :span="12">
        <el-form-item :label="t('views.fileSync.s3Endpoint')" prop="endpoint">
          <el-input
            v-model="s3Config.endpoint"
            :placeholder="t('views.fileSync.s3EndpointPlaceholder')"
            clearable
          />
        </el-form-item>
      </el-col>

      <!-- Force Path Style -->
      <el-col :span="12">
        <el-form-item :label="t('views.fileSync.s3ForcePathStyle')" prop="forcePathStyle">
          <el-switch v-model="s3Config.forcePathStyle" />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>
