import { app, protocol } from 'electron'
import fs from 'fs'
import path from 'path'

export function registerClipboardProtocol() {
  const rootDir = path.resolve(app.getPath('userData'), 'clipboard')

  protocol.handle('clipboard', async (request) => {
    try {
      const url = new URL(request.url)

      // URL pathname → 文件路径
      let filePath = decodeURIComponent(url.pathname)

      // Windows: /C:/xxx → C:/xxx
      if (process.platform === 'win32' && filePath.startsWith('/')) {
        filePath = filePath.slice(1)
      }

      const resolvedPath = path.resolve(filePath)

      if (!resolvedPath.startsWith(rootDir + path.sep)) {
        return new Response('Forbidden', { status: 403 })
      }

      if (!fs.existsSync(resolvedPath)) {
        return new Response('Not Found', { status: 404 })
      }

      const buffer = await fs.promises.readFile(resolvedPath)
      const ext = path.extname(resolvedPath).slice(1).toLowerCase()

      return new Response(new Uint8Array(buffer), {
        headers: {
          'Content-Type': getMime(ext),
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    } catch (e) {
      console.error('[clipboard protocol]', e)
      return new Response('Bad Request', { status: 400 })
    }
  })
}

function getMime(ext: string) {
  switch (ext) {
    case 'png':
      return 'image/png'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    default:
      return 'application/octet-stream'
  }
}
