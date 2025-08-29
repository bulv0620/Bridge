<script setup lang="ts">
import CodeEditor from '@renderer/components/CodeEditor.vue'
import { usePluginConfigModal } from '@renderer/composables/plugin-center/usePluginConfigModal'

const { loading, visible, language, configJson, saveConfig, closeModal } = usePluginConfigModal()
</script>

<template>
  <n-modal
    v-model:show="visible"
    style="width: 620px"
    preset="card"
    size="small"
    :title="$t('views.pluginCenter.config')"
    :on-after-leave="closeModal"
    :mask-closable="false"
  >
    <CodeEditor v-model:value="configJson" :language="language" height="320px"></CodeEditor>
    <template #footer>
      <n-flex>
        <n-button size="small" type="primary" :loading="loading" @click="saveConfig">
          {{ $t('common.confirm') }}
        </n-button>
        <n-button size="small" @click="visible = false">
          {{ $t('common.cancel') }}
        </n-button>
      </n-flex>
    </template>
  </n-modal>
</template>
