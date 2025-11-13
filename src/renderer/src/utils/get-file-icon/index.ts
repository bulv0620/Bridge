import {
  Folder,
  Image,
  Videocam,
  MusicalNotes,
  CodeSlash,
  DocumentText,
  Document,
} from '@vicons/ionicons5'

/**
 * 获取文件图标信息
 * @param fileName 文件名
 * @param fileType 文件类型（可选，优先级高于后缀判断）
 * @param isDirectory 是否为文件夹
 */
export function getFileIcon(fileName: string, fileType?: string, isDirectory?: boolean) {
  if (isDirectory) {
    return { icon: Folder, color: '#f9a825' } // amber
  }

  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  const type = fileType || ''

  // --- MIME 优先判断 ---
  if (type.startsWith('image/')) return { icon: Image, color: '#42a5f5' }
  if (type.startsWith('video/')) return { icon: Videocam, color: '#ab47bc' }
  if (type.startsWith('audio/')) return { icon: MusicalNotes, color: '#ef5350' }

  // --- 按扩展名判断 ---
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) {
    return { icon: Image, color: '#42a5f5' }
  }

  if (['mp4', 'mkv', 'mov', 'avi', 'webm'].includes(ext)) {
    return { icon: Videocam, color: '#ab47bc' }
  }

  if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) {
    return { icon: MusicalNotes, color: '#ef5350' }
  }

  if (['js', 'ts', 'vue', 'json', 'html', 'css', 'py', 'java', 'cpp'].includes(ext)) {
    return { icon: CodeSlash, color: '#26a69a' }
  }

  if (['txt', 'md', 'log', 'doc', 'docx', 'pdf'].includes(ext)) {
    return { icon: DocumentText, color: '#5c6bc0' }
  }

  // --- 兜底 ---
  return { icon: Document, color: '#9e9e9e' }
}
