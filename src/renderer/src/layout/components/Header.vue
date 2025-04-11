<script setup lang="ts">
import { useTheme } from '@renderer/composables/theme'

const { currentTheme } = useTheme()
</script>

<template>
  <div class="header" :class="currentTheme"></div>
</template>

<style lang="less" scoped>
.header {
  height: 32px;
  line-height: 32px;
  text-align: center;
  -webkit-app-region: drag;
  transition: 0.3s;

  &.light {
    background-color: #eee;
    border-bottom: 1px solid #ebeef5;
  }

  &.dark {
    background-color: rgb(24, 24, 28);
    border-bottom: 1px solid rgba(255, 255, 255, 0.09);
  }

  .buttons {
    -webkit-app-region: no-drag;
  }
}
</style>
