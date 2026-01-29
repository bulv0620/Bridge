export type ThemeMode = 'light' | 'dark' | 'system'

export interface AppStoreSchema {
  theme: {
    mode: ThemeMode
  }
}
