<script setup lang="ts">
import { FormRules, NForm } from 'naive-ui'
import { computed, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const formRef = useTemplateRef<InstanceType<typeof NForm>>('formRef')

const ftpConfig = defineModel<FtpConfig>('ftpConfig', { required: true })

const rules = computed<FormRules>(() => ({
  host: [
    {
      required: true,
      trigger: ['change'],
      message: t('views.fileSync.ftpHostRequired'),
    },
    {
      trigger: ['change'],
      validator(_, value) {
        const reg =
          /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
        if (!reg.test(value)) {
          return new Error(t('views.fileSync.ftpHostFormat'))
        }
        return true
      },
    },
  ],
  port: [
    {
      type: 'number',
      min: 1,
      max: 65535,
      trigger: ['change'],
      message: t('views.fileSync.ftpPortRange'),
    },
  ],
  user: [
    {
      required: true,
      trigger: ['change'],
      message: t('views.fileSync.ftpUserRequired'),
    },
  ],
  password: [
    {
      required: true,
      trigger: ['change'],
      message: t('views.fileSync.ftpPasswordRequired'),
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
  <n-form ref="formRef" size="small" :model="ftpConfig" :rules="rules" label-width="120px">
    <n-grid x-gap="12" :cols="2">
      <n-gi>
        <n-form-item :label="t('views.fileSync.ftpHost')" path="host">
          <n-input
            v-model:value="ftpConfig.host"
            :placeholder="t('views.fileSync.ftpHostPlaceholder')"
          />
        </n-form-item>
      </n-gi>
      <n-gi>
        <n-form-item :label="t('views.fileSync.ftpPort')" path="port">
          <n-input-number
            v-model:value="ftpConfig.port"
            style="width: 100%"
            :min="1"
            :max="65535"
            :placeholder="t('views.fileSync.ftpPortPlaceholder')"
          />
        </n-form-item>
      </n-gi>
      <n-gi>
        <n-form-item :label="t('views.fileSync.ftpUser')" path="user">
          <n-input
            v-model:value="ftpConfig.user"
            :placeholder="t('views.fileSync.ftpUserPlaceholder')"
          />
        </n-form-item>
      </n-gi>
      <n-gi>
        <n-form-item :label="t('views.fileSync.ftpPassword')" path="password">
          <n-input
            v-model:value="ftpConfig.password"
            type="password"
            :placeholder="t('views.fileSync.ftpPasswordPlaceholder')"
          />
        </n-form-item>
      </n-gi>
      <n-gi>
        <n-form-item :label="t('views.fileSync.ftpSecure')" path="secure">
          <n-switch v-model:value="ftpConfig.secure" />
        </n-form-item>
      </n-gi>
      <n-gi>
        <n-form-item
          :label="t('views.fileSync.ftpRejectUnauthorized')"
          path="secureOptions.rejectUnauthorized"
        >
          <n-switch v-model:value="ftpConfig.secureOptions.rejectUnauthorized" />
        </n-form-item>
      </n-gi>
    </n-grid>
  </n-form>
</template>
