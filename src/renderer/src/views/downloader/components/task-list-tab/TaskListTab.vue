<script setup lang="ts">
import { useTaskList } from '@renderer/composables/downloader/useTaskList'
import { List, DownloadOutline, TimeOutline, FlagOutline } from '@vicons/ionicons5'

const { activeTaskListTab, taskListTabOptions } = useTaskList()
</script>

<template>
  <div class="tabs">
    <el-check-tag
      v-for="option in taskListTabOptions"
      :key="option.key"
      class="tasklist-tag"
      :checked="activeTaskListTab === option.key"
      @click="activeTaskListTab = option.key"
    >
      <el-icon>
        <List v-if="option.key === 'all'"></List>
        <DownloadOutline v-else-if="option.key === 'downloading'"></DownloadOutline>
        <TimeOutline v-else-if="option.key === 'waiting'"></TimeOutline>
        <FlagOutline v-else-if="option.key === 'completed'"></FlagOutline>
      </el-icon>
      {{ option.label }}
    </el-check-tag>
  </div>
</template>

<style lang="less" scoped>
.tabs {
  display: flex;
  gap: 6px;

  .tasklist-tag {
    user-select: none;
    display: flex;
    gap: 6px;
    align-items: center;
  }
}
</style>
