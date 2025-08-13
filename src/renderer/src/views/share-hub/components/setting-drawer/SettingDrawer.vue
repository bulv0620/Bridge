<script setup lang="ts">
import { useSettingDrawer } from '@renderer/composables/share-hub/useSettingDrawer'

const { showSettingDrawer, settingsForm } = useSettingDrawer()
</script>

<template>
  <n-drawer
    v-model:show="showSettingDrawer"
    :width="260"
    placement="right"
    :trap-focus="false"
    :block-scroll="false"
    to="#share-hub-drawer-target"
  >
    <n-drawer-content :title="$t('views.shareHub.settingTitle')" :closable="true">
      <n-scrollbar style="height: 100%; width: calc(100% - 18px); padding-right: 18px">
        <n-form label-placement="left" label-width="120">
          <n-form-item :label="$t('views.shareHub.enableSharing')">
            <n-switch v-model:value="settingsForm.enableSharing" />
          </n-form-item>
          <n-form-item :label="$t('views.shareHub.showMyFiles')">
            <n-switch v-model:value="settingsForm.showMyFiles" />
          </n-form-item>
        </n-form>
      </n-scrollbar>
    </n-drawer-content>
  </n-drawer>
</template>

<style scoped></style>
