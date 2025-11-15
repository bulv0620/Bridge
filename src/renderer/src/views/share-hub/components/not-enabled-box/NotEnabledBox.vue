<script setup lang="ts">
import { CloudOfflineOutline } from '@vicons/ionicons5'
</script>

<template>
  <div class="empty-main">
    <el-empty :description="$t('views.shareHub.notEnabled')">
      <template #image>
        <el-icon :size="60">
          <CloudOfflineOutline />
        </el-icon>
      </template>
    </el-empty>
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
