<script setup lang="ts">
import { useLang } from './composables/lang'
import { useTheme } from './composables/theme'
import layout from './layout/layout.vue'

const { themeConfig } = useTheme()
const { naiveLocale, naiveDateLocale } = useLang()
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
