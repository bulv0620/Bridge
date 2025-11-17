import { app, Menu, MenuItemConstructorOptions } from 'electron'
import { messages } from '../locales'

function buildMenuTemplate(lang: string): MenuItemConstructorOptions[] {
  const t = messages[lang].menu

  return [
    // APP MENU
    {
      label: 'Bridge',
      submenu: [
        { label: t.about, role: 'about' },
        { type: 'separator' },
        { label: t.quit, accelerator: 'Cmd+Q', click: () => app.quit() },
      ],
    },
    // EDIT MENU
    {
      label: t.edit.label,
      submenu: [
        { label: t.edit.undo, role: 'undo' },
        { label: t.edit.redo, role: 'redo' },
        { type: 'separator' },
        { label: t.edit.cut, role: 'cut' },
        { label: t.edit.copy, role: 'copy' },
        { label: t.edit.paste, role: 'paste' },
        { label: t.edit.selectAll, role: 'selectAll' },
      ],
    },
    // VIEW MENU
    {
      label: t.view.label,
      submenu: [
        { label: t.view.reload, role: 'reload' },
        { label: t.view.toggleFullscreen, role: 'togglefullscreen' },
        { label: t.view.devtools, role: 'toggleDevTools' },
      ],
    },
    // WINDOW MENU
    {
      label: t.window.label,
      submenu: [
        { label: t.window.minimize, role: 'minimize' },
        { label: t.window.close, role: 'close' },
      ],
    },
  ]
}

export function updateMenu(lang: string) {
  const menu = Menu.buildFromTemplate(buildMenuTemplate(lang))
  Menu.setApplicationMenu(menu)
}
