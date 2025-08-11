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
  <n-card class="plugin-item">
    <div class="plugin-item__info">
      <img class="icon" :src="getImgData(plugin.iconPath)" />
      <div class="text">
        <p class="title">
          {{ plugin.desc.title }}
        </p>
        <n-ellipsis
          :line-clamp="2"
          :tooltip="{ placement: 'bottom', width: 350 }"
          style="font-size: 12px; height: 42px"
        >
          {{ plugin.desc.summary }}
        </n-ellipsis>
      </div>
    </div>
    <n-divider style="margin: 12px 0" />
    <div class="plugin-item__option">
      <CommonButton
        v-if="running"
        :tooltip="$t('views.pluginCenter.stop')"
        :icon="Stop"
        :button-props="{
          size: 'small',
          circle: true,
          strong: true,
          secondary: true,
          type: 'error',
        }"
        placement="bottom"
        :delay="500"
        :loading="loading"
        :disabled="!isAvailable"
        @click="stopPlugin"
      />

      <CommonButton
        v-else
        :tooltip="$t('views.pluginCenter.run')"
        :icon="Play"
        :button-props="{
          size: 'small',
          circle: true,
          strong: true,
          secondary: true,
          type: 'success',
        }"
        placement="bottom"
        :delay="500"
        :loading="loading"
        :disabled="!isAvailable"
        @click="startPlugin"
      />

      <CommonButton
        :tooltip="$t('views.pluginCenter.config')"
        :icon="Settings"
        :button-props="{
          size: 'small',
          circle: true,
          strong: true,
          secondary: true,
          type: 'info',
        }"
        placement="bottom"
        :delay="500"
        :disabled="!isAvailable || !plugin.desc['configPath']"
        @click="showConfig"
      />

      <CommonButton
        :tooltip="$t('views.pluginCenter.viewLog')"
        :icon="DocumentText"
        :button-props="{
          size: 'small',
          circle: true,
          strong: true,
          secondary: true,
          type: 'warning',
        }"
        placement="bottom"
        :delay="500"
        :disabled="!isAvailable || !plugin.desc['logPath']"
        @click="showLog"
      />

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
  height: 160px;
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
