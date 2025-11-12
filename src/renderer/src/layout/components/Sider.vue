<script setup lang="ts">
import type { MenuOption } from 'naive-ui'
import {
  FolderSwap20Regular,
  Settings20Regular,
  CloudArrowDown20Regular,
  BoxArrowLeft20Regular,
} from '@vicons/fluent'
import { NIcon } from 'naive-ui'
import { computed, h, ref } from 'vue'
import type { Component } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppVersion from '@renderer/components/AppVersion.vue'

const { t } = useI18n()

const collapsed = ref(false)

const renderIcon = (icon: Component) => {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const menuOptions = computed<MenuOption[]>(() => {
  return [
    {
      label: () =>
        h(
          RouterLink,
          {
            to: {
              path: '/',
            },
          },
          { default: () => t('views.fileSync.title') },
        ),
      key: '/',
      icon: renderIcon(FolderSwap20Regular),
    },
    {
      label: () =>
        h(
          RouterLink,
          {
            to: {
              path: '/share-hub',
            },
          },
          { default: () => t('views.shareHub.title') },
        ),
      key: '/share-hub',
      icon: renderIcon(BoxArrowLeft20Regular),
    },
    {
      label: () =>
        h(
          RouterLink,
          {
            to: {
              path: '/downloader',
            },
          },
          { default: () => t('views.downloader.title') },
        ),
      key: '/downloader',
      icon: renderIcon(CloudArrowDown20Regular),
    },
    {
      label: () =>
        h(
          RouterLink,
          {
            to: {
              path: '/setting',
            },
          },
          { default: () => t('views.setting.title') },
        ),
      key: '/setting',
      icon: renderIcon(Settings20Regular),
    },
  ]
})
</script>

<template>
  <n-layout-sider
    bordered
    collapse-mode="width"
    :collapsed-width="64"
    :width="200"
    :collapsed="collapsed"
    show-trigger
    :native-scrollbar="false"
    style="height: 100%"
    @collapse="collapsed = true"
    @expand="collapsed = false"
  >
    <div class="side-wrapper">
      <div class="menu-wrapper">
        <n-menu
          :options="menuOptions"
          :collapsed-width="64"
          :collapsed-icon-size="22"
          :default-active="$route.path"
          :value="$route.path"
        />
      </div>
      <div class="version-wrapper">
        <AppVersion v-show="!collapsed"></AppVersion>
      </div>
    </div>
  </n-layout-sider>
</template>

<style lang="less" scoped>
:deep(.n-scrollbar-content) {
  height: 100%;
}
.side-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;

  .menu-wrapper {
    flex: 1;
    overflow: hidden;
  }

  .version-wrapper {
    width: 100%;
  }
}
</style>
