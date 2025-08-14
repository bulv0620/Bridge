import { IpcMainInvokeEvent, nativeTheme } from 'electron'

export function change(_: IpcMainInvokeEvent, type: 'light' | 'dark' | 'system') {
  nativeTheme.themeSource = type
}
