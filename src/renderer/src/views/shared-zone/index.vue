<script setup lang="ts">
import TaskList from './components/task-list/TaskList.vue'
import Clipboard from './components/clipboard/Clipboard.vue'
import Devices from './components/devices/Devices.vue'
import Uploader from './components/uploader/Uploader.vue'
import SettingModal from './components/setting-modal/SettingModal.vue'
import { useCollapse } from '@renderer/composables/share-zone/useCollapse'
import { useTaskList } from '@renderer/composables/share-zone/useTaskList'

const { clipboardActive } = useCollapse()
const { file } = useTaskList()
</script>

<template>
  <div id="share-zone" class="share-zone">
    <div class="share-content">
      <main class="transfer-main">
        <section class="send-panel" :class="{ selected: file }">
          <Devices v-if="file"></Devices>
          <Uploader></Uploader>
        </section>
        <TaskList></TaskList>
      </main>
      <Transition name="clipboard-panel">
        <Clipboard v-if="clipboardActive" class="clipboard-side"></Clipboard>
      </Transition>
    </div>
  </div>
  <SettingModal></SettingModal>
</template>

<style lang="less" scoped>
.share-zone {
  height: 100%;
  min-width: 0;
  background: var(--bridge-surface);
  display: flex;
  flex-direction: column;

  .share-content {
    min-height: 0;
    flex: 1;
    padding: var(--bridge-page-padding);
    display: flex;
    gap: 10px;
    overflow: hidden;

    .transfer-main {
      min-width: 0;
      min-height: 0;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 10px;
      overflow: hidden;

      .send-panel {
        min-height: 240px;
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border-radius: var(--bridge-radius-md);
        background: var(--bridge-surface-soft);
        box-shadow: inset 0 0 0 1px var(--bridge-stroke);

        &:not(.selected) {
          background: transparent;
          box-shadow: none;
        }
      }
    }

    .clipboard-side {
      width: clamp(260px, 34%, 320px);
      min-width: 260px;
      flex: none;
    }
  }
}

.clipboard-panel-enter-active,
.clipboard-panel-leave-active {
  transition:
    opacity var(--bridge-motion),
    transform var(--bridge-motion);
}

.clipboard-panel-enter-from,
.clipboard-panel-leave-to {
  opacity: 0;
  transform: translateX(8px);
}

@media (max-width: 760px) {
  .share-zone .share-content {
    .clipboard-side {
      width: 260px;
      min-width: 240px;
    }
  }
}

@media (max-height: 680px) {
  .share-zone .share-content {
    gap: 8px;
  }
}
</style>
