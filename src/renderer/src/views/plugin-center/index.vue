<script setup lang="ts">
import { Search, Refresh } from '@vicons/ionicons5'
import PluginCard from './components/plugin-card/PluginCard.vue'
import ConfigModal from './components/config-modal/ConfigModal.vue'
import { usePluginList } from '@renderer/composables/plugin-center/usePluginList'
import { onActivated } from 'vue'

defineOptions({
  name: 'PluginCenter',
})

const { loading, filterText, filteredPlugins, refreshPluginList, openLogModal, openConfigModal } =
  usePluginList()

onActivated(() => {
  refreshPluginList()
})
</script>

<template>
  <div class="plugin-center">
    <div class="top">
      <n-input
        v-model:value="filterText"
        style="width: 200px"
        type="text"
        :placeholder="$t('views.pluginCenter.searchPlaceholder')"
      >
        <template #suffix>
          <n-icon :component="Search" />
        </template>
      </n-input>

      <n-button circle :loading="loading" @click="refreshPluginList">
        <template #icon>
          <n-icon><Refresh /></n-icon>
        </template>
      </n-button>
    </div>

    <n-scrollbar style="height: 100% - 34px">
      <n-grid
        v-if="filteredPlugins.length > 0"
        :x-gap="12"
        :y-gap="8"
        cols="1 s:2 m:3 xl:4"
        responsive="screen"
      >
        <n-grid-item v-for="(plugin, index) in filteredPlugins" :key="index">
          <PluginCard :plugin="plugin" @log="openLogModal" @config="openConfigModal"></PluginCard>
        </n-grid-item>
      </n-grid>

      <n-empty v-else class="empty" :description="$t('views.pluginCenter.emptyText')"> </n-empty>
    </n-scrollbar>
    <ConfigModal></ConfigModal>
  </div>
</template>

<style scoped lang="less">
.plugin-center {
  padding: 18px;
  height: calc(100vh - 69px);
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;

  .top {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .empty {
    position: absolute;
    left: 50%;
    top: 35%;
    transform: translateX(-50%);
  }
}
</style>
