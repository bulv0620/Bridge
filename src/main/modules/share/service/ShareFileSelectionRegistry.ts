import { ipcMain } from 'electron'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { getWindow } from '../../../utils/window'

const MAX_FILES_PER_BATCH = 256
const SELECTION_TTL_MS = 30 * 60 * 1000

interface ShareFileRegistrationInput {
  path: string
  mime?: string
}

export interface RegisteredShareFile extends SelectedShareFile {
  path: string
  modifiedAt: number
}

interface RegisteredSelection {
  id: string
  files: RegisteredShareFile[]
  createdAt: number
}

class ShareFileSelectionRegistry {
  private selections = new Map<string, RegisteredSelection>()

  async register(input: unknown): Promise<ShareFileSelection> {
    this.cleanupExpired()

    if (!Array.isArray(input) || input.length < 1 || input.length > MAX_FILES_PER_BATCH) {
      throw new Error('INVALID_FILE_SELECTION')
    }

    const files = await Promise.all(input.map((item) => this.registerFile(item)))
    let totalSize = 0
    for (const file of files) {
      totalSize += file.size
      if (!Number.isSafeInteger(totalSize)) throw new Error('INVALID_FILE_SELECTION')
    }
    const selection: RegisteredSelection = {
      id: crypto.randomUUID(),
      files,
      createdAt: Date.now(),
    }
    this.selections.set(selection.id, selection)

    return this.toPublicSelection(selection)
  }

  release(selectionId: unknown) {
    if (typeof selectionId === 'string') this.selections.delete(selectionId)
  }

  consume(selectionId: unknown): RegisteredSelection {
    this.cleanupExpired()

    if (typeof selectionId !== 'string') throw new Error('SELECTION_EXPIRED')
    const selection = this.selections.get(selectionId)
    if (!selection) throw new Error('SELECTION_EXPIRED')

    this.selections.delete(selectionId)
    return selection
  }

  private async registerFile(input: unknown): Promise<RegisteredShareFile> {
    if (!this.isRegistrationInput(input)) throw new Error('INVALID_FILE_SELECTION')

    const realPath = await fs.promises.realpath(input.path)
    const stat = await fs.promises.stat(realPath)
    if (!stat.isFile() || !Number.isSafeInteger(stat.size) || stat.size < 0) {
      throw new Error('INVALID_FILE_SELECTION')
    }

    return {
      id: crypto.randomUUID(),
      path: realPath,
      filename: path.basename(realPath),
      size: stat.size,
      mime: this.normalizeMime(input.mime),
      modifiedAt: stat.mtimeMs,
    }
  }

  private isRegistrationInput(input: unknown): input is ShareFileRegistrationInput {
    if (!input || typeof input !== 'object') return false
    const candidate = input as Partial<ShareFileRegistrationInput>
    return typeof candidate.path === 'string' && candidate.path.length > 0
  }

  private normalizeMime(mime: unknown) {
    if (typeof mime !== 'string' || mime.length < 1 || mime.length > 255) return undefined
    if (this.hasControlCharacters(mime)) return undefined
    return mime
  }

  private hasControlCharacters(value: string) {
    return Array.from(value).some((character) => {
      const code = character.charCodeAt(0)
      return code <= 31 || code === 127
    })
  }

  private cleanupExpired() {
    const cutoff = Date.now() - SELECTION_TTL_MS
    for (const [id, selection] of this.selections) {
      if (selection.createdAt < cutoff) this.selections.delete(id)
    }
  }

  private toPublicSelection(selection: RegisteredSelection): ShareFileSelection {
    return {
      id: selection.id,
      files: selection.files.map(({ id, filename, size, mime }) => ({
        id,
        filename,
        size,
        mime,
      })),
      createdAt: selection.createdAt,
    }
  }
}

export const shareFileSelectionRegistry = new ShareFileSelectionRegistry()

export function registerShareFileSelectionBridge() {
  ipcMain.handle('share-files:register', async (event, input: unknown) => {
    const mainWindow = getWindow('main')
    if (!mainWindow || event.sender !== mainWindow.webContents) {
      throw new Error('INVALID_IPC_SENDER')
    }

    try {
      const selection = await shareFileSelectionRegistry.register(input)
      return {
        ok: true,
        selection,
      } satisfies ShareFileRegistrationResult
    } catch {
      return {
        ok: false,
        error: 'INVALID_FILE_SELECTION',
      } satisfies ShareFileRegistrationResult
    }
  })

  ipcMain.handle('share-files:release', (event, selectionId: unknown) => {
    const mainWindow = getWindow('main')
    if (!mainWindow || event.sender !== mainWindow.webContents) {
      throw new Error('INVALID_IPC_SENDER')
    }
    shareFileSelectionRegistry.release(selectionId)
  })
}
