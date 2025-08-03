<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { List, DownloadOutline, TimeOutline, FlagOutline } from '@vicons/ionicons5'

const { t } = useI18n()

const activeTab = ref('downloading')
const tabOptions = computed(() => [
  { key: 'all', label: t('views.downloader.all') },
  { key: 'downloading', label: t('views.downloader.downloading') },
  { key: 'waiting', label: t('views.downloader.waiting') },
  { key: 'completed', label: t('views.downloader.completed') },
])

const columns = computed(() => [
  {
    type: 'selection',
  },
  { key: 'name', title: t('views.downloader.taskName'), width: '30%' },
  { key: 'status', title: t('views.downloader.taskStatus'), width: '20%' },
  { key: 'progress', title: t('views.downloader.taskProgress'), width: '50%' },
])

const data = []
</script>

<template>
  <div class="main">
    <n-space class="tabs">
      <n-tag
        v-for="option in tabOptions"
        :key="option.key"
        class="tasklist-tag"
        :type="activeTab === option.key ? 'primary' : 'default'"
        @click="activeTab = option.key"
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

    <div class="table">
      <n-data-table
        size="small"
        :columns="columns"
        :data="data"
        virtual-scroll
        flex-height
        style="height: 100%"
      />
    </div>
  </div>
</template>

<style lang="less" scoped>
.main {
  flex: 1;
  overflow: hidden;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  .tabs {
    .tasklist-tag {
      cursor: pointer;
      user-select: none;
    }
  }

  .table {
    flex: 1;
    overflow: hidden;
  }
}
</style>
