import { dialog, IpcMainInvokeEvent, shell } from 'electron'
import { getWindow } from '../../utils/window'
import fs from 'fs'
import { messages } from '../../locales'
import { locale } from '../../config'

export async function selectFolder() {
  const mainWindow = getWindow('main')

  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
  })

  if (result.canceled) {
    return null
  } else {
    return result.filePaths[0] // 返回所选文件夹路径
  }
}

export async function openFolder(_: IpcMainInvokeEvent, filename: string) {
  if (!fs.existsSync(filename)) {
    dialog.showErrorBox(messages[locale.value].file.fileNotExist, filename)
    return
  }

  shell.showItemInFolder(filename)
}
