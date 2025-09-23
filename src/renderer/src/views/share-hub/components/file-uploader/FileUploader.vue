<script setup lang="ts">
import { ArchiveOutline as ArchiveIcon } from '@vicons/ionicons5'
</script>

<template>
  <n-upload
    multiple
    directory-dnd
    action="https://www.mocky.io/v2/5e4bafc63100007100d8b70f"
    :max="5"
    :show-file-list="false"
  >
    <n-upload-dragger>
      <div style="margin-bottom: 12px">
        <n-icon size="48" :depth="3">
          <ArchiveIcon />
        </n-icon>
      </div>
      <n-text :depth="3" style="font-size: 16px"> {{ $t('views.shareHub.uploadTip') }} </n-text>
    </n-upload-dragger>
  </n-upload>
</template>
