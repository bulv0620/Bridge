import sqlite3 from 'sqlite3'
import { open, Database } from 'sqlite'
import { app } from 'electron'

export class PlanStore {
  private db!: Database<sqlite3.Database, sqlite3.Statement>

  async init() {
    const dbPath = app.getPath('userData') + '/syncPlans.db'
    this.db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    await this.db.run(`
      CREATE TABLE IF NOT EXISTS plans (
        id TEXT PRIMARY KEY,
        name TEXT,
        data TEXT
      )
    `)
  }

  async insert(plan: FileSyncPlan): Promise<void> {
    await this.db.run(
      'INSERT INTO plans (id, name, data) VALUES (?, ?, ?)',
      plan.id,
      plan.name,
      JSON.stringify(plan),
    )
  }

  async update(plan: FileSyncPlan): Promise<void> {
    await this.db.run(
      'UPDATE plans SET name = ?, data = ? WHERE id = ?',
      plan.name,
      JSON.stringify(plan),
      plan.id,
    )
  }

  async remove(id: string): Promise<void> {
    await this.db.run('DELETE FROM plans WHERE id = ?', id)
  }

  async getById(id: string): Promise<FileSyncPlan | undefined> {
    const row = await this.db.get<{ data: string }>('SELECT data FROM plans WHERE id = ?', id)
    return row ? JSON.parse(row.data) : undefined
  }

  async getAll(): Promise<FileSyncPlan[]> {
    const rows = await this.db.all<{ data: string }[]>('SELECT data FROM plans')
    return rows.map((r) => JSON.parse(r.data))
  }
}
