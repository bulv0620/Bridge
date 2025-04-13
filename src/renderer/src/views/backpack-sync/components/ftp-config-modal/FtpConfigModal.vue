<script setup lang="ts">
import { FormRules } from 'naive-ui'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

export interface IFtpConfig {
  host: string
  port: number
  username: string
  password: string
}

const { t } = useI18n()

const visible = ref(false)
const resolveRef = ref<((value: any) => void) | null>(null)
const current = ref(1)
const currentStatus = ref('process')
const model = ref<IFtpConfig>({
  host: '',
  port: 21,
  username: '',
  password: '',
})
const rules: FormRules = {
  host: [
    {
      required: true,
      trigger: ['change'],
    },
  ],
  port: [
    {
      required: true,
      trigger: ['change'],
    },
  ],
  username: [
    {
      required: true,
      trigger: ['change'],
    },
  ],
  password: [
    {
      required: true,
      trigger: ['change'],
    },
  ],
}

const select = () => {
  return new Promise<any>((resolve) => {
    current.value = 1
    model.value = {
      host: '',
      port: 21,
      username: '',
      password: '',
    }
    visible.value = true
    resolveRef.value = resolve
  })
}

const handleNext = async () => {
  current.value = 2
}

const handlePrev = async () => {
  current.value = 1
}

const handlePositive = () => {
  if (resolveRef.value) {
    resolveRef.value('ok')
    resolveRef.value = null
  }
  visible.value = false
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
    :title="$t('views.backpack.ftpConfig')"
    :on-after-leave="handleNegative"
  >
    <n-steps :current="current" :status="currentStatus" size="small" style="margin-bottom: 24px">
      <n-step :title="$t('views.backpack.ftpConnInfo')" />
      <n-step :title="$t('views.backpack.ftpPathSelect')" />
    </n-steps>
    <n-form
      v-if="current === 1"
      ref="formRef"
      :model="model"
      :rules="rules"
      label-placement="left"
      label-width="86px"
    >
      <n-form-item path="host" :label="$t('views.backpack.ftpHost')">
        <n-input v-model:value="model.host" placeholder="127.0.0.1" @keydown.enter.prevent />
      </n-form-item>
      <n-form-item path="port" :label="$t('views.backpack.ftpPort')">
        <n-input v-model:value.number="model.port" type="number" @keydown.enter.prevent />
      </n-form-item>
      <n-form-item path="username" :label="$t('views.backpack.ftpUsername')">
        <n-input
          v-model:value="model.username"
          :placeholder="$t('views.backpack.ftpUsername')"
          @keydown.enter.prevent
        />
      </n-form-item>
      <n-form-item path="password" :label="$t('views.backpack.ftpPassword')">
        <n-input
          v-model:value="model.password"
          type="password"
          show-password-on="click"
          :placeholder="$t('views.backpack.ftpPassword')"
          @keydown.enter.prevent
        />
      </n-form-item>
    </n-form>
    <template #footer>
      <n-flex>
        <n-button v-if="current === 1" type="primary" size="small" @click="handleNext">
          {{ t('common.next') }}
        </n-button>
        <n-button v-if="current === 2" type="primary" size="small" @click="handlePrev">
          {{ t('common.prev') }}
        </n-button>
        <n-button v-if="current === 2" type="primary" size="small" @click="handlePositive">
          {{ t('common.confirm') }}
        </n-button>
        <n-button size="small" @click="visible = false">
          {{ t('common.cancel') }}
        </n-button>
      </n-flex>
    </template>
  </n-modal>
</template>
