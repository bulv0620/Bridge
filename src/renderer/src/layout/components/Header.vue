<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Setting } from '@element-plus/icons-vue'
import { ClipboardOutline } from '@vicons/ionicons5'
import { useCollapse } from '@renderer/composables/share-zone/useCollapse'
import { useSettingModal } from '@renderer/composables/share-zone/useSettingModal'
import { useActiveSyncSession } from '@renderer/composables/file-sync/useActiveSyncSession'
import { useSidebarCollapse } from '@renderer/composables/layout/useSidebarCollapse'
import TabHeader from '@renderer/views/file-sync/components/tab-header/TabHeader.vue'
import appIcon from '@renderer/assets/icon.png'

const route = useRoute()
const { clipboardActive } = useCollapse()
const { openSettingModal } = useSettingModal()
const { sessions } = useActiveSyncSession()
const { isSidebarCollapsed } = useSidebarCollapse()

const isSharedZone = computed(() => route.path === '/shared-zone')
const showSessionTabs = computed(() => route.path === '/' && sessions.value.length > 0)
const isMacOS = /Mac/.test(navigator.platform)
const isWindows = /Win/.test(navigator.platform)
const isLinux = /Linux/.test(navigator.platform)
</script>

<template>
  <header
    class="window-titlebar"
    :class="{
      'is-mac': isMacOS,
      'is-windows': isWindows,
      'is-linux': isLinux,
      'is-sidebar-collapsed': isSidebarCollapsed,
    }"
  >
    <div class="titlebar-leading">
      <div v-if="isWindows" class="titlebar-brand">
        <span class="brand-mark">
          <img :src="appIcon" alt="" />
        </span>
        <span class="brand-name">Bridge</span>
      </div>
    </div>

    <TabHeader v-if="showSessionTabs" titlebar class="titlebar-session-tabs" />

    <div v-if="isSharedZone" class="titlebar-actions">
      <el-button
        circle
        text
        :class="{ active: clipboardActive }"
        :icon="ClipboardOutline"
        :title="
          $t(
            clipboardActive
              ? 'views.sharedZone.collapseClipboard'
              : 'views.sharedZone.expandClipboard',
          )
        "
        :aria-label="
          $t(
            clipboardActive
              ? 'views.sharedZone.collapseClipboard'
              : 'views.sharedZone.expandClipboard',
          )
        "
        :aria-pressed="clipboardActive"
        @click="clipboardActive = !clipboardActive"
      />
      <el-button
        circle
        text
        :icon="Setting"
        :title="$t('views.sharedZone.settingTitle')"
        :aria-label="$t('views.sharedZone.settingTitle')"
        @click="openSettingModal"
      />
    </div>
  </header>
</template>

<style lang="less" scoped>
.window-titlebar {
  --titlebar-leading-width: 234px;

  width: 100%;
  height: 38px;
  flex: 0 0 38px;
  padding: 0 10px 0 0;
  background: var(--bridge-app-bg);
  display: flex;
  align-items: center;
  -webkit-app-region: drag;
  user-select: none;

  &.is-windows,
  &.is-linux {
    padding-right: 148px;
  }

  &.is-sidebar-collapsed {
    --titlebar-leading-width: 82px;
  }

  .titlebar-leading {
    width: var(--titlebar-leading-width);
    height: 100%;
    padding-left: 12px;
    flex: 0 0 var(--titlebar-leading-width);
    display: flex;
    align-items: center;
    transition:
      width var(--bridge-motion),
      flex-basis var(--bridge-motion);
  }

  .titlebar-brand {
    min-width: 0;
    height: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    overflow: hidden;
    transition:
      gap var(--bridge-motion),
      transform var(--bridge-motion);

    .brand-mark {
      width: 26px;
      height: 26px;
      flex: 0 0 26px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.72);
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.8);

      img {
        width: 21px;
        height: 21px;
        object-fit: contain;
      }
    }

    .brand-name {
      max-width: 64px;
      overflow: hidden;
      color: var(--el-text-color-primary);
      font-size: 14px;
      font-weight: 650;
      letter-spacing: -0.01em;
      white-space: nowrap;
      opacity: 1;
      transition:
        max-width var(--bridge-motion),
        opacity var(--bridge-motion);
    }
  }

  &.is-windows.is-sidebar-collapsed .titlebar-brand {
    gap: 0;
    transform: translateX(16px);

    .brand-name {
      max-width: 0;
      opacity: 0;
    }
  }

  .titlebar-session-tabs {
    height: 100%;
    min-width: 0;
    flex: 1;
  }

  .titlebar-actions {
    height: 100%;
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 2px;
    -webkit-app-region: no-drag;

    :deep(.el-button) {
      width: 30px;
      height: 30px;
      min-width: 30px;
      min-height: 30px;
      margin: 0;
      border-radius: 8px;
      color: var(--el-text-color-secondary);

      &:hover,
      &.active {
        color: var(--el-text-color-primary);
        background: color-mix(in srgb, var(--bridge-surface) 74%, transparent);
      }

      &.active {
        color: var(--el-color-primary);
      }
    }
  }
}

html.dark .titlebar-brand .brand-mark {
  background: rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}
</style>
