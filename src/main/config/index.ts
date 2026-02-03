export async function initConfig() {
  // 动态导入所有配置模块
  await import('./localeConfig')
  await import('./themeConfig')
  await import('./deviceConfig')
  await import('./shareConfig')
}
