<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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
  proxyUrl: [
    {
      validator: (_, value, callback) => {
        if (!s3Config.value.useProxy) {
          return callback() // 没开启代理，不校验
        }

        if (!value) {
          return callback(new Error(t('views.fileSync.s3ProxyRequired')))
        }

        try {
          new URL(value)
          callback()
        } catch {
          callback(new Error(t('views.fileSync.s3ProxyFormat')))
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

watch(
  () => s3Config.value.useProxy,
  (val) => {
    if (!val) {
      s3Config.value.proxyUrl = ''
      formRef.value?.clearValidate('proxyUrl')
    }
  },
)

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

      <!-- Advanced Options -->
      <el-col :span="24">
        <el-collapse>
          <el-collapse-item :title="t('views.fileSync.s3AdvancedOptions')" name="advanced">
            <el-row :gutter="12">
              <!-- Use Proxy -->
              <el-col :span="6">
                <el-form-item :label="t('views.fileSync.s3UseProxy')" prop="useProxy">
                  <el-switch v-model="s3Config.useProxy" />
                </el-form-item>
              </el-col>

              <!-- Proxy URL -->
              <el-col :span="18">
                <el-form-item :label="t('views.fileSync.s3ProxyUrl')" prop="proxyUrl">
                  <el-input
                    v-model="s3Config.proxyUrl"
                    :placeholder="t('views.fileSync.s3ProxyUrlPlaceholder')"
                    clearable
                    :disabled="!s3Config.useProxy"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-collapse-item>
        </el-collapse>
      </el-col>
    </el-row>
  </el-form>
</template>

<style scoped lang="less">
:deep(.el-collapse-item__content) {
  padding-bottom: 4px;
}
</style>
