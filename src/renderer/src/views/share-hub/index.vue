<script setup lang="ts">
import ShareToolbar from './components/share-toolbar/ShareToolbar.vue'

defineOptions({
  name: 'ShareHub',
})
</script>

<template>
  <div class="shareHub">
    <div class="header">
      <ShareToolbar></ShareToolbar>
    </div>
    <n-divider style="margin: 0"></n-divider>
    <div class="main">main</div>
    <n-divider style="margin: 0"></n-divider>
    <div class="footer">footer</div>
  </div>
</template>

<style lang="less" scoped>
.shareHub {
  width: 100%;
  height: calc(100vh - 33px);
  display: flex;
  flex-direction: column;

  .header {
    padding: 16px;
    display: flex;
    justify-content: space-between;
  }

  .main {
    flex: 1;
    overflow: hidden;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .footer {
    padding: 16px;
    display: flex;
    gap: 8px;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
