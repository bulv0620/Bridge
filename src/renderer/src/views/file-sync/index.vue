<script setup lang="ts">
import { watch } from 'vue'
import { useDiffList } from '@renderer/composables/file-sync/useDiffList'
import { DiffFile, useSyncTool } from '@renderer/composables/file-sync/useSyncTool'
import { useSyncForm } from '@renderer/composables/file-sync/useSyncForm'
import { useFileSync } from '@renderer/composables/file-sync/useFileSync'
import FolderWhiteListModal from './components/folder-white-list-modal/FolderWhiteListModal.vue'
import DiffDataTable from './components/diff-data-table/DiffDataTable.vue'
import PlanToolbar from './components/plan-toolbar/PlanToolbar.vue'
import FtpConfigModal from './components/ftp-config-modal/FtpConfigModal.vue'
import PlanNameDialog from './components/plan-name-dialog/PlanNameDialog.vue'
import PlanManageModal from './components/plan-manage-modal/PlanManageModal.vue'
import SyncToolbar from './components/sync-toolbar/SyncToolbar.vue'
import DiffForm from './components/diff-form/DiffForm.vue'
import PlanTitle from './components/plan-title/PlanTitle.vue'

defineOptions({
  name: 'FileSync',
})

const { sourceFolder, targetFolder, syncType } = useSyncForm()
const { diffTableData } = useDiffList()
const { percentage } = useFileSync()
const { getDiffAction } = useSyncTool()

watch(syncType, (type) => {
  diffTableData.value.forEach((diffFile: DiffFile) => {
    diffFile.action = getDiffAction(diffFile, type)
  })
})
watch(
  sourceFolder,
  () => {
    diffTableData.value = []
    percentage.value = 0
  },
  { deep: true },
)
watch(
  targetFolder,
  () => {
    diffTableData.value = []
    percentage.value = 0
  },
  { deep: true },
)
</script>

<template>
  <div class="file-sync">
    <div class="container">
      <n-flex justify="space-between">
        <PlanTitle></PlanTitle>
        <PlanToolbar></PlanToolbar>
      </n-flex>
      <DiffForm></DiffForm>
      <SyncToolbar></SyncToolbar>
      <div class="table-wrapper">
        <DiffDataTable></DiffDataTable>
      </div>
    </div>
    <FolderWhiteListModal></FolderWhiteListModal>
    <FtpConfigModal></FtpConfigModal>
    <PlanNameDialog></PlanNameDialog>
    <PlanManageModal></PlanManageModal>
  </div>
</template>

<style lang="less" scoped>
.file-sync {
  padding: 18px;
  height: calc(100vh - 36px);

  .container {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;

    .table-wrapper {
      flex: 1;
      overflow: hidden;
    }
  }
}
</style>
