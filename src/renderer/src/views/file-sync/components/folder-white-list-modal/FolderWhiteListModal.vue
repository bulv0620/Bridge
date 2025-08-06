<script setup lang="ts">
import { useFolderWhiteList } from '@renderer/composables/file-sync/useFolderWhiteList'

const { visible, editingWhiteList, showAlert, closeAlert, confirmWhiteList, closeModal } =
  useFolderWhiteList()
</script>

<template>
  <n-modal
    v-model:show="visible"
    style="width: 400px"
    preset="card"
    :title="$t('views.fileSync.folderWhiteList')"
    :on-after-leave="closeModal"
  >
    <n-alert v-if="showAlert" type="info" style="margin-bottom: 12px" closable @close="closeAlert">
      {{ $t('views.fileSync.needRecompare') }}
    </n-alert>

    <n-scrollbar style="max-height: 220px">
      <n-dynamic-input v-model:value="editingWhiteList" />
    </n-scrollbar>
    <template #footer>
      <n-flex justify="end">
        <n-button size="small" @click="visible = false">{{ $t('common.cancel') }}</n-button>
        <n-button type="primary" size="small" @click="confirmWhiteList">
          {{ $t('common.confirm') }}
        </n-button>
      </n-flex>
    </template>
  </n-modal>
</template>
