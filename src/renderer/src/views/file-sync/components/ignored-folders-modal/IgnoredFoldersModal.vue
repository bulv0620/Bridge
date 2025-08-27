<script setup lang="ts">
import { useIgnoredFoldersModal } from '@renderer/composables/file-sync-v2/useIgnoredFoldersModal'

const { visible, edtingIgnoredFolderList, conifrmIgnoredFolders } = useIgnoredFoldersModal()
</script>

<template>
  <n-modal
    v-model:show="visible"
    style="width: 400px"
    preset="card"
    :title="$t('views.fileSync.ignoredFolders')"
  >
    <n-scrollbar style="max-height: 220px">
      <n-dynamic-input v-model:value="edtingIgnoredFolderList" />
    </n-scrollbar>
    <template #footer>
      <n-flex justify="end">
        <n-button size="small" @click="visible = false">{{ $t('common.cancel') }}</n-button>
        <n-button type="primary" size="small" @click="conifrmIgnoredFolders">
          {{ $t('common.confirm') }}
        </n-button>
      </n-flex>
    </template>
  </n-modal>
</template>
