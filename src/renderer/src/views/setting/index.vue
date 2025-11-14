<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { languageOptions } from '@renderer/locales'
import { EThemeType, useTheme } from '@renderer/composables/setting/useTheme'
import { computed } from 'vue'
import { useDiscreteApi } from '@renderer/composables/discrete-api/useDiscreteApi'
import ThemeCardGroup from './components/ThemeCardGroup.vue'

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
    <el-form ref="formRef" label-position="top">
      <el-form-item :label="$t('views.setting.theme') + ':'">
        <ThemeCardGroup v-model:value="themeMode" :options="themeOptions" />
      </el-form-item>
      <el-form-item :label="$t('views.setting.language') + ':'">
        <el-radio-group v-model="locale">
          <el-radio v-for="option in languageOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-button @click="handleReset"> {{ $t('views.setting.reset') }} </el-button>
    </el-form>
  </div>
</template>

<style lang="less" scoped>
.setting {
  padding: 18px;
}
</style>
