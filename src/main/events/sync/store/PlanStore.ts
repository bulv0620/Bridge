import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'

export class PlanStore {
  private db!: Database.Database

  async init(customPath?: string) {
    const dbPath = customPath ?? path.join(app.getPath('userData'), 'syncPlans.db')

    // 确保目录存在
    const dir = path.dirname(dbPath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    this.db = new Database(dbPath)

    // 建表
    this.db
      .prepare(
        `
        CREATE TABLE IF NOT EXISTS plans (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          sourceConfig TEXT,
          destinationConfig TEXT,
          ignoredFolders TEXT,
          syncStrategy TEXT NOT NULL,
          timestamp INTEGER NOT NULL
        )
      `,
      )
      .run()
  }

  async insert(plan: FileSyncPlan) {
    const id = plan.id ?? crypto.randomUUID()
    const timestamp = plan.timestamp ?? Date.now()

    this.db
      .prepare(
        `
        INSERT INTO plans (id, name, sourceConfig, destinationConfig, ignoredFolders, syncStrategy, timestamp)
        VALUES (@id, @name, @sourceConfig, @destinationConfig, @ignoredFolders, @syncStrategy, @timestamp)
      `,
      )
      .run({
        id,
        name: plan.name,
        sourceConfig: JSON.stringify(plan.sourceConfig ?? null),
        destinationConfig: JSON.stringify(plan.destinationConfig ?? null),
        ignoredFolders: JSON.stringify(plan.ignoredFolders ?? []),
        syncStrategy: plan.syncStrategy,
        timestamp,
      })
  }

  async update(plan: FileSyncPlan) {
    if (!plan.id) throw new Error('Plan must have an id to update')

    this.db
      .prepare(
        `
        UPDATE plans
        SET name=@name,
            sourceConfig=@sourceConfig,
            destinationConfig=@destinationConfig,
            ignoredFolders=@ignoredFolders,
            syncStrategy=@syncStrategy,
            timestamp=@timestamp
        WHERE id=@id
      `,
      )
      .run({
        id: plan.id,
        name: plan.name,
        sourceConfig: JSON.stringify(plan.sourceConfig ?? null),
        destinationConfig: JSON.stringify(plan.destinationConfig ?? null),
        ignoredFolders: JSON.stringify(plan.ignoredFolders ?? []),
        syncStrategy: plan.syncStrategy,
        timestamp: plan.timestamp ?? Date.now(),
      })
  }

  async remove(id: string) {
    this.db.prepare(`DELETE FROM plans WHERE id = ?`).run(id)
  }

  async getById(id: string): Promise<FileSyncPlan | undefined> {
    const row = this.db.prepare(`SELECT * FROM plans WHERE id = ?`).get(id) as any
    if (!row) return undefined

    return {
      id: row.id,
      name: row.name,
      sourceConfig: JSON.parse(row.sourceConfig),
      destinationConfig: JSON.parse(row.destinationConfig),
      ignoredFolders: JSON.parse(row.ignoredFolders),
      syncStrategy: row.syncStrategy,
      timestamp: row.timestamp,
    }
  }

  async getAll(): Promise<FileSyncPlan[]> {
    const rows = this.db.prepare(`SELECT * FROM plans ORDER BY timestamp DESC`).all()
    return rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      sourceConfig: JSON.parse(row.source),
      destinationConfig: JSON.parse(row.destination),
      ignoredFolders: JSON.parse(row.ignoredFolders),
      syncStrategy: row.syncStrategy,
      timestamp: row.timestamp,
    }))
  }
}
