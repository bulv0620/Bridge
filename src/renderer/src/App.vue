<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useLang } from './composables/setting/useLang'
import layout from './layout/layout.vue'

const { elLocale } = useLang()
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
    <layout></layout>
  </el-config-provider>
</template>
