<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElForm } from 'element-plus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const formRef = ref<InstanceType<typeof ElForm> | null>(null)

const ftpConfig = defineModel<FtpConfig>('ftpConfig', { required: true })

const rules = computed(() => ({
  host: [
    {
      required: true,
      message: t('views.fileSync.ftpHostRequired'),
      trigger: 'blur',
    },
    {
      validator: (_, value, callback) => {
        const reg =
          /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
        if (!reg.test(value)) {
          callback(new Error(t('views.fileSync.ftpHostFormat')))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
  port: [
    {
      validator: (_, value, callback) => {
        if (value < 1 || value > 65535) {
          callback(new Error(t('views.fileSync.ftpPortRange')))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
  user: [{ required: true, message: t('views.fileSync.ftpUserRequired'), trigger: 'blur' }],
  password: [{ required: true, message: t('views.fileSync.ftpPasswordRequired'), trigger: 'blur' }],
}))

/** 暴露给父组件 */
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
  <el-form ref="formRef" :model="ftpConfig" :rules="rules" label-position="top">
    <el-row :gutter="12">
      <!-- Host -->
      <el-col :span="12">
        <el-form-item :label="t('views.fileSync.ftpHost')" prop="host">
          <el-input
            v-model="ftpConfig.host"
            :placeholder="t('views.fileSync.ftpHostPlaceholder')"
            clearable
          />
        </el-form-item>
      </el-col>

      <!-- Port -->
      <el-col :span="12">
        <el-form-item :label="t('views.fileSync.ftpPort')" prop="port">
          <el-input-number
            v-model="ftpConfig.port"
            :min="1"
            :max="65535"
            style="width: 100%"
            :placeholder="t('views.fileSync.ftpPortPlaceholder')"
          />
        </el-form-item>
      </el-col>

      <!-- User -->
      <el-col :span="12">
        <el-form-item :label="t('views.fileSync.ftpUser')" prop="user">
          <el-input
            v-model="ftpConfig.user"
            :placeholder="t('views.fileSync.ftpUserPlaceholder')"
            clearable
          />
        </el-form-item>
      </el-col>

      <!-- Password -->
      <el-col :span="12">
        <el-form-item :label="t('views.fileSync.ftpPassword')" prop="password">
          <el-input
            v-model="ftpConfig.password"
            type="password"
            show-password
            :placeholder="t('views.fileSync.ftpPasswordPlaceholder')"
          />
        </el-form-item>
      </el-col>

      <!-- Secure -->
      <el-col :span="12">
        <el-form-item :label="t('views.fileSync.ftpSecure')" prop="secure">
          <el-switch v-model="ftpConfig.secure" />
        </el-form-item>
      </el-col>

      <!-- rejectUnauthorized -->
      <el-col :span="12">
        <el-form-item
          :label="t('views.fileSync.ftpRejectUnauthorized')"
          prop="secureOptions.rejectUnauthorized"
        >
          <el-switch v-model="ftpConfig.secureOptions.rejectUnauthorized" />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>
