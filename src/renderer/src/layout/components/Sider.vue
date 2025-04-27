<script setup lang="ts">
import type { MenuOption } from 'naive-ui'
import { SyncAltOutlined, FolderCopyOutlined, DisplaySettingsFilled } from '@vicons/material'
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
      icon: renderIcon(SyncAltOutlined),
    },
    {
      label: () =>
        h(
          RouterLink,
          {
            to: {
              path: '/tico-share',
            },
          },
          { default: () => t('views.fileShare.title') },
        ),
      key: '/tico-share',
      icon: renderIcon(FolderCopyOutlined),
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
      icon: renderIcon(DisplaySettingsFilled),
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
