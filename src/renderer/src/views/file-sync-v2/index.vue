<script setup lang="ts">
import { useFileList } from '@renderer/composables/file-sync-v2/useFileList'
import { mockDiffFileList } from '@renderer/composables/file-sync-v2/mock'
import EditableTitle from './components/editable-title/EditableTitle.vue'
import FileList from './components/file-list/FileList.vue'
import PlanToolbar from './components/plan-toolbar/PlanToolbar.vue'
import SyncForm from './components/sync-form/SyncForm.vue'
import SyncToolbar from './components/sync-toolbar/SyncToolbar.vue'
import { onMounted } from 'vue'

defineOptions({
  name: 'FileSyncV2',
})

const { diffFileList } = useFileList()

function getMockTableData() {
  diffFileList.value = JSON.parse(JSON.stringify(mockDiffFileList))
}

onMounted(() => {
  getMockTableData()
})
</script>

<template>
  <div class="file-sync">
    <div class="header">
      <EditableTitle></EditableTitle>
      <PlanToolbar></PlanToolbar>
    </div>
    <n-divider style="margin: 0"></n-divider>

    <div class="main">
      <SyncForm></SyncForm>
      <SyncToolbar></SyncToolbar>
      <div class="table">
        <FileList></FileList>
      </div>
    </div>

    <n-divider style="margin: 0"></n-divider>
    <div class="footer">0/0</div>
  </div>
</template>

<style lang="less" scoped>
.file-sync {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;

  .header {
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .main {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    .table {
      padding: 16px;
      flex: 1;
      overflow: hidden;
    }
  }

  .footer {
    padding: 16px;
    display: flex;
    justify-content: space-between;
  }
}
</style>
