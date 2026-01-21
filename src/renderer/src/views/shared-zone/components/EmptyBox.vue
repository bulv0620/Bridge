<script setup lang="ts">
import { Wifi } from '@vicons/ionicons5'

defineProps<{
  description: string
}>()
</script>

<template>
  <div class="empty-main">
    <el-empty :description="description">
      <template #image>
        <el-icon :size="60">
          <Wifi />
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
