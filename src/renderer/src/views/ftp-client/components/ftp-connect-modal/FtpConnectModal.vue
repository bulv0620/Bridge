<script setup lang="ts">
import { useFtpConnectModal } from '@renderer/composables/ftp-client/useFtpConnectModal'
import { FormRules } from 'naive-ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { visible, loading, formRef, connectConfigForm, connect, closeModal } = useFtpConnectModal()

const { t } = useI18n()

const rules = computed<FormRules>(() => ({
  host: [
    {
      trigger: ['change'],
      validator(_, value) {
        if (!value) {
          return new Error(t('views.ftpClient.ftpHostRequired'))
        }
        const reg =
          /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
        if (!reg.test(value)) {
          return new Error(t('views.ftpClient.ftpHostFormat'))
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
      message: t('views.ftpClient.ftpPortRange'),
    },
  ],
  user: [
    {
      required: true,
      trigger: ['change'],
      message: t('views.ftpClient.ftpUserRequired'),
    },
  ],
  password: [
    {
      required: true,
      trigger: ['change'],
      message: t('views.ftpClient.ftpPasswordRequired'),
    },
  ],
}))
</script>

<template>
  <n-modal
    v-model:show="visible"
    :style="`width: 400px; max-width: 100%`"
    preset="card"
    :title="$t('views.ftpClient.ftpConfig')"
    :on-after-leave="closeModal"
    :mask-closable="false"
  >
    <n-form
      ref="formRef"
      :model="connectConfigForm"
      :rules="rules"
      label-placement="left"
      label-width="90px"
      @submit.prevent
    >
      <n-form-item path="host" :label="$t('views.ftpClient.ftpHost')">
        <n-input
          v-model:value="connectConfigForm.host"
          placeholder="127.0.0.1"
          :disabled="loading"
        />
      </n-form-item>
      <n-form-item path="port" :label="$t('views.ftpClient.ftpPort')">
        <n-input-number
          v-model:value="connectConfigForm.port"
          style="width: 100%"
          :disabled="loading"
        />
      </n-form-item>
      <n-form-item path="user" :label="$t('views.ftpClient.ftpUser')">
        <n-input
          v-model:value="connectConfigForm.user"
          :placeholder="$t('views.ftpClient.ftpUser')"
          :disabled="loading"
        />
      </n-form-item>
      <n-form-item path="password" :label="$t('views.ftpClient.ftpPassword')">
        <n-input
          v-model:value="connectConfigForm.password"
          type="password"
          show-password-on="click"
          :placeholder="$t('views.ftpClient.ftpPassword')"
          :disabled="loading"
        />
      </n-form-item>
    </n-form>

    <template #footer>
      <n-flex>
        <n-button type="primary" size="small" :loading="loading" @click="connect">
          {{ $t('common.confirm') }}
        </n-button>
        <n-button size="small" @click="visible = false">
          {{ $t('common.cancel') }}
        </n-button>
      </n-flex>
    </template>
  </n-modal>
</template>
