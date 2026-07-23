<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { languageOptions } from '@renderer/locales'
import { useTheme } from '@renderer/composables/setting/useTheme'
import { computed, ref } from 'vue'
import ThemeCardGroup from './components/ThemeCardGroup.vue'
import { ElMessageBox } from 'element-plus'
import { useLang } from '@renderer/composables/setting/useLang'
import { useRemoteRef } from '@renderer/composables/remote-ref/useRemoteRef'
import DiagnosticsSettings from './components/DiagnosticsSettings.vue'

defineOptions({
  name: 'Setting',
})

const { t } = useI18n()
const { themeMode } = useTheme()
const { currentLocale } = useLang()
const logLevel = useRemoteRef<LogLevel>('log-level', 'info')
const activeTab = ref('basic')

const themeOptions = computed(() => [
  { label: t('theme.system'), value: 'system' },
  { label: t('theme.light'), value: 'light' },
  { label: t('theme.dark'), value: 'dark' },
])

const handleReset = async () => {
  try {
    await ElMessageBox({
      type: 'warning',
      title: t('common.warning'),
      message: t('views.setting.resetConfirm'),
      showCancelButton: true,
    })
  } catch {
    return
  }
  currentLocale.value = 'en_US'
  themeMode.value = 'system'
  logLevel.value = 'info'
}
</script>

<template>
  <div class="setting">
    <div class="settings-body">
      <el-tabs v-model="activeTab" class="settings-tabs">
        <el-tab-pane :label="$t('views.setting.basicTab')" name="basic">
          <el-scrollbar class="tab-scroll">
            <el-form ref="formRef" class="settings-card" label-position="top">
              <section class="setting-section">
                <el-form-item :label="$t('views.setting.theme')">
                  <ThemeCardGroup v-model:value="themeMode" :options="themeOptions" />
                </el-form-item>
              </section>

              <section class="setting-section">
                <el-form-item :label="$t('views.setting.language')">
                  <el-radio-group v-model="currentLocale">
                    <el-radio
                      v-for="option in languageOptions"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </el-radio>
                  </el-radio-group>
                </el-form-item>
              </section>

              <footer class="setting-actions">
                <el-button @click="handleReset">
                  {{ $t('views.setting.reset') }}
                </el-button>
              </footer>
            </el-form>
          </el-scrollbar>
        </el-tab-pane>

        <el-tab-pane :label="$t('views.setting.logsTab')" name="logs">
          <el-scrollbar class="tab-scroll">
            <DiagnosticsSettings :active="activeTab === 'logs'" />
          </el-scrollbar>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<style lang="less" scoped>
.setting {
  height: 100%;
  padding: 0 var(--bridge-page-padding) var(--bridge-page-padding);
  display: flex;
  flex-direction: column;
  background: var(--bridge-surface);

  .settings-body {
    width: min(100%, 800px);
    flex: 1;
    min-height: 0;
    margin: 0 auto;
  }

  .settings-tabs {
    height: 100%;
    display: flex;
    flex-direction: column;

    :deep(.el-tabs__header) {
      flex: none;
      margin: 0 0 16px;
    }

    :deep(.el-tabs__nav-wrap::after) {
      height: 1px;
      background: var(--bridge-stroke);
    }

    :deep(.el-tabs__item) {
      height: 42px;
      padding: 0 22px;
      color: var(--el-text-color-secondary);
      font-weight: 500;
      transition:
        color var(--bridge-motion),
        background var(--bridge-motion);
    }

    :deep(.el-tabs__item:hover) {
      color: var(--el-text-color-primary);
    }

    :deep(.el-tabs__item.is-active) {
      color: var(--el-text-color-primary);
      font-weight: 600;
    }

    :deep(.el-tabs__active-bar) {
      height: 2px;
      border-radius: 999px;
    }

    :deep(.el-tabs__content) {
      flex: 1;
      min-height: 0;
    }

    :deep(.el-tab-pane) {
      height: 100%;
    }
  }

  .tab-scroll {
    height: 100%;
  }

  .settings-card {
    margin-bottom: 16px;
    padding: 24px;
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
    align-items: center;
    justify-content: flex-end;
    margin-top: 20px;
    padding-top: 20px;
    box-shadow: inset 0 1px 0 var(--bridge-stroke);
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
