<script setup lang="ts">
import { Setting } from '@element-plus/icons-vue'
import { useSettingModal } from '@renderer/composables/share-zone/useSettingModal'

const { openSettingModal } = useSettingModal()
</script>

<template>
  <el-header class="header">
    <div class="logo">
      <span class="logo-text">{{ $t('views.sharedZone.title') }}</span>
    </div>
    <div class="header-right">
      <el-button :icon="Setting" circle @click="openSettingModal" />
    </div>
  </el-header>
</template>

<style lang="less" scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--el-border-color);

  .logo {
    display: flex;
    align-items: center;
    gap: 8px;

    .logo-text {
      font-size: 18px;
      font-weight: 600;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }
}
</style>
