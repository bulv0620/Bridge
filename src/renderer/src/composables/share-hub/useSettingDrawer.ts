import { reactive } from 'vue'

const settingsForm = reactive({
  enableSharing: false,
  showMyFiles: false,
})

export function useSettingDrawer() {
  return {
    settingsForm,
  }
}
