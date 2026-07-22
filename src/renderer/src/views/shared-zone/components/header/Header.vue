<script setup lang="ts">
import { Setting } from '@element-plus/icons-vue'
import { useSettingModal } from '@renderer/composables/share-zone/useSettingModal'

const { openSettingModal } = useSettingModal()
</script>

<template>
  <el-header class="header">
    <div class="heading">
      <h1>{{ $t('views.sharedZone.title') }}</h1>
      <p>{{ $t('views.sharedZone.description') }}</p>
    </div>
    <div class="header-right">
      <el-button
        :icon="Setting"
        circle
        :title="$t('views.sharedZone.settingTitle')"
        :aria-label="$t('views.sharedZone.settingTitle')"
        @click="openSettingModal"
      />
    </div>
  </el-header>
</template>

<style lang="less" scoped>
.header {
  height: 72px;
  padding: 0 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  -webkit-app-region: drag;

  .heading {
    min-width: 0;

    h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 650;
      letter-spacing: -0.025em;
      line-height: 1.3;
    }

    p {
      margin: 3px 0 0;
      color: var(--el-text-color-secondary);
      font-size: 12px;
      line-height: 1.4;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;
    -webkit-app-region: no-drag;
  }
}

@media (max-width: 760px) {
  .header {
    height: 64px;
    padding-inline: 12px;

    .heading p {
      display: none;
    }
  }
}
</style>
