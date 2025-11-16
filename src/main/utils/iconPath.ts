import path from 'path'

const devIconPath = path.join(process.cwd(), 'resources/icon.png')
const prodIconPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'resources/icon.png')
export const icon = process.env.NODE_ENV === 'development' ? devIconPath : prodIconPath

const devIconMacPath = path.join(process.cwd(), 'resources/icon_plain.png')
const prodIconMacPath = path.join(
  process.resourcesPath,
  'app.asar.unpacked',
  'resources/icon_plain.png',
)
export const iconMac = process.env.NODE_ENV === 'development' ? devIconMacPath : prodIconMacPath
