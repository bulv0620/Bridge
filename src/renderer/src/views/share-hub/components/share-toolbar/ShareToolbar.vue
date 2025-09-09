<script setup lang="ts">
import { useSettingDrawer } from '@renderer/composables/share-hub/useSettingDrawer'

const { settingsForm } = useSettingDrawer()
</script>

<template>
  <n-form-item
    :label="$t('views.shareHub.enableSharing')"
    :show-feedback="false"
    label-placement="left"
    size="small"
  >
    <n-switch v-model:value="settingsForm.enableSharing" />
  </n-form-item>
  <n-form-item
    :label="$t('views.shareHub.showMyFiles')"
    :show-feedback="false"
    label-placement="left"
    size="small"
  >
    <n-switch v-model:value="settingsForm.showMyFiles" />
  </n-form-item>
</template>
