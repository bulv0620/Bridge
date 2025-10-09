<script setup lang="ts">
import { CloudOfflineOutline } from '@vicons/ionicons5'
</script>

<template>
  <div class="empty-main">
    <n-empty :description="$t('views.shareHub.notEnabled')" size="huge">
      <template #icon>
        <n-icon>
          <CloudOfflineOutline />
        </n-icon>
      </template>
    </n-empty>
  </div>
</template>

<style lang="less" scoped>
.empty-main {
  flex: 1;
  overflow: auto;
  padding: 16px;
  position: relative;

  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
