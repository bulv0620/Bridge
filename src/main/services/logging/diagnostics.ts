import { app, dialog, shell } from 'electron'
import archiver from 'archiver'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { getStore } from '../../store'
import { getWindow } from '../../utils/window'
import { createLogger, getLogDirectory, getLogFiles, getLogLevel, getLogSize } from './index'
import { messages } from '../../locales'

const logger = createLogger('diagnostics')

function buildDiagnostics() {
  const store = getStore()
  const sessions = store.get('syncSessions')

  return {
    generatedAt: new Date().toISOString(),
    app: {
      version: app.getVersion(),
    },
    runtime: {
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      node: process.versions.node,
    },
    system: {
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
    },
    settings: {
      theme: store.get('theme'),
      locale: store.get('locale'),
      logLevel: getLogLevel(),
      lanDiscovery: store.get('lanDiscovery'),
      ports: store.get('ports'),
      capabilities: store.get('capabilities'),
      syncSessionCount: sessions.length,
      syncSessions: sessions.map((session) => ({
        sourceType: session.formData.sourceConfig?.storageType ?? null,
        destinationType: session.formData.destinationConfig?.storageType ?? null,
      })),
    },
  }
}

export function getDiagnosticsStatus(): DiagnosticsStatus {
  return {
    directory: getLogDirectory(),
    sizeBytes: getLogSize(),
  }
}

export async function openLogDirectory() {
  const errorMessage = await shell.openPath(getLogDirectory())
  if (errorMessage) throw new Error(errorMessage)
}

export async function exportDiagnostics(): Promise<DiagnosticsExportResult> {
  const defaultName = `Bridge-diagnostics-${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}.zip`
  const labels = messages[getStore().get('locale')].diagnostics
  const result = await dialog.showSaveDialog(getWindow('main')!, {
    title: labels.exportTitle,
    defaultPath: path.join(app.getPath('downloads'), defaultName),
    filters: [{ name: labels.zipArchive, extensions: ['zip'] }],
  })

  if (result.canceled || !result.filePath) return { cancelled: true }

  logger.info('diagnostics.export.started')

  try {
    await new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(result.filePath!)
      const archive = archiver('zip', { zlib: { level: 9 } })

      output.on('close', resolve)
      output.on('error', reject)
      archive.on('error', reject)
      archive.pipe(output)

      for (const filePath of getLogFiles()) {
        archive.file(filePath, { name: path.basename(filePath) })
      }
      archive.append(JSON.stringify(buildDiagnostics(), null, 2), {
        name: 'diagnostics.json',
      })
      void archive.finalize().catch(reject)
    })

    logger.info('diagnostics.export.completed')
    return { cancelled: false }
  } catch (error) {
    fs.rmSync(result.filePath, { force: true })
    logger.error('diagnostics.export.failed', error)
    throw error
  }
}
