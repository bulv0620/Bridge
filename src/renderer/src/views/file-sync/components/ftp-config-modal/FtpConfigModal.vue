<script setup lang="ts">
import { FormRules, NForm, TreeOption, useMessage } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { FtpFileSystem } from '@renderer/utils/file-system'
import { FolderInfo } from '../folder-selection-input/FolderSelectionInput.vue'

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

watch(visible, (val) => {
  if (!val && ftpInstance) {
    ftpInstance.disconnect()
  }
})

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
const rules = computed<FormRules>(() => ({
  host: [
    {
      trigger: ['change'],
      validator(_, value) {
        if (!value) {
          return new Error(t('views.fileSync.ftpHostRequired'))
        }
        const reg =
          /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
        if (!reg.test(value)) {
          return new Error(t('views.fileSync.ftpHostFormat'))
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
      message: t('views.fileSync.ftpPortRange'),
    },
  ],
  user: [
    {
      required: true,
      trigger: ['change'],
      message: t('views.fileSync.ftpUserRequired'),
    },
  ],
  password: [
    {
      required: true,
      trigger: ['change'],
      message: t('views.fileSync.ftpPasswordRequired'),
    },
  ],
}))

const folderTree = ref<TreeOption[]>([
  {
    label: '/(root)',
    key: '/',
    isLeaf: false,
    children: [],
  },
])
const currentPath = ref<string[]>([])

async function handleLoad(node: TreeOption) {
  const folderList = await ftpInstance?.getFolder(node.key as string)
  node.children = folderList?.map((label) => ({
    label: label,
    key: `${node.key}/${label}`,
    isLeaf: false,
  }))

  ftpInstance?.disconnect()
}

function select(initVal: FolderInfo) {
  return new Promise<any>((resolve) => {
    ftpInstance = null
    current.value = 1
    model.value = {
      host: '',
      port: 21,
      user: '',
      password: '',
    }
    visible.value = true
    resolveRef.value = resolve

    if (initVal.type && initVal.type === 'ftp' && initVal.ftpConfig) {
      model.value.host = initVal.ftpConfig.host
      model.value.port = initVal.ftpConfig.port
      model.value.user = initVal.ftpConfig.user
      model.value.password = initVal.ftpConfig.password

      handleNext()
    }
  })
}

async function handleNext() {
  await formRef.value?.validate()
  try {
    loading.value = true

    if (ftpInstance) {
      ftpInstance.disconnect()
    }
    ftpInstance = null

    ftpInstance = new FtpFileSystem(model.value)
    const bool = await ftpInstance.validate()
    if (!bool) {
      message.error(t('views.fileSync.ftpConnFailed'))
      return
    }

    current.value = 2

    const folderList = await ftpInstance.getFolder()

    folderTree.value[0].children = folderList.map((label) => ({
      key: `/${label}`,
      label,
      isLeaf: false,
    }))
    currentPath.value = []

    ftpInstance.disconnect()
  } catch (error) {
    // 连接失败
    console.error(error)
    message.error(t('views.fileSync.ftpConnFailed'))
  } finally {
    loading.value = false
  }
}

async function handlePrev() {
  current.value = 1
}

function handlePositive() {
  if (resolveRef.value) {
    resolveRef.value({
      ftpConfig: model.value,
      path: currentPath.value[0] || '/',
      type: 'ftp',
    })
    resolveRef.value = null
  }
  visible.value = false
}

function handleNegative() {
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
    :title="$t('views.fileSync.ftpConfig')"
    :on-after-leave="handleNegative"
    :mask-closable="false"
  >
    <n-steps :current="current" :status="currentStatus" size="small" style="margin-bottom: 24px">
      <n-step :title="$t('views.fileSync.ftpConnInfo')" />
      <n-step :title="$t('views.fileSync.ftpPathSelect')" />
    </n-steps>
    <n-form
      v-if="current === 1"
      ref="formRef"
      :model="model"
      :rules="rules"
      label-placement="left"
      label-width="90px"
      @submit.prevent
    >
      <n-form-item path="host" :label="$t('views.fileSync.ftpHost')">
        <n-input v-model:value="model.host" placeholder="127.0.0.1" :disabled="loading" />
      </n-form-item>
      <n-form-item path="port" :label="$t('views.fileSync.ftpPort')">
        <n-input-number v-model:value="model.port" style="width: 100%" :disabled="loading" />
      </n-form-item>
      <n-form-item path="user" :label="$t('views.fileSync.ftpUser')">
        <n-input
          v-model:value="model.user"
          :placeholder="$t('views.fileSync.ftpUser')"
          :disabled="loading"
        />
      </n-form-item>
      <n-form-item path="password" :label="$t('views.fileSync.ftpPassword')">
        <n-input
          v-model:value="model.password"
          type="password"
          show-password-on="click"
          :placeholder="$t('views.fileSync.ftpPassword')"
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
          :default-expanded-keys="['/']"
        />
      </n-scrollbar>
      <n-form-item
        style="margin-top: 18px"
        :label="$t('views.fileSync.currentPath')"
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
