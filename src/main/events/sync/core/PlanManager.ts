import { PlanStore } from '../store/PlanStore'
import { randomUUID } from 'crypto'

export class PlanManager {
  private store: PlanStore = new PlanStore()

  constructor() {
    this.store.init()
  }

  async add(plan: FileSyncPlan): Promise<FileSyncPlan> {
    const id = plan.id ?? randomUUID()
    const timestamp = new Date().getTime()
    const newPlan = { ...plan, id, timestamp }
    await this.store.insert(newPlan)
    return newPlan
  }

  async update(id: string, updated: Partial<FileSyncPlan>): Promise<FileSyncPlan | null> {
    const plan = await this.store.getById(id)
    if (!plan) return null
    const newPlan = { ...plan, ...updated, id }
    await this.store.update(newPlan)
    return newPlan
  }

  async remove(id: string): Promise<boolean> {
    const plan = await this.store.getById(id)
    if (!plan) return false
    await this.store.remove(id)
    return true
  }

  async getById(id: string): Promise<FileSyncPlan | undefined> {
    return this.store.getById(id)
  }

  async getAll(): Promise<FileSyncPlan[]> {
    return this.store.getAll()
  }
}
