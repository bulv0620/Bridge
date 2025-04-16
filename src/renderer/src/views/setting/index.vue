<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { languageOptions } from '@renderer/locales'
import { useTheme } from '@renderer/composables/theme'
import { computed } from 'vue'

defineOptions({
  name: 'Setting',
})

const { locale, t } = useI18n()
const { themeMode } = useTheme()

const themeOptions = computed(() => [
  { label: t('theme.system'), value: 'system' },
  { label: t('theme.light'), value: 'light' },
  { label: t('theme.dark'), value: 'dark' },
])
</script>

<template>
  <div class="setting">
    <n-form ref="formRef" label-placement="top" label-width="auto">
      <n-form-item :label="$t('views.setting.language') + ':'">
        <n-radio-group v-model:value="locale">
          <n-radio v-for="option in languageOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </n-radio>
        </n-radio-group>
      </n-form-item>
      <n-form-item :label="$t('views.setting.theme') + ':'">
        <n-radio-group v-model:value="themeMode">
          <n-radio v-for="option in themeOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </n-radio>
        </n-radio-group>
      </n-form-item>
      <n-flex>
        <n-button type="primary"> {{ $t('views.setting.save') }} </n-button>
        <n-button> {{ $t('views.setting.reset') }} </n-button>
      </n-flex>
    </n-form>
  </div>
</template>

<style lang="less" scoped>
.setting {
  padding: 18px;
}
</style>
