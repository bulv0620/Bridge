<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import AppVersion from '@renderer/components/AppVersion.vue'

import {
  FolderOpened,
  UploadFilled,
  Download,
  Setting,
  Expand,
  Fold,
} from '@element-plus/icons-vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const collapsed = ref(false)

const menu = computed(() => [
  {
    label: t('views.fileSync.title'),
    index: '/',
    icon: FolderOpened,
  },
  {
    label: t('views.shareHub.title'),
    index: '/share-hub',
    icon: UploadFilled,
  },
  {
    label: t('views.downloader.title'),
    index: '/downloader',
    icon: Download,
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
    <!-- 侧边栏内容 -->
    <el-menu :default-active="route.path" :collapse="collapsed" class="menu" @select="handleSelect">
      <el-menu-item v-for="item in menu" :key="item.index" :index="item.index">
        <el-icon><component :is="item.icon" /></el-icon>
        <span>{{ item.label }}</span>
      </el-menu-item>
    </el-menu>

    <!-- 底部版本号、收起按钮 -->
    <div class="collapse-btn" :class="{ collapsed }">
      <AppVersion v-show="!collapsed" />
      <el-icon style="cursor: pointer" @click="collapsed = !collapsed"
        ><Fold v-if="!collapsed" /><Expand v-else
      /></el-icon>
    </div>
  </div>
</template>

<style scoped lang="less">
.sidebar {
  width: 200px;
  height: 100vh;
  background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color);
  position: relative;
  display: flex;
  flex-direction: column;
  transition: width 0.2s;
  overflow: hidden;

  &.collapsed {
    width: 64px;
  }

  .menu {
    flex: 1;
    border-right: none;
  }

  .el-menu {
    background: var(--el-bg-color);
    border-right: none;
    padding-top: 6px;

    .el-menu-item {
      height: 42px;
      margin: 6px;
      border-radius: 8px;

      display: flex;
      align-items: center;
      gap: 10px;

      /* 默认字体 */
      color: var(--el-text-color-regular);
      font-size: 14px;
      transition: all 0.2s;

      /* hover 效果 */
      &:hover {
        background: var(--el-fill-color-light);
        color: var(--el-color-primary);
      }

      /* 激活状态 */
      &.is-active {
        background: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
        font-weight: 500;
        position: relative;

        /* 左侧高亮条 */
        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 8px;
          bottom: 8px;
          width: 3px;
          background: var(--el-color-primary);
          border-radius: 0 3px 3px 0;
        }
      }

      /* 折叠状态下的图标居中 */
      .el-icon {
        font-size: 18px;
      }
    }

    /* 折叠后的菜单更紧凑 */
    &.el-menu--collapse {
      .el-menu-item {
        justify-content: center;
        margin: 6px 6px;
        padding: 0;

        span {
          display: none;
        }
      }
    }
  }

  .collapse-btn {
    height: 48px;
    color: var(--el-text-color-regular);
    padding: 0 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid var(--el-border-color);
    overflow: hidden;

    &.collapsed {
      justify-content: center;
    }
  }
}
</style>
