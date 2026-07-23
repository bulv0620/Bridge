import { initDeviceConfig } from './deviceConfig'
import { initLogConfig } from './logConfig'
import { initLocleConfig } from './localeConfig'
import { initShareConfig } from './shareConfig'
import { initThemeConfig } from './themeConfig'

export function initAppConfig() {
  initLogConfig()
  initLocleConfig()
  initThemeConfig()
  initDeviceConfig()
  initShareConfig()
}

export * from './deviceConfig'
export * from './logConfig'
export * from './localeConfig'
export * from './shareConfig'
export * from './themeConfig'
