import { dialog } from 'electron'
import { getWindow } from '../../utils/window'

export async function selectFolder() {
  const mainWindow = getWindow('main')

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  })

  if (result.canceled) {
    return null
  } else {
    return result.filePaths[0] // 返回所选文件夹路径
  }
}
