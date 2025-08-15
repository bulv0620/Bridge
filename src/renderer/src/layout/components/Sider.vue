<script setup lang="ts">
import type { MenuOption } from 'naive-ui'
import {
  FolderSwap20Regular,
  AppsAddIn20Regular,
  Settings20Regular,
  CloudArrowDown20Regular,
  FolderGlobe20Regular,
  BoxArrowLeft20Regular,
} from '@vicons/fluent'
import { NIcon } from 'naive-ui'
import { computed, h, ref } from 'vue'
import type { Component } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

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
              path: '/v2',
            },
          },
          { default: () => t('views.fileSyncV2.title') },
        ),
      key: '/v2',
      icon: renderIcon(FolderSwap20Regular),
    },
    {
      label: () =>
        h(
          RouterLink,
          {
            to: {
              path: '/ftp-client',
            },
          },
          { default: () => t('views.ftpClient.title') },
        ),
      key: '/ftp-client',
      icon: renderIcon(FolderGlobe20Regular),
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
              path: '/plugin-center',
            },
          },
          { default: () => t('views.pluginCenter.title') },
        ),
      key: '/plugin-center',
      icon: renderIcon(AppsAddIn20Regular),
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
    <n-menu
      :options="menuOptions"
      :collapsed-width="64"
      :collapsed-icon-size="22"
      :default-active="$route.path"
      :value="$route.path"
    />
  </n-layout-sider>
</template>

<style lang="less" scoped></style>
