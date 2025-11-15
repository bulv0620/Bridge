<script setup lang="ts">
import { useIgnoredFoldersModal } from '@renderer/composables/file-sync/useIgnoredFoldersModal'
import { Delete, Plus } from '@element-plus/icons-vue'

const { visible, edtingIgnoredFolderList, conifrmIgnoredFolders } = useIgnoredFoldersModal()
</script>

<template>
  <CommonDialog
    v-model:visible="visible"
    :title="$t('views.fileSync.ignoredFolders')"
    width="400px"
    :on-confirm="conifrmIgnoredFolders"
  >
    <el-scrollbar height="220px">
      <div class="dynamic-input-wrapper">
        <div v-for="(_, index) in edtingIgnoredFolderList" :key="index" class="input-row">
          <el-input v-model="edtingIgnoredFolderList[index]" />
          <el-button
            circle
            type="danger"
            :icon="Delete"
            size="small"
            @click="edtingIgnoredFolderList.splice(index, 1)"
          />
        </div>

        <el-button
          :icon="Plus"
          style="border: 1px dashed var(--el-border-color-light)"
          @click="edtingIgnoredFolderList.push('')"
          >{{ $t('common.add') }}
        </el-button>
      </div>
    </el-scrollbar>
  </CommonDialog>
</template>

<style scoped>
.dynamic-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px;
}

.input-row {
  display: flex;
  flex-direction: row;
  gap: 6px;
  align-items: center;
}
</style>
