<script setup lang="ts">
import { useFolderNameDialog } from '@renderer/composables/ftp-client/useFolderNameDialog'

const { inputRef, formRef, loading, visible, form, rules, confirmFolderName, closeDialog } =
  useFolderNameDialog()
</script>

<template>
  <n-modal
    v-model:show="visible"
    :style="`width: 400px; max-width: 100%`"
    preset="card"
    :title="$t('views.ftpClient.createFolder')"
    :on-after-leave="closeDialog"
    :mask-closable="false"
  >
    <n-form ref="formRef" :model="form" :rules="rules">
      <n-form-item :show-label="false" path="nameText">
        <n-input
          ref="inputRef"
          v-model:value="form.nameText"
          :placeholder="$t('views.ftpClient.inputFolderName')"
          @keypress.enter="confirmFolderName"
        ></n-input>
      </n-form-item>
    </n-form>

    <template #footer>
      <n-flex>
        <n-button type="primary" size="small" :loading="loading" @click="confirmFolderName">
          {{ $t('common.confirm') }}
        </n-button>
        <n-button size="small" @click="visible = false">
          {{ $t('common.cancel') }}
        </n-button>
      </n-flex>
    </template>
  </n-modal>
</template>
