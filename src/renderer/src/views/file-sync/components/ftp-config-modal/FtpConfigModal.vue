<script setup lang="ts">
import { useFtpConfigModal } from '@renderer/composables/file-sync/useFtpConfigModal'

const {
  loading,
  visible,
  formRef,
  current,
  currentStatus,
  model,
  folderTree,
  currentPath,
  rules,
  handleLoad,
  handleNext,
  handlePrev,
  confirmConfig,
  closeModal,
} = useFtpConfigModal()
</script>

<template>
  <n-modal
    v-model:show="visible"
    :style="`width: 400px; max-width: 100%`"
    preset="card"
    :title="$t('views.fileSync.ftpConfig')"
    :on-after-leave="closeModal"
    :mask-closable="false"
  >
    <n-steps :current="current" :status="currentStatus" size="small" style="margin-bottom: 24px">
      <n-step :title="$t('views.fileSync.ftpConnInfo')" />
      <n-step :title="$t('views.fileSync.ftpPathSelect')" />
    </n-steps>
    <n-form
      v-if="current === 1"
      ref="formRef"
      :model="model"
      :rules="rules"
      label-placement="left"
      label-width="90px"
      @submit.prevent
    >
      <n-form-item path="host" :label="$t('views.fileSync.ftpHost')">
        <n-input v-model:value="model.host" placeholder="127.0.0.1" :disabled="loading" />
      </n-form-item>
      <n-form-item path="port" :label="$t('views.fileSync.ftpPort')">
        <n-input-number v-model:value="model.port" style="width: 100%" :disabled="loading" />
      </n-form-item>
      <n-form-item path="user" :label="$t('views.fileSync.ftpUser')">
        <n-input
          v-model:value="model.user"
          :placeholder="$t('views.fileSync.ftpUser')"
          :disabled="loading"
        />
      </n-form-item>
      <n-form-item path="password" :label="$t('views.fileSync.ftpPassword')">
        <n-input
          v-model:value="model.password"
          type="password"
          show-password-on="click"
          :placeholder="$t('views.fileSync.ftpPassword')"
          :disabled="loading"
        />
      </n-form-item>
    </n-form>
    <div v-else>
      <n-scrollbar style="max-height: 200px; margin-top: 18px" trigger="none">
        <n-tree
          v-model:selected-keys="currentPath"
          block-line
          :data="folderTree"
          selectable
          :on-load="handleLoad"
          :default-expanded-keys="['/']"
        />
      </n-scrollbar>
      <n-form-item
        style="margin-top: 18px"
        :label="$t('views.fileSync.currentPath')"
        label-placement="left"
      >
        <n-input :value="currentPath[0] || '/'" readonly />
      </n-form-item>
    </div>

    <template #footer>
      <n-flex>
        <n-button
          v-if="current === 1"
          type="primary"
          size="small"
          :loading="loading"
          @click="handleNext"
        >
          {{ $t('common.next') }}
        </n-button>
        <n-button
          v-if="current === 2"
          type="primary"
          size="small"
          :loading="loading"
          @click="handlePrev"
        >
          {{ $t('common.prev') }}
        </n-button>
        <n-button
          v-if="current === 2"
          type="primary"
          size="small"
          :loading="loading"
          @click="confirmConfig"
        >
          {{ $t('common.confirm') }}
        </n-button>
        <n-button size="small" @click="visible = false">
          {{ $t('common.cancel') }}
        </n-button>
      </n-flex>
    </template>
  </n-modal>
</template>
