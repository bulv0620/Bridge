<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useLang } from './composables/setting/useLang'
import { useTheme } from './composables/setting/useTheme'
import layout from './layout/layout.vue'

const ipcRenderer = window.electron.ipcRenderer

const { themeConfig } = useTheme()
const { naiveLocale, naiveDateLocale } = useLang()
const router = useRouter()

ipcRenderer.on('href-to-page', (_event, data: HrefToPageParam) => {
  router.push({
    name: data.to,
    query: data.query,
  })
})
</script>

<template>
  <n-config-provider :theme="themeConfig" :locale="naiveLocale" :date-locale="naiveDateLocale">
    <n-message-provider>
      <n-dialog-provider>
        <layout></layout>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>
