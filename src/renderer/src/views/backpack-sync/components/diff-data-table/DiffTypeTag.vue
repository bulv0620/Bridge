<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  diffType: 'onlySource' | 'onlyTarget' | 'conflict'
}>()

const map = {
  onlySource: 'success',
  onlyTarget: 'warning',
  conflict: 'error',
}

const type = computed(() => map[props.diffType])
</script>

<template>
  <n-tag :type="type">{{ $t(`views.backpack.${diffType}`) }}</n-tag>
</template>
