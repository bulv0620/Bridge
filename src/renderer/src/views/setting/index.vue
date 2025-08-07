<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { languageOptions } from '@renderer/locales'
import { EThemeType, useTheme } from '@renderer/composables/setting/useTheme'
import { computed } from 'vue'
import { useDiscreteApi } from '@renderer/composables/discrete-api/useDiscreteApi'

defineOptions({
  name: 'Setting',
})

const { locale, t } = useI18n()
const { themeMode } = useTheme()
const { confirm } = useDiscreteApi()

const themeOptions = computed(() => [
  { label: t('theme.system'), value: 'system' },
  { label: t('theme.light'), value: 'light' },
  { label: t('theme.dark'), value: 'dark' },
])

const handleReset = async () => {
  await confirm('info', {
    title: t('common.info'),
    content: t('views.setting.resetConfirm'),
    positiveText: t('common.confirm'),
    negativeText: t('common.cancel'),
  })
  locale.value = 'en_US'
  themeMode.value = EThemeType.SYSTEM
}
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
        <n-button @click="handleReset"> {{ $t('views.setting.reset') }} </n-button>
      </n-flex>
    </n-form>
  </div>
</template>

<style lang="less" scoped>
.setting {
  padding: 18px;
}
</style>
