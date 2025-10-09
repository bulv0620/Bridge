import { useMessage } from 'naive-ui'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

export interface DownloaderOptions {
  fileId: string
  serverIp: string
  serverPort: number
  chunkSize?: number
  maxConcurrent?: number
  onFinish?: () => void
}

function parseFileName(contentDisposition: string | null) {
  if (!contentDisposition) return 'downloaded_file.bin'
  const match = contentDisposition.match(/filename\*=UTF-8''(.+)|filename="(.+)"/)
  if (match) {
    return decodeURIComponent(match[1] || match[2])
  }
  return 'downloaded_file.bin'
}

export function useDownloader(options: DownloaderOptions) {
  const message = useMessage()
  const { t } = useI18n()

  const {
    fileId,
    serverIp,
    serverPort,
    chunkSize = 50 * 1024 * 1024,
    maxConcurrent = 1,
    onFinish,
  } = options

  const progress = ref(0)
  let chunks: { start: number; end: number; index: number }[] = []
  let fileName = 'downloaded_file.bin'
  const downloadedChunks: Record<number, Blob> = {}
  const totalSize = ref(0)
  const paused = ref(false)
  const downloading = ref(false)
  const finished = ref(false)

  async function getFileSizeAndName() {
    const res = await fetch(`http://${serverIp}:${serverPort}/download/${fileId}`, {
      method: 'HEAD',
    })
    const size = res.headers.get('content-length')
    const disposition = res.headers.get('content-disposition')
    fileName = parseFileName(disposition)
    if (!size) {
      message.error(t('views.shareHub.getSizeFailed'))
      throw new Error('Unable to get file size')
    }
    return parseInt(size, 10)
  }

  async function downloadChunk(start: number, end: number, index: number) {
    if (downloadedChunks[index]) return downloadedChunks[index]
    const res = await fetch(`http://${serverIp}:${serverPort}download/${fileId}`, {
      headers: { Range: `bytes=${start}-${end}` },
    })
    if (!res.ok && res.status !== 206) {
      message.error(t('views.shareHub.chunkDownloadFailed'))
      throw new Error(`Unable to download chunk: ${res.status}`)
    }
    const reader = res.body!.getReader()
    const chunkArr: BlobPart[] = []
    let received = 0

    let result = await reader.read()
    while (!result.done) {
      if (paused.value) return null
      chunkArr.push(result.value as BlobPart)
      received += result.value!.length
      const currentDownloaded =
        Object.values(downloadedChunks).reduce((sum, b) => sum + b.size, 0) + received
      progress.value = Number(((currentDownloaded / totalSize.value) * 100).toFixed(2))

      result = await reader.read()
    }

    const blob = new Blob(chunkArr)
    downloadedChunks[index] = blob
    return blob
  }

  async function startDownload() {
    totalSize.value = await getFileSizeAndName()
    const totalChunks = Math.ceil(totalSize.value / chunkSize)
    chunks = []
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize
      const end = Math.min(start + chunkSize - 1, totalSize.value - 1)
      chunks.push({ start, end, index: i })
    }

    downloading.value = true
    paused.value = false

    const queue = [...chunks]

    async function next() {
      if (!downloading.value || paused.value) return Promise.resolve()
      if (queue.length === 0) return Promise.resolve()
      const { start, end, index } = queue.shift()!
      await downloadChunk(start, end, index)
      await next()
    }

    await Promise.all(Array.from({ length: maxConcurrent }, () => next()))

    // 合并 Blob 并使用自动获取的文件名
    const blobArr: Blob[] = []
    for (let i = 0; i < chunks.length; i++) {
      if (downloadedChunks[i]) blobArr.push(downloadedChunks[i])
    }
    const fullBlob = new Blob(blobArr, { type: 'application/octet-stream' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(fullBlob)
    a.download = fileName
    a.click()
    URL.revokeObjectURL(a.href)

    finished.value = true
    onFinish?.()
  }

  function pause() {
    paused.value = true
  }

  function resume() {
    if (!paused.value) return
    paused.value = false
    startDownload()
  }

  return {
    start: startDownload,
    pause,
    resume,
    progress,
    paused,
    downloading,
    finished,
    totalSize,
  }
}
