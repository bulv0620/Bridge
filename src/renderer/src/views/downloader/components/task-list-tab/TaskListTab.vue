<script setup lang="ts">
import { useTaskList } from '@renderer/composables/downloader/useTaskList'
import { List, DownloadOutline, TimeOutline, FlagOutline } from '@vicons/ionicons5'

const { activeTaskListTab, taskListTabOptions } = useTaskList()
</script>

<template>
  <n-space class="tabs">
    <n-tag
      v-for="option in taskListTabOptions"
      :key="option.key"
      class="tasklist-tag"
      :type="activeTaskListTab === option.key ? 'primary' : 'default'"
      @click="activeTaskListTab = option.key"
    >
      {{ option.label }}
      <template #icon>
        <n-icon>
          <List v-if="option.key === 'all'"></List>
          <DownloadOutline v-else-if="option.key === 'downloading'"></DownloadOutline>
          <TimeOutline v-else-if="option.key === 'waiting'"></TimeOutline>
          <FlagOutline v-else-if="option.key === 'completed'"></FlagOutline>
        </n-icon>
      </template>
    </n-tag>
  </n-space>
</template>

<style lang="less" scoped>
.tabs {
  .tasklist-tag {
    cursor: pointer;
    user-select: none;
  }
}
</style>
