<script setup lang="ts">
import ShareToolbar from './components/share-toolbar/ShareToolbar.vue'
import { useSettingForm } from '@renderer/composables/share-hub/useSettingForm'
import NotEnabledWrapper from './components/not-enabled-wrapper/NotEnabledWrapper.vue'
import { ArchiveOutline as ArchiveIcon } from '@vicons/ionicons5'

defineOptions({
  name: 'ShareHub',
})

const { enableSharing } = useSettingForm()
</script>

<template>
  <div id="share-hub-drawer-target" class="shareHub">
    <div class="header">
      <ShareToolbar></ShareToolbar>
    </div>
    <n-divider style="margin: 0"></n-divider>

    <div v-if="enableSharing" class="main">
      <div class="left">
        <n-upload
          multiple
          directory-dnd
          action="https://www.mocky.io/v2/5e4bafc63100007100d8b70f"
          :max="5"
          :show-file-list="false"
        >
          <n-upload-dragger>
            <div style="margin-bottom: 12px">
              <n-icon size="48" :depth="3">
                <ArchiveIcon />
              </n-icon>
            </div>
            <n-text style="font-size: 16px"> 点击或者拖动文件到该区域来上传 </n-text>
          </n-upload-dragger>
        </n-upload>
        <n-card title="已共享文件" class="my-shared-list" size="small">
          <div class="my-shared-list__content">
            <n-empty class="empty" description="No File"></n-empty>
          </div>
        </n-card>
      </div>
      <div class="right">
        <n-card title="共享文件" class="shared-list" size="small">
          <div class="shared-list__content">
            <n-empty class="empty" description="No File"></n-empty>
          </div>
        </n-card>
      </div>
    </div>
    <NotEnabledWrapper v-else> </NotEnabledWrapper>
  </div>
</template>

<style lang="less" scoped>
.shareHub {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;

  .header {
    padding: 16px;
    display: flex;
    justify-content: space-between;
  }

  .main {
    padding: 16px;
    flex: 1;
    overflow: hidden;
    display: flex;
    gap: 16px;

    .left {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 16px;

      .my-shared-list {
        flex: 1;
        overflow: hidden;

        &__content {
          height: 100%;
          position: relative;

          .empty {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
          }
        }
      }
    }

    .right {
      flex: 1;
      overflow: hidden;

      .shared-list {
        height: 100%;

        &__content {
          height: 100%;
          position: relative;

          .empty {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
          }
        }
      }
    }
  }
}
</style>
