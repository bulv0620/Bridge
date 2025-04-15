<script setup lang="ts">
import { EDiffAction } from '@renderer/utils/file-system'
import { ArrowBack, ArrowForward, Help, Remove } from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'
import { Component, computed, h } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{}>()

const typeMap = new Map<EDiffAction, string>([
  [EDiffAction.toRight, 'success'],
  [EDiffAction.toLeft, 'warning'],
  [EDiffAction.conflict, 'error'],
  [EDiffAction.ignore, 'info'],
])

const { t } = useI18n()

const action = defineModel<EDiffAction>('action')
const type = computed(() => {
  if (action.value) return typeMap.get(action.value)
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
  <n-dropdown :options="options" @select="handleSelect">
    <n-button strong secondary circle :type="type">
      <template #icon>
        <n-icon>
          <ArrowForward v-if="action === EDiffAction.toRight"></ArrowForward>
          <ArrowBack v-else-if="action === EDiffAction.toLeft"></ArrowBack>
          <Remove v-else-if="action === EDiffAction.ignore"></Remove>
          <Help v-else></Help>
        </n-icon>
      </template>
    </n-button>
  </n-dropdown>
</template>
