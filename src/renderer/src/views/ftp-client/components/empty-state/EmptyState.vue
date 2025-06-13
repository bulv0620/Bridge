<script setup lang="ts">
import { ArrowDown } from '@vicons/ionicons5'
</script>

<template>
  <div class="empty-state">
    <n-empty :description="$t('views.ftpClient.emptyDesc')">
      <template #icon>
        <n-icon>
          <ArrowDown />
        </n-icon>
      </template>
      <template #extra>
        <n-button size="small" @click="$emit('add')"> {{ $t('views.ftpClient.create') }} </n-button>
      </template>
    </n-empty>
  </div>
</template>

<style lang="less" scoped>
.empty-state {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
