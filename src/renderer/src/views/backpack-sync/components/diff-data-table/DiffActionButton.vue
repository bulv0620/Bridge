<script setup lang="ts">
import { EDiffAction, EDiffStatus } from '@renderer/utils/file-system'
import { ArrowBack, ArrowForward, Help, Remove, Checkmark, Close } from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'
import { Component, computed, h } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  status: EDiffStatus
  processing: boolean
}>()

const typeMap = new Map<EDiffStatus, string>([
  [EDiffStatus.waiting, 'default'],
  [EDiffStatus.processing, 'info'],
  [EDiffStatus.success, 'success'],
  [EDiffStatus.error, 'error'],
])

const { t } = useI18n()

const action = defineModel<EDiffAction>('action')
const type = computed(() => {
  if (action.value) return typeMap.get(props.status)
  return ''
})

const renderIcon = (icon: Component) => {
  return () => {
    return h(NIcon, null, {
      default: () => h(icon),
    })
  }
}

const options = computed(() => [
  {
    label: t('views.backpack.toRight'),
    key: EDiffAction.toRight,
    icon: renderIcon(ArrowForward),
  },
  {
    label: t('views.backpack.toLeft'),
    key: EDiffAction.toLeft,
    icon: renderIcon(ArrowBack),
  },
  {
    label: t('views.backpack.ignore'),
    key: EDiffAction.ignore,
    icon: renderIcon(Remove),
  },
])

const handleSelect = (key: EDiffAction) => {
  action.value = key
}
</script>

<template>
  <n-dropdown
    :options="options"
    :disabled="status !== EDiffStatus.waiting || processing"
    @select="handleSelect"
  >
    <n-button strong secondary circle :type="type" :loading="status === EDiffStatus.processing">
      <template #icon>
        <n-icon v-if="status === EDiffStatus.success"> <Checkmark></Checkmark> </n-icon>
        <n-icon v-else-if="status === EDiffStatus.error"> <Close></Close> </n-icon>
        <n-icon v-else>
          <ArrowForward v-if="action === EDiffAction.toRight"></ArrowForward>
          <ArrowBack v-else-if="action === EDiffAction.toLeft"></ArrowBack>
          <Remove v-else-if="action === EDiffAction.ignore"></Remove>
          <Help v-else></Help>
        </n-icon>
      </template>
    </n-button>
  </n-dropdown>
</template>
