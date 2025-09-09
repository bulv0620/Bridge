<script setup lang="ts">
import ShareToolbar from './components/share-toolbar/ShareToolbar.vue'
import FileList from './components/file-list/FileList.vue'
import OnlineDevicePopover from './components/online-device-popover/OnlineDevicePopover.vue'
import TransferPopover from './components/transfer-popover/TransferPopover.vue'

defineOptions({
  name: 'ShareHub',
})
</script>

<template>
  <div id="share-hub-drawer-target" class="shareHub">
    <div class="header">
      <ShareToolbar></ShareToolbar>
    </div>
    <n-divider style="margin: 0"></n-divider>

    <FileList></FileList>

    <n-divider style="margin: 0"></n-divider>
    <div class="footer">
      <OnlineDevicePopover></OnlineDevicePopover>
      <TransferPopover></TransferPopover>
    </div>
  </div>
</template>

<style lang="less" scoped>
.shareHub {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;

  .header {
    padding: 16px;
    display: flex;
    justify-content: space-between;
  }

  .footer {
    padding: 16px;
    display: flex;
    justify-content: space-between;
  }
}
</style>
