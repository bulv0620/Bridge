<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import AppVersion from '@renderer/components/AppVersion.vue'
import { useSidebarCollapse } from '@renderer/composables/layout/useSidebarCollapse'

import { FolderOpened, Promotion, Setting } from '@element-plus/icons-vue'
import { CaretBack, CaretForward } from '@vicons/ionicons5'
import appIcon from '@renderer/assets/icon.png'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const { isSidebarCollapsed: collapsed } = useSidebarCollapse()
const isWindows = /Win/.test(navigator.platform)

const menu = computed(() => [
  {
    label: t('views.fileSync.title'),
    index: '/',
    icon: FolderOpened,
  },
  {
    label: t('views.sharedZone.title'),
    index: '/shared-zone',
    icon: Promotion,
  },
  {
    label: t('views.setting.title'),
    index: '/setting',
    icon: Setting,
  },
])

const handleSelect = (path: string) => {
  router.push(path)
}
</script>

<template>
  <div class="sidebar" :class="{ collapsed }">
    <div v-if="!isWindows" class="brand">
      <div class="brand-mark">
        <img :src="appIcon" alt="" />
      </div>
      <span class="brand-name">Bridge</span>
    </div>

    <el-menu :default-active="route.path" :collapse="collapsed" class="menu" @select="handleSelect">
      <el-menu-item v-for="item in menu" :key="item.index" :index="item.index">
        <el-icon><component :is="item.icon" /></el-icon>
        <span>{{ item.label }}</span>
      </el-menu-item>
    </el-menu>

    <div class="collapse-btn" :class="{ collapsed }">
      <AppVersion v-if="!collapsed" />
      <el-button circle text aria-label="Toggle sidebar" @click="collapsed = !collapsed">
        <template #icon>
          <CaretBack v-if="!collapsed" />
          <CaretForward v-else />
        </template>
      </el-button>
    </div>
  </div>
</template>

<style scoped lang="less">
.sidebar {
  width: 214px;
  height: 100%;
  background: transparent;
  position: relative;
  display: flex;
  flex-direction: column;
  transition: width var(--bridge-motion);
  overflow: hidden;

  &.collapsed {
    width: 62px;

    .brand {
      padding-inline: 0;
      justify-content: center;
      gap: 0;

      .brand-name {
        display: none;
      }
    }
  }

  .brand {
    height: 58px;
    padding: 0 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
    -webkit-app-region: drag;

    .brand-mark {
      width: 32px;
      height: 32px;
      flex: 0 0 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.72);
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.8);

      img {
        width: 25px;
        height: 25px;
        object-fit: contain;
      }
    }

    .brand-name {
      overflow: hidden;
      color: var(--el-text-color-primary);
      font-size: 15px;
      font-weight: 650;
      letter-spacing: -0.01em;
      white-space: nowrap;
    }
  }

  .menu {
    flex: 1;
    border-right: none;
  }

  .el-menu {
    background: transparent;
    border-right: none;
    padding: 8px 5px;

    .el-menu-item {
      height: 44px;
      margin: 4px 0;
      padding: 0 12px !important;
      border-radius: 11px;

      display: flex;
      align-items: center;
      gap: 10px;

      /* 默认字体 */
      color: var(--el-text-color-regular);
      font-size: 14px;
      transition:
        color var(--bridge-motion),
        background var(--bridge-motion);

      /* hover 效果 */
      &:hover {
        background: color-mix(in srgb, var(--bridge-surface) 62%, transparent);
        color: var(--el-text-color-primary);
      }

      /* 激活状态 */
      &.is-active {
        background: var(--bridge-surface);
        color: var(--el-color-primary);
        font-weight: 600;
        box-shadow:
          var(--bridge-shadow-sm),
          inset 0 0 0 1px var(--bridge-stroke);
      }

      /* 折叠状态下的图标居中 */
      .el-icon {
        font-size: 18px;
      }
    }

    /* 折叠后的菜单更紧凑 */
    &.el-menu--collapse {
      width: 100%;

      .el-menu-item {
        width: 100%;
        justify-content: center;
        margin: 4px 0;
        padding: 0 !important;

        span {
          display: none;
        }
      }
    }
  }

  .collapse-btn {
    min-height: 54px;
    color: var(--el-text-color-regular);
    padding: 6px 7px 6px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    overflow: hidden;

    &.collapsed {
      justify-content: center;
      padding: 6px;
    }

    :deep(.version-trigger) {
      color: var(--el-text-color-placeholder);
      font-size: 12px;
    }
  }
}

html.dark .brand-mark {
  background: rgba(255, 255, 255, 0.08) !important;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06) !important;
}

@media (max-width: 760px) {
  .sidebar {
    width: 58px;

    .brand {
      padding: 0 10px;

      .brand-name {
        display: none;
      }
    }

    .el-menu .el-menu-item {
      justify-content: center;
      padding: 0 !important;

      span {
        display: none;
      }
    }

    .collapse-btn {
      justify-content: center;
      padding: 6px;

      > :first-child:not(.el-button) {
        display: none;
      }
    }
  }
}
</style>
