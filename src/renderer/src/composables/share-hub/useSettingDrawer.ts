import { reactive, ref } from 'vue'

const showSettingDrawer = ref(false)
const settingsForm = reactive({
  enableSharing: false,
  showMyFiles: false,
})

function openSettingDrawer() {
  showSettingDrawer.value = true
}

export function useSettingDrawer() {
  return {
    showSettingDrawer,
    settingsForm,
    openSettingDrawer,
  }
}
