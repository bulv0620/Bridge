<template>
  <el-container class="app">
    <!-- Header -->
    <el-header class="header">
      <div class="logo">
        <span class="logo-text">Shared Zone</span>
      </div>
      <div class="header-right">
        <el-button :icon="Setting" circle />
      </div>
    </el-header>

    <!-- Main -->
    <el-main class="main">
      <div class="content">
        <!-- Upload -->
        <div class="upload">
          <el-upload
            class="upload-comp"
            drag
            :auto-upload="false"
            :show-file-list="false"
            :on-change="onFileChange"
          >
            <el-icon class="upload-icon"><UploadFilled /></el-icon>
            <div class="el-upload__text">点击或拖拽文件到此处</div>
          </el-upload>
          <div v-if="file" class="file-preview">已选择：{{ file.name }} ({{ fileSize }} MB)</div>
        </div>

        <!-- Devices -->
        <div class="devices">
          <div class="devices-header">
            <span>可发送的设备</span>
            <span class="online-dot" />
          </div>
          <el-scrollbar class="device-list">
            <div v-for="d in devices" :key="d.name" class="device-card" @click="sendTo(d)">
              <el-icon class="device-icon"><component :is="d.icon" /></el-icon>
              <div class="device-info">
                <div class="name">{{ d.name }}</div>
                <div class="status">192.168.1.105</div>
              </div>
            </div>
          </el-scrollbar>
        </div>
      </div>
    </el-main>

    <!-- Footer / Clipboard -->
    <el-footer class="footer">
      <div class="footer-header">
        <div class="title">共享剪切板</div>
        <el-button link size="small" @click="addDummy">模拟接收新内容</el-button>
      </div>
      <el-scrollbar class="clipboard">
        <div class="clipboard-list">
          <div v-for="(c, i) in clips" :key="i" class="clip">
            <p>{{ c.text }}</p>
            <div class="clip-footer">
              <span>{{ c.from }}</span>
              <el-button type="primary" link size="small" @click="copy(c.text)">复制</el-button>
            </div>
          </div>
        </div>
      </el-scrollbar>
    </el-footer>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, Iphone, Monitor, Setting } from '@element-plus/icons-vue'

const autoCopy = ref(false)
const file = ref<File | null>(null)

const devices = [
  { name: 'iPhone 15 Pro', icon: Iphone },
  { name: 'Windows PC - Home', icon: Monitor },
  { name: 'iPad Pro 12.9', icon: Iphone },
  { name: 'iPad Pro 12.9', icon: Iphone },
  { name: 'iPad Pro 12.9', icon: Iphone },
  { name: 'iPad Pro 12.9', icon: Iphone },
  { name: 'iPad Pro 12.9', icon: Iphone },
]

const clips = ref([
  { text: 'https://github.com/google-gemini/cloud-share-demo', from: '10:24 AM · 来自 MacBook' },
  {
    text: '项目会议纪要：1. 确定UI风格 2. 完成API联调 3. 准备灰度测试。',
    from: '昨天 · 来自 iPhone',
  },
])

const fileSize = computed(() => (file.value ? (file.value.size / 1024 / 1024).toFixed(2) : '0'))

function onFileChange(uploadFile: any) {
  file.value = uploadFile.raw
  ElMessage.success('文件已就绪，请选择目标设备')
}

function sendTo(device: any) {
  if (!file.value) {
    ElMessage.warning('请先选择要发送的文件')
    return
  }
  ElMessage.info(`正在向 ${device.name} 发送文件...`)
  setTimeout(() => {
    ElMessage.success('发送成功！')
    file.value = null
  }, 1500)
}

function copy(text: string) {
  navigator.clipboard.writeText(text)
  ElMessage.success('已成功复制内容')
}

function addDummy() {
  const texts = [
    '新的验证码是：882931',
    '请查收这份文档：https://docs.cloudshare.com/v/123',
    '今天的晚餐吃火锅吗？',
    'npm install lucide-react',
  ]
  const t = texts[Math.floor(Math.random() * texts.length)]
  clips.value.unshift({ text: t, from: '刚刚 · 来自 远端设备' })

  if (autoCopy.value) {
    navigator.clipboard.writeText(t)
    ElMessage.success('【自动复制】已捕获新内容')
  }
}
</script>

<style lang="less" scoped>
.app {
  height: 100%;
  background: var(--el-bg-color);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--el-border-color);

  .logo {
    display: flex;
    align-items: center;
    gap: 8px;

    .logo-text {
      font-size: 18px;
      font-weight: 600;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;

    .auto-copy {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }
  }
}

.main {
  padding: 16px;

  .content {
    display: flex;
    gap: 16px;
    height: 100%;
  }

  .upload {
    height: 100%;
    flex: 1;
    overflow: hidden;
    background: var(--el-bg-color);
    display: flex;
    flex-direction: column;

    .upload-comp {
      flex: 1;
      overflow: hidden;

      :deep(.el-upload) {
        height: 100%;
      }

      :deep(.el-upload-dragger) {
        height: 100%;
        padding: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
    }

    .upload-icon {
      font-size: 48px;
      color: var(--el-color-primary);
    }

    .file-preview {
      margin-top: 12px;
      color: var(--el-color-primary);
      font-weight: 500;
      font-size: 14px;
    }
  }

  .devices {
    width: 300px;
    background: var(--el-bg-color);
    border-radius: 12px;
    display: flex;
    flex-direction: column;

    .devices-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      font-weight: 600;
      font-size: 14px;

      .online-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--el-color-success);
      }
    }

    .device-list {
      flex: 1;
    }

    .device-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 10px;
      cursor: pointer;
      border: 1px solid var(--el-border-color-light);
      background: var(--el-fill-color-light);
      margin-bottom: 8px;
      transition: all 0.2s;

      &:hover {
        border-color: var(--el-color-primary-light-5);
        background: var(--el-color-primary-light-9);
      }

      .device-icon {
        font-size: 20px;
        color: var(--el-text-color-secondary);
      }

      .device-info {
        .name {
          font-size: 14px;
          font-weight: 500;
        }

        .status {
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }
      }
    }
  }
}

.footer {
  border-top: 1px solid var(--el-border-color);
  background: var(--el-bg-color-page);
  padding: 12px;
  padding-bottom: 16px;
  height: 180px;
  display: flex;
  flex-direction: column;

  .footer-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;

    .title {
      font-size: 14px;
      font-weight: 600;
    }
  }

  .clipboard {
    flex: 1;
    overflow: hidden;

    :deep(.el-scrollbar__view) {
      height: 100%;
    }

    .clipboard-list {
      display: flex;
      gap: 12px;
      height: 100%;
      width: fit-content;

      .clip {
        height: calc(100% - 26px);
        width: 260px;
        background: var(--el-bg-color);
        border: 1px solid var(--el-border-color-light);
        border-radius: 10px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;

        p {
          font-size: 14px;
          color: var(--el-text-color-regular);
          margin-bottom: 8px;
        }

        .clip-footer {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }
      }
    }
  }
}
</style>
