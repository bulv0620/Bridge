<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useMessage, useThemeVars } from 'naive-ui'
import { KeyboardDoubleArrowUpRound, DownloadingFilled, RefreshFilled } from '@vicons/material'
import { useI18n } from 'vue-i18n'

const themeColor = useThemeVars()
const message = useMessage()
const { t } = useI18n()

const version = ref('')
const newVersion = ref('')
const downloading = ref(false)
const checkLoading = ref(false)

async function getCurrentVersion() {
  version.value = await window.ipc.update.getCurrentVersion()
}

async function checkForUpdate() {
  if (checkLoading.value) return
  try {
    checkLoading.value = true
    const result = await window.ipc.update.check()

    if (result) {
      newVersion.value = result
      message.info(t('update.findNewVersion') + ' v' + result)
    } else {
      message.info(t('update.newVersionNotFound'))
    }
  } catch (error) {
    console.error(error)
  } finally {
    checkLoading.value = false
  }
}

async function downloadUpdate() {
  try {
    downloading.value = true
    await window.ipc.update.download()
  } catch (error) {
    console.error(error)
  } finally {
    downloading.value = false
  }
}

onMounted(() => {
  getCurrentVersion()
})
</script>

<template>
  <div class="version-box">
    <n-text>v{{ version }}</n-text>

    <n-popover v-if="!newVersion" trigger="hover">
      <template #trigger>
        <n-icon
          :class="{ rotate: checkLoading }"
          size="18"
          :color="themeColor.primaryColor"
          style="cursor: pointer"
          @click="checkForUpdate"
        >
          <RefreshFilled></RefreshFilled>
        </n-icon>
      </template>
      <div>{{ $t('update.checkForUpdate') }}</div>
    </n-popover>

    <n-popover v-if="newVersion && !downloading" trigger="hover">
      <template #trigger>
        <n-icon size="18" :color="themeColor.primaryColor">
          <KeyboardDoubleArrowUpRound></KeyboardDoubleArrowUpRound>
        </n-icon>
      </template>
      <div style="margin-bottom: 4px">{{ $t('update.findNewVersion') }} v{{ newVersion }}</div>
      <n-a style="font-size: 13px" @click="downloadUpdate">{{ $t('update.updateNow') }}</n-a>
    </n-popover>

    <n-popover v-if="downloading" trigger="hover">
      <template #trigger>
        <n-icon size="18" :color="themeColor.primaryColor">
          <DownloadingFilled></DownloadingFilled>
        </n-icon>
      </template>
      <div>{{ $t('update.downloading') }}</div>
    </n-popover>
  </div>
</template>

<style lang="less" scoped>
.version-box {
  padding: 16px;

  display: flex;
  align-items: center;
  gap: 6px;
}

.rotate {
  animation: spin 2s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
