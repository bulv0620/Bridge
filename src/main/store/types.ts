export type ThemeMode = 'light' | 'dark' | 'system'

export interface AppStoreSchema {
  theme: ThemeMode
  locale: Locales
}
