<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArchiveOutline } from '@vicons/ionicons5'

const { t } = useI18n()

const loading = ref(false)
const visible = ref(false)

function open() {
  visible.value = true
}

async function handlePositive() {
  visible.value = false
}

function handleNegative() {
  visible.value = false
}

defineExpose({
  open,
})
</script>

<template>
  <n-modal
    v-model:show="visible"
    :style="`width: 400px; max-width: 100%`"
    preset="card"
    :title="$t('views.ftpClient.uploadModalTitle')"
    :on-after-leave="handleNegative"
    :mask-closable="false"
  >
    <n-upload
      multiple
      directory-dnd
      action="https://www.mocky.io/v2/5e4bafc63100007100d8b70f"
      :max="5"
    >
      <n-upload-dragger>
        <div style="margin-bottom: 12px">
          <n-icon size="48" :depth="3">
            <ArchiveOutline />
          </n-icon>
        </div>
        <n-text style="font-size: 16px"> 点击或者拖动文件到该区域来上传 </n-text>
      </n-upload-dragger>
    </n-upload>
  </n-modal>
</template>
