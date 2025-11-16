import { app, Menu } from 'electron'
import { messages } from '../locales'

export function createApplicationMenu() {
  const menu = Menu.buildFromTemplate([
    {
      label: 'Bridge',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: 'Quit Bridge',
          accelerator: 'Cmd+Q',
          click: () => app.quit(),
        },
      ],
    },
  ])
  Menu.setApplicationMenu(menu)
}

export function updateMenu(lang: string) {
  const menu = Menu.buildFromTemplate([
    {
      label: 'Bridge',
      submenu: [
        { label: messages[lang].menu.about, role: 'about' },
        { type: 'separator' },
        {
          label: messages[lang].menu.quit,
          accelerator: 'Cmd+Q',
          click: () => app.quit(),
        },
      ],
    },
  ])
  Menu.setApplicationMenu(menu)
}
