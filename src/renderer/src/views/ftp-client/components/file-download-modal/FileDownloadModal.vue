<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

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
    :title="$t('views.ftpClient.downloadModalTitle')"
    :on-after-leave="handleNegative"
    :mask-closable="false"
  >
    download

    <template #footer>
      <n-flex>
        <n-button type="primary" size="small" :loading="loading" @click="handlePositive">
          {{ t('common.confirm') }}
        </n-button>
        <n-button size="small" @click="visible = false">
          {{ t('common.cancel') }}
        </n-button>
      </n-flex>
    </template>
  </n-modal>
</template>
