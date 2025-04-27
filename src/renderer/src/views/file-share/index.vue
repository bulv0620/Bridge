<script setup lang="ts">
defineOptions({
  name: 'FileShare',
})
</script>

<template>
  <div class="file-share">{{ $t('views.fileShare.title') }}</div>
</template>

<style lang="less" scoped>
.file-share {
  padding: 18px;
  height: calc(100vh - 69px);
}
</style>
