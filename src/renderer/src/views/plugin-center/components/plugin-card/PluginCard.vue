<script setup lang="ts">
import {
  PluginCardEmits,
  PluginCardProps,
  usePluginCard,
} from '@renderer/composables/plugin-center/usePluginCard'
import { Play, Settings, DocumentText, Stop } from '@vicons/ionicons5'

const props = defineProps<PluginCardProps>()

const emits = defineEmits<PluginCardEmits>()

const { loading, running, isAvailable, getImgData, startPlugin, stopPlugin, showLog, showConfig } =
  usePluginCard(props, emits)
</script>

<template>
  <n-card class="plugin-item" hoverable>
    <div class="plugin-item__info">
      <img class="icon" :src="getImgData(plugin.iconPath)" />
      <div class="text">
        <p class="title">
          {{ plugin.desc.title }}
        </p>
        <n-text depth="2" class="summary" :title="plugin.desc.summary">
          {{ plugin.desc.summary }}
        </n-text>
      </div>
    </div>
    <n-divider style="margin: 12px 0" />
    <div class="plugin-item__option">
      <n-tooltip v-if="running" trigger="hover" placement="bottom" :delay="500">
        <template #trigger>
          <n-button
            :loading="loading"
            strong
            secondary
            circle
            type="error"
            size="small"
            :disabled="!isAvailable"
            @click="stopPlugin"
          >
            <template #icon>
              <n-icon><Stop /></n-icon>
            </template>
          </n-button>
        </template>
        {{ $t('views.pluginCenter.stop') }}
      </n-tooltip>
      <n-tooltip v-else trigger="hover" placement="bottom" :delay="500">
        <template #trigger>
          <n-button
            :loading="loading"
            strong
            secondary
            circle
            type="success"
            size="small"
            :disabled="!isAvailable"
            @click="startPlugin"
          >
            <template #icon>
              <n-icon><Play /></n-icon>
            </template>
          </n-button>
        </template>
        {{ $t('views.pluginCenter.run') }}
      </n-tooltip>
      <n-tooltip trigger="hover" placement="bottom" :delay="500">
        <template #trigger>
          <n-button
            strong
            secondary
            circle
            type="info"
            size="small"
            :disabled="!isAvailable || !plugin.desc['configPath']"
            @click="showConfig"
          >
            <template #icon>
              <n-icon><Settings /></n-icon>
            </template>
          </n-button>
        </template>
        {{ $t('views.pluginCenter.config') }}
      </n-tooltip>
      <n-tooltip trigger="hover" placement="bottom" :delay="500">
        <template #trigger>
          <n-button
            strong
            secondary
            circle
            type="warning"
            size="small"
            :disabled="!isAvailable || !plugin.desc['logPath']"
            @click="showLog"
          >
            <template #icon>
              <n-icon><DocumentText /></n-icon>
            </template>
          </n-button>
        </template>
        {{ $t('views.pluginCenter.viewLog') }}
      </n-tooltip>

      <n-tag v-if="isAvailable" type="success" class="tag" size="small">
        {{ $t('views.pluginCenter.available') }}
      </n-tag>
      <n-tag v-else type="error" class="tag" size="small">
        {{ $t('views.pluginCenter.unavailable') }}
      </n-tag>
    </div>
  </n-card>
</template>

<style lang="less" scoped>
.plugin-item {
  width: 100%;
  height: 150px;
  border-radius: 3px;

  .plugin-item__info {
    display: flex;
    align-items: center;
    gap: 16px;

    .icon {
      width: 36px;
    }

    .text {
      overflow: hidden;
      flex: 1;
      width: 100%;

      .title {
        font-size: 14px;
        width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-bottom: 2px;
      }

      .summary {
        font-size: 12px;
        line-height: normal;
        display: -webkit-box;
        line-clamp: 2;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
        height: 32px;
      }
    }
  }

  .plugin-item__option {
    display: flex;
    gap: 12px;
    align-items: center;

    .tag {
      margin-left: auto;
    }
  }
}
</style>
