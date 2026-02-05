import { initDeviceConfig } from './deviceConfig'
import { initLocleConfig } from './localeConfig'
import { initShareConfig } from './shareConfig'
import { initThemeConfig } from './themeConfig'

export function initAppConfig() {
  initLocleConfig()
  initThemeConfig()
  initDeviceConfig()
  initShareConfig()
}

export * from './deviceConfig'
export * from './localeConfig'
export * from './shareConfig'
export * from './themeConfig'
