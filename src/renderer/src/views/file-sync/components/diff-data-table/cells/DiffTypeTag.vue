<script setup lang="ts">
import { EDiffType } from '@renderer/composables/file-sync/useSyncTool'
import { computed } from 'vue'

const props = defineProps<{
  diffType: EDiffType
}>()

const map = new Map<EDiffType, string>([
  [EDiffType.onlySource, 'success'],
  [EDiffType.onlyTarget, 'warning'],
  [EDiffType.conflict, 'error'],
])

const type = computed(() => map.get(props.diffType))
</script>

<template>
  <n-tag :type="type">{{ $t(`views.fileSync.${diffType}`) }}</n-tag>
</template>
