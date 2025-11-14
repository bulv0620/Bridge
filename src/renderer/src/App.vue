<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useLang } from './composables/setting/useLang'
import { useTheme } from './composables/setting/useTheme'
import layout from './layout/layout.vue'

const { themeConfig } = useTheme()
const { naiveLocale, naiveDateLocale, elLocale } = useLang()
const router = useRouter()

window.events.on('page:link', (data: HrefToPageParam) => {
  router.push({
    name: data.to,
    query: data.query,
  })
})
</script>

<template>
  <el-config-provider :locale="elLocale">
    <n-config-provider :theme="themeConfig" :locale="naiveLocale" :date-locale="naiveDateLocale">
      <n-message-provider>
        <n-dialog-provider>
          <layout></layout>
        </n-dialog-provider>
      </n-message-provider>
    </n-config-provider>
  </el-config-provider>
</template>
