import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'

export class PlanStore {
  private db!: Database.Database

  init(customPath?: string) {
    // 默认存储在 electron 的 userData 目录
    const dbPath = customPath ?? path.join(app.getPath('userData'), 'syncPlans.db')

    // 确保目录存在
    const dir = path.dirname(dbPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    this.db = new Database(dbPath)

    // 建表
    this.db
      .prepare(
        `CREATE TABLE IF NOT EXISTS plans (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          source TEXT NOT NULL,
          target TEXT NOT NULL,
          timestamp INTEGER NOT NULL
        )`,
      )
      .run()
  }

  async insert(plan: FileSyncPlan): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO plans (id, name, source, target, timestamp)
         VALUES (@id, @name, @source, @target, @timestamp)`,
      )
      .run(plan)
  }

  async update(plan: FileSyncPlan): Promise<void> {
    this.db
      .prepare(
        `UPDATE plans
         SET name=@name, source=@source, target=@target, timestamp=@timestamp
         WHERE id=@id`,
      )
      .run(plan)
  }

  async remove(id: string): Promise<void> {
    this.db.prepare(`DELETE FROM plans WHERE id = ?`).run(id)
  }

  async getById(id: string): Promise<FileSyncPlan | undefined> {
    const row = this.db.prepare(`SELECT * FROM plans WHERE id = ?`).get(id)
    if (!row) return undefined
    return row as FileSyncPlan // 类型断言
  }

  async getAll(): Promise<FileSyncPlan[]> {
    const rows = this.db.prepare(`SELECT * FROM plans ORDER BY timestamp DESC`).all()
    return rows as FileSyncPlan[] // 类型断言
  }
}
