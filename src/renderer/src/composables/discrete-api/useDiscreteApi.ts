import { computed } from 'vue'
import { useTheme } from '../setting/useTheme'
import {
  ConfigProviderProps,
  createDiscreteApi,
  darkTheme,
  DialogOptions,
  lightTheme,
} from 'naive-ui'

const { currentTheme } = useTheme()

const configProviderPropsRef = computed<ConfigProviderProps>(() => ({
  theme: currentTheme.value === 'light' ? lightTheme : darkTheme,
}))

const { message, notification, dialog, loadingBar, modal } = createDiscreteApi(
  ['message', 'dialog', 'notification', 'loadingBar', 'modal'],
  {
    configProviderProps: configProviderPropsRef,
  },
)

function confirm(type: 'info' | 'error' | 'success' | 'warning', options: DialogOptions) {
  const confirmDialog = dialog[type]
  return new Promise<void>((resolve, reject) => {
    confirmDialog({
      ...options,
      onPositiveClick: () => {
        resolve()
      },
      onNegativeClick: () => {
        reject()
      },
    })
  })
}

export function useDiscreteApi() {
  return {
    message,
    notification,
    dialog,
    loadingBar,
    modal,
    confirm,
  }
}
