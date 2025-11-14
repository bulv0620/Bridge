<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Top, Loading } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const version = ref('')
const newVersion = ref('')
const downloading = ref(false)
const checkLoading = ref(false)

async function getCurrentVersion() {
  version.value = await window.ipc.update.getCurrentVersion()
}

async function checkForUpdate() {
  if (checkLoading.value) return
  try {
    checkLoading.value = true
    const result = await window.ipc.update.check()

    if (result) {
      newVersion.value = result
      ElMessage.success(t('update.findNewVersion') + ' v' + result)
    } else {
      newVersion.value = ''
      ElMessage.info(t('update.newVersionNotFound'))
    }
  } catch (err) {
    console.error(err)
  } finally {
    checkLoading.value = false
  }
}

async function downloadUpdate() {
  try {
    downloading.value = true
    await window.ipc.update.download()
  } catch (err) {
    console.error(err)
  } finally {
    downloading.value = false
  }
}

onMounted(getCurrentVersion)
</script>

<template>
  <div>
    <el-popover trigger="click" placement="top-start" width="200px">
      <template #reference>
        <span class="version-trigger"> v{{ version }} </span>
      </template>

      <div class="popover-content">
        <div class="row">
          <strong>{{ t('update.checkForUpdate') }}</strong>
        </div>

        <div v-if="!newVersion" class="row muted">
          {{ t('update.currentVersion') }}: v{{ version }}
        </div>

        <!-- 检查更新按钮 -->
        <el-button
          v-if="!newVersion"
          size="small"
          :loading="checkLoading"
          type="primary"
          :icon="Refresh"
          @click="checkForUpdate"
        >
          {{ t('update.checkForUpdate') }}
        </el-button>

        <!-- 新版本信息 -->
        <div v-if="newVersion && !downloading" class="row new-version">
          <el-icon><Top /></el-icon>
          <span>{{ t('update.findNewVersion') }} v{{ newVersion }}</span>
        </div>

        <!-- 点击下载 -->
        <el-button
          v-if="newVersion && !downloading"
          size="small"
          type="success"
          @click="downloadUpdate"
        >
          {{ t('update.updateNow') }}
        </el-button>

        <!-- 下载中 -->
        <div v-if="downloading" class="row downloading">
          <el-icon class="spin"><Loading /></el-icon>
          <span>{{ t('update.downloading') }}</span>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<style scoped lang="less">
.version-trigger {
  cursor: pointer;
  user-select: none;
}

.popover-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.muted {
  font-size: 13px;
  opacity: 0.7;
}

.new-version {
  font-size: 13px;
  color: var(--el-color-success);
}

.downloading {
  font-size: 13px;
  color: var(--el-color-primary);
}

.spin {
  animation: spin 1.2s linear infinite;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}
</style>
