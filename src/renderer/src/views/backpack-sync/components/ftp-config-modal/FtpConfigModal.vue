<script setup lang="ts">
import { FormRules, NForm, TreeOption, useMessage } from 'naive-ui'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { FtpFileSystem } from '@renderer/utils/file-system'

export interface FtpConfig {
  host: string
  port: number
  user: string
  password: string
}

const { t } = useI18n()
const message = useMessage()

let ftpInstance: FtpFileSystem | null = null

const loading = ref(false)
const visible = ref(false)
const formRef = ref<InstanceType<typeof NForm> | null>(null)
const resolveRef = ref<((value: any) => void) | null>(null)
const current = ref(1)
const currentStatus = ref('process')
const model = ref<FtpConfig>({
  host: '',
  port: 21,
  user: '',
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
      type: 'number',
      min: 1,
      max: 65535,
      trigger: ['change'],
    },
  ],
  user: [
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

const folderTree = ref<TreeOption[]>([])
const currentPath = ref<string[]>([])

const handleLoad = async (node: TreeOption) => {
  const folderList = await ftpInstance?.getFolder(node.key as string)
  node.children = folderList?.map((label) => ({
    label: label,
    key: `${node.key}/${label}`,
    isLeaf: false,
  }))

  ftpInstance?.disconnect()
}

const select = () => {
  return new Promise<any>((resolve) => {
    current.value = 1
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

const handleNext = async () => {
  try {
    loading.value = true
    await formRef.value?.validate()

    ftpInstance = new FtpFileSystem(model.value)
    const bool = await ftpInstance.validate()
    if (!bool) {
      message.error(t('views.backpack.ftpConnFailed'))
      return
    }

    current.value = 2

    const folderList = await ftpInstance.getFolder()

    folderTree.value = folderList.map((label) => ({
      key: `/${label}`,
      label,
      isLeaf: false,
    }))
    currentPath.value = []

    ftpInstance.disconnect()
  } catch (error) {
    // 连接失败
    console.error(error)
  } finally {
    loading.value = false
  }
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
      @submit.prevent
    >
      <n-form-item path="host" :label="$t('views.backpack.ftpHost')">
        <n-input v-model:value="model.host" placeholder="127.0.0.1" :disabled="loading" />
      </n-form-item>
      <n-form-item path="port" :label="$t('views.backpack.ftpPort')">
        <n-input-number v-model:value="model.port" style="width: 100%" :disabled="loading" />
      </n-form-item>
      <n-form-item path="user" :label="$t('views.backpack.ftpUser')">
        <n-input
          v-model:value="model.user"
          :placeholder="$t('views.backpack.ftpUser')"
          :disabled="loading"
        />
      </n-form-item>
      <n-form-item path="password" :label="$t('views.backpack.ftpPassword')">
        <n-input
          v-model:value="model.password"
          type="password"
          show-password-on="click"
          :placeholder="$t('views.backpack.ftpPassword')"
          :disabled="loading"
        />
      </n-form-item>
    </n-form>
    <div v-else>
      <n-scrollbar style="max-height: 200px; margin-top: 18px" trigger="none">
        <n-tree
          v-model:selected-keys="currentPath"
          block-line
          :data="folderTree"
          selectable
          :on-load="handleLoad"
        />
      </n-scrollbar>
      <n-form-item
        style="margin-top: 18px"
        :label="$t('views.backpack.currentPath')"
        label-placement="left"
      >
        <n-input :value="currentPath[0] || '/'" readonly />
      </n-form-item>
    </div>

    <template #footer>
      <n-flex>
        <n-button
          v-if="current === 1"
          type="primary"
          size="small"
          :loading="loading"
          @click="handleNext"
        >
          {{ t('common.next') }}
        </n-button>
        <n-button
          v-if="current === 2"
          type="primary"
          size="small"
          :loading="loading"
          @click="handlePrev"
        >
          {{ t('common.prev') }}
        </n-button>
        <n-button
          v-if="current === 2"
          type="primary"
          size="small"
          :loading="loading"
          @click="handlePositive"
        >
          {{ t('common.confirm') }}
        </n-button>
        <n-button size="small" @click="visible = false">
          {{ t('common.cancel') }}
        </n-button>
      </n-flex>
    </template>
  </n-modal>
</template>
