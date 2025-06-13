<script setup lang="ts">
import { FormRules, NForm, useMessage } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { FtpFileSystem } from '@renderer/utils/file-system'

export interface FtpConfig {
  host: string
  port: number
  user: string
  password: string
}

const props = defineProps<{
  instanceList: string[]
}>()

const { t } = useI18n()
const message = useMessage()

let ftpInstance: FtpFileSystem | null = null

const loading = ref(false)
const visible = ref(false)

watch(visible, (val) => {
  if (!val && ftpInstance) {
    ftpInstance.disconnect()
  }
})

const formRef = ref<InstanceType<typeof NForm> | null>(null)
const resolveRef = ref<((value: any) => void) | null>(null)
const model = ref<FtpConfig>({
  host: '',
  port: 21,
  user: '',
  password: '',
})
const rules = computed<FormRules>(() => ({
  host: [
    {
      trigger: ['change'],
      validator(_, value) {
        if (!value) {
          return new Error(t('views.ftpClient.ftpHostRequired'))
        }
        const reg =
          /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
        if (!reg.test(value)) {
          return new Error(t('views.ftpClient.ftpHostFormat'))
        }
        return true
      },
    },
  ],
  port: [
    {
      type: 'number',
      min: 1,
      max: 65535,
      trigger: ['change'],
      message: t('views.ftpClient.ftpPortRange'),
    },
  ],
  user: [
    {
      required: true,
      trigger: ['change'],
      message: t('views.ftpClient.ftpUserRequired'),
    },
  ],
  password: [
    {
      required: true,
      trigger: ['change'],
      message: t('views.ftpClient.ftpPasswordRequired'),
    },
  ],
}))

const select = () => {
  return new Promise<any>((resolve) => {
    ftpInstance = null
    model.value = {
      host: '',
      port: 21,
      user: '',
      password: '',
    }
    visible.value = true
    resolveRef.value = resolve
  })
}

const handlePositive = async () => {
  await formRef.value?.validate()
  try {
    loading.value = true

    if (ftpInstance) {
      ftpInstance.disconnect()
    }
    ftpInstance = null

    if (
      props.instanceList.includes(`${model.value.host}:${model.value.port}(${model.value.user})`)
    ) {
      message.error(t('views.ftpClient.ftpInstanceExists'))
      return
    }

    ftpInstance = new FtpFileSystem(model.value)
    const bool = await ftpInstance.validate()
    if (!bool) {
      message.error(t('views.ftpClient.ftpConnFailed'))
      return
    }

    ftpInstance.disconnect()

    if (resolveRef.value) {
      resolveRef.value(ftpInstance)
      resolveRef.value = null
    }
    visible.value = false
  } catch (error) {
    // 连接失败
    console.error(error)
    message.error(t('views.ftpClient.ftpConnFailed'))
  } finally {
    loading.value = false
  }
}

const handleNegative = () => {
  if (resolveRef.value) {
    resolveRef.value(null)
    resolveRef.value = null
  }
  visible.value = false
}

defineExpose({
  select,
})
</script>

<template>
  <n-modal
    v-model:show="visible"
    :style="`width: 400px; max-width: 100%`"
    preset="card"
    :title="$t('views.ftpClient.ftpConfig')"
    :on-after-leave="handleNegative"
    :mask-closable="false"
  >
    <n-form
      ref="formRef"
      :model="model"
      :rules="rules"
      label-placement="left"
      label-width="86px"
      @submit.prevent
    >
      <n-form-item path="host" :label="$t('views.ftpClient.ftpHost')">
        <n-input v-model:value="model.host" placeholder="127.0.0.1" :disabled="loading" />
      </n-form-item>
      <n-form-item path="port" :label="$t('views.ftpClient.ftpPort')">
        <n-input-number v-model:value="model.port" style="width: 100%" :disabled="loading" />
      </n-form-item>
      <n-form-item path="user" :label="$t('views.ftpClient.ftpUser')">
        <n-input
          v-model:value="model.user"
          :placeholder="$t('views.ftpClient.ftpUser')"
          :disabled="loading"
        />
      </n-form-item>
      <n-form-item path="password" :label="$t('views.ftpClient.ftpPassword')">
        <n-input
          v-model:value="model.password"
          type="password"
          show-password-on="click"
          :placeholder="$t('views.ftpClient.ftpPassword')"
          :disabled="loading"
        />
      </n-form-item>
    </n-form>

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
