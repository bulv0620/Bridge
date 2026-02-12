<script setup lang="ts">
import TaskList from './components/task-list/TaskList.vue'
import Clipboard from './components/clipboard/Clipboard.vue'
import Devices from './components/devices/Devices.vue'
import Header from './components/header/Header.vue'
import Uploader from './components/uploader/Uploader.vue'
import SettingModal from './components/setting-modal/SettingModal.vue'
</script>

<template>
  <div id="share-zone" class="share-zone">
    <Header></Header>

    <div class="main">
      <Uploader></Uploader>
      <Devices></Devices>
    </div>
    <TaskList></TaskList>
    <Clipboard></Clipboard>
  </div>
  <SettingModal></SettingModal>
</template>

<style lang="less" scoped>
.share-zone {
  height: 100%;
  background: var(--el-bg-color);
  display: flex;
  flex-direction: column;

  .main {
    flex: 1;
    overflow: hidden;
    padding: 16px;
    display: flex;
    gap: 16px;
    height: 100%;
    z-index: 10;
  }
}
</style>
