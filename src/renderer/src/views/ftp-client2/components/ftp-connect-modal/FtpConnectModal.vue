<script setup lang="ts">
import { useFtpConnectModal } from '@renderer/composables/ftp-client/useFtpConnectModal'

const { visible, loading, formRef, connectConfigForm, rules, connect, closeModal } =
  useFtpConnectModal()
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
