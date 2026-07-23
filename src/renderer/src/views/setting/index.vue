<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { languageOptions } from '@renderer/locales'
import { useTheme } from '@renderer/composables/setting/useTheme'
import { computed, ref } from 'vue'
import SegmentedControl from './components/SegmentedControl.vue'
import { ElMessageBox } from 'element-plus'
import { RefreshLeft } from '@element-plus/icons-vue'
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
            <div class="settings-card">
              <section class="setting-row">
                <span id="theme-label" class="row-label">{{ $t('views.setting.theme') }}</span>
                <SegmentedControl
                  v-model:value="themeMode"
                  :options="themeOptions"
                  labelledby="theme-label"
                />
              </section>

              <section class="setting-row">
                <span id="language-label" class="row-label">
                  {{ $t('views.setting.language') }}
                </span>
                <SegmentedControl
                  v-model:value="currentLocale"
                  :options="languageOptions"
                  labelledby="language-label"
                />
              </section>

              <footer class="setting-actions">
                <el-button :icon="RefreshLeft" @click="handleReset">
                  {{ $t('views.setting.reset') }}
                </el-button>
              </footer>
            </div>
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
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  background: var(--bridge-surface);

  .settings-body {
    width: 100%;
    flex: 1;
    min-height: 0;
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

  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .setting-row + .setting-row {
    margin-top: 20px;
    padding-top: 20px;
    box-shadow: inset 0 1px 0 var(--bridge-stroke);
  }

  .row-label {
    color: var(--el-text-color-primary);
    font-size: 13px;
    font-weight: 600;
  }

  .setting-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-top: 20px;
    padding-top: 20px;
    box-shadow: inset 0 1px 0 var(--bridge-stroke);
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
