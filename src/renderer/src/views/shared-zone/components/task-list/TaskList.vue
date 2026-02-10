<script setup lang="ts">
import { CaretBottom, CaretTop } from '@element-plus/icons-vue'
import { useCollapse } from '@renderer/composables/share-zone/useCollapse'
import ReceivedTable from './received-table/ReceivedTable.vue'
import ReceivingTable from './receiving-table/ReceivingTable.vue'
import UploadingTable from './uploading-table/UploadingTable.vue'
import { useTaskList } from '@renderer/composables/share-zone/useTaskList'

const { tasksActive } = useCollapse()
const { activeTab, tabs } = useTaskList()
</script>

<template>
  <div class="footer">
    <div class="footer-header" :class="{ border: tasksActive }">
      <div class="tabs">
        <div
          v-for="(tab, index) in tabs"
          :key="index"
          class="tab-item"
          :class="{ active: activeTab === index }"
          @click="activeTab = index"
        >
          <div class="text">{{ tab.name }}</div>
          <div class="num-box" :class="{ light: tab.num > 0 }">
            {{ tab.num }}
          </div>
        </div>
      </div>
      <div>
        <el-button
          size="small"
          circle
          plain
          :icon="tasksActive ? CaretBottom : CaretTop"
          @click="tasksActive = !tasksActive"
        />
      </div>
    </div>

    <div class="clipboard-wrapper" :class="{ active: tasksActive }">
      <UploadingTable v-if="activeTab === 0"></UploadingTable>
      <ReceivingTable v-else-if="activeTab === 1"></ReceivingTable>
      <ReceivedTable v-else-if="activeTab === 2"></ReceivedTable>
    </div>
  </div>
</template>

<style lang="less" scoped>
.footer {
  border-top: 1px solid var(--el-border-color);
  background: var(--el-bg-color);

  .footer-header {
    height: 48px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 16px;

    &.border {
      border-bottom: 1px solid var(--el-border-color-lighter);
    }

    .tabs {
      display: flex;
      gap: 20px;

      .tab-item {
        display: flex;
        gap: 6px;
        align-items: center;
        cursor: pointer;
        position: relative;
        height: 48px; // 与 header 同高以便定位下划线

        &.active {
          color: var(--el-color-primary);
          &::after {
            content: '';
            width: 100%;
            height: 2px;
            position: absolute;
            bottom: 0;
            left: 0;
            background: var(--el-color-primary);
          }
        }

        .text {
          font-size: 14px;
        }
        .num-box {
          font-family: monospace;
          font-size: 11px;
          padding: 0 5px;
          height: 16px;
          border-radius: 8px;
          background: var(--el-fill-color-darker);
          color: #fff;
          display: flex;
          align-items: center;
          &.light {
            background: var(--el-color-primary);
          }
        }
      }
    }
  }

  .clipboard-wrapper {
    height: 0;
    overflow: hidden;
    transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &.active {
      height: 200px;
    }

    .empty-status {
      padding: 40px 0;
      color: var(--el-text-color-placeholder);
    }
  }
}
</style>
