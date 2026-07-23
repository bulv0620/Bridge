<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { languageOptions } from '@renderer/locales'
import { useTheme } from '@renderer/composables/setting/useTheme'
import { computed } from 'vue'
import ThemeCardGroup from './components/ThemeCardGroup.vue'
import { ElMessageBox } from 'element-plus'
import { useLang } from '@renderer/composables/setting/useLang'

defineOptions({
  name: 'Setting',
})

const { t } = useI18n()
const { themeMode } = useTheme()
const { currentLocale } = useLang()

const themeOptions = computed(() => [
  { label: t('theme.system'), value: 'system' },
  { label: t('theme.light'), value: 'light' },
  { label: t('theme.dark'), value: 'dark' },
])

const handleReset = async () => {
  await ElMessageBox({
    type: 'warning',
    title: t('common.warning'),
    message: t('views.setting.resetConfirm'),
    showCancelButton: true,
  })
  currentLocale.value = 'en_US'
  themeMode.value = 'system'
}
</script>

<template>
  <div class="setting">
    <header class="page-header">
      <h1>{{ $t('views.setting.title') }}</h1>
    </header>

    <el-scrollbar class="settings-scroll">
      <el-form ref="formRef" class="settings-card" label-position="top">
        <section class="setting-section">
          <el-form-item :label="$t('views.setting.theme')">
            <ThemeCardGroup v-model:value="themeMode" :options="themeOptions" />
          </el-form-item>
        </section>

        <section class="setting-section">
          <el-form-item :label="$t('views.setting.language')">
            <el-radio-group v-model="currentLocale">
              <el-radio v-for="option in languageOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </section>

        <div class="setting-actions">
          <el-button @click="handleReset"> {{ $t('views.setting.reset') }} </el-button>
        </div>
      </el-form>
    </el-scrollbar>
  </div>
</template>

<style lang="less" scoped>
.setting {
  height: 100%;
  padding: var(--bridge-page-padding);
  display: flex;
  flex-direction: column;
  background: var(--bridge-surface);

  .page-header {
    width: min(100%, 760px);
    margin: 0 auto 20px;

    h1 {
      font-size: 24px;
      line-height: 1.3;
      font-weight: 650;
      letter-spacing: -0.025em;
      color: var(--el-text-color-primary);
    }
  }

  .settings-scroll {
    width: min(100%, 760px);
    min-height: 0;
    flex: 1;
    margin: 0 auto;
  }

  .settings-card {
    padding: 22px;
    border-radius: var(--bridge-radius-lg);
    background: var(--bridge-surface-soft);
    box-shadow: inset 0 0 0 1px var(--bridge-stroke);
  }

  .setting-section + .setting-section {
    margin-top: 18px;
    padding-top: 18px;
    box-shadow: inset 0 1px 0 var(--bridge-stroke);
  }

  .setting-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 6px;
  }

  :deep(.el-form-item) {
    margin-bottom: 10px;
  }

  :deep(.el-form-item__label) {
    padding-bottom: 10px;
  }
}

@media (max-width: 760px) {
  .setting {
    .settings-card {
      padding: 16px;
    }
  }
}
</style>
