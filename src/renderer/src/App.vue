<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useLang } from './composables/lang'
import { useTheme } from './composables/theme'
import layout from './layout/layout.vue'

const ipcRenderer = window.electron.ipcRenderer

const { themeConfig } = useTheme()
const { naiveLocale, naiveDateLocale } = useLang()
const router = useRouter()

ipcRenderer.on('clipboard-magnet', (_event, url) => {
  router.push({
    name: 'downloader',
    query: {
      url,
    },
  })
})
</script>

<template>
  <n-config-provider :theme="themeConfig" :locale="naiveLocale" :date-locale="naiveDateLocale">
    <n-message-provider placement="bottom-right">
      <n-dialog-provider>
        <layout></layout>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>
