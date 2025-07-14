<script setup lang="ts">
import { ref } from 'vue'
import { ArchiveOutline } from '@vicons/ionicons5'
import { UploadCustomRequestOptions } from 'naive-ui'
import { useFtp } from '@renderer/composables/ftp'

const emit = defineEmits(['upload-finished'])

const stream = window.api.stream

const { currentInstance, currentInstancePath } = useFtp()

const visible = ref(false)

function open() {
  visible.value = true
}

function handleNegative() {
  visible.value = false
}

async function customRequest({ file, onFinish, onError }: UploadCustomRequestOptions) {
  try {
    const arrayBuffer = await file.file!.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const fileStrem = stream.Readable.from(buffer)
    const remotePath = `${currentInstancePath.value.join('/')}/${file.file!.name}`
    await currentInstance.value?.writeFileStream(remotePath, fileStrem)
    onFinish()
    emit('upload-finished')
    visible.value = false
  } catch (error) {
    console.log(error)
    onError()
  }
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
    :title="$t('views.ftpClient.upload')"
    :on-after-leave="handleNegative"
    :mask-closable="false"
  >
    <n-upload :custom-request="customRequest" :max="1">
      <n-upload-dragger>
        <div style="margin-bottom: 12px">
          <n-icon size="48" :depth="3">
            <ArchiveOutline />
          </n-icon>
        </div>
        <n-text style="font-size: 16px"> {{ $t('views.ftpClient.uploadTip') }} </n-text>
      </n-upload-dragger>
    </n-upload>
  </n-modal>
</template>
