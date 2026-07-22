<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Expand, Fold, Setting } from '@element-plus/icons-vue'
import { useCollapse } from '@renderer/composables/share-zone/useCollapse'
import { useSettingModal } from '@renderer/composables/share-zone/useSettingModal'

const route = useRoute()
const { clipboardActive } = useCollapse()
const { openSettingModal } = useSettingModal()

const isSharedZone = computed(() => route.path === '/shared-zone')
const isMacOS = /Mac/.test(navigator.platform)
</script>

<template>
  <header class="window-titlebar" :class="{ 'is-mac': isMacOS }">
    <div v-if="isSharedZone" class="titlebar-actions">
      <el-button
        circle
        text
        :class="{ active: clipboardActive }"
        :icon="clipboardActive ? Fold : Expand"
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
  width: 100%;
  height: 38px;
  flex: 0 0 38px;
  padding: 0 148px 0 76px;
  background: var(--bridge-app-bg);
  display: flex;
  justify-content: flex-end;
  align-items: center;
  -webkit-app-region: drag;
  user-select: none;

  &.is-mac {
    padding-right: 10px;
  }

  .titlebar-actions {
    height: 100%;
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
</style>
