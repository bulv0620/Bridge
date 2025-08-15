<script setup lang="ts">
import { useFileList } from '@renderer/composables/file-sync-v2/useFileList'
import FileList from './file-list/FileList.vue'
import { mockDiffFileList } from '@renderer/composables/file-sync-v2/mock'

defineOptions({
  name: 'FileSyncV2',
})

const { diffFileList } = useFileList()

function getMockTableData() {
  diffFileList.value = JSON.parse(JSON.stringify(mockDiffFileList))
}
</script>

<template>
  <div class="file-sync">
    <div class="header">
      <div class="title-editor">title</div>
      <div class="plan-toolbar">plan</div>
    </div>
    <n-divider style="margin: 0"></n-divider>

    <div class="main">
      <div class="form">form</div>
      <div class="toolbar">
        toobar
        <n-button @click="getMockTableData">test</n-button>
      </div>
      <div class="table">
        <FileList></FileList>
      </div>
    </div>

    <n-divider style="margin: 0"></n-divider>
    <div class="footer">waiting</div>
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
  }

  .main {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    .form {
      padding: 16px;
      display: flex;
      justify-content: space-between;
    }

    .toolbar {
      padding: 16px;
      display: flex;
      justify-content: space-between;
    }

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
