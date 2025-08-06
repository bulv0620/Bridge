<script setup lang="ts">
import { Cloud } from '@vicons/ionicons5'
import { useFtpClient } from '@renderer/composables/ftp-client/useFtpClient'
import { useFtpConnectModal } from '@renderer/composables/ftp-client/useFtpConnectModal'

defineOptions({
  name: 'FtpClient',
})

const { instanceNameList, currentInstanceName, removeFtpInstance } = useFtpClient()
const { openFtpConnectModal } = useFtpConnectModal()
</script>

<template>
  <n-tabs
    v-model:value="currentInstanceName"
    type="card"
    closable
    addable
    tab-style="min-width: 80px;"
    size="small"
    class="custom-tabs"
    @close="removeFtpInstance"
    @add="openFtpConnectModal"
  >
    <n-tab-pane v-for="item in instanceNameList" :key="item" :name="item">
      <template #tab>
        <n-icon style="margin-right: 8px">
          <Cloud />
        </n-icon>
        <span>{{ item }}</span>
      </template>
    </n-tab-pane>
    <template #prefix> <span></span> </template>
    <template #suffix> <span></span> </template>
  </n-tabs>
</template>
