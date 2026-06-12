// src/db/metricRepository.ts — the only write path for metric definitions.
// Enforces the 10-active cap and the never-delete rule (archive keeps all
// logged entries). A metric's kind is fixed at creation — changing it would
// corrupt the meaning of already-logged values.
import { db, type MetricKind } from './db'

// Product cap from the brief: at most 10 metrics tracked at once.
export const MAX_ACTIVE_METRICS = 10

export interface MetricInput {
  name: string
  kind: MetricKind
  unit?: string
}

// What can change after creation — everything except kind.
export interface MetricUpdate {
  name: string
  unit?: string
}

// Adds a metric definition. Throws when the active cap is reached —
// the UI checks first, this is the backstop.
export async function addMetric(input: MetricInput): Promise<number> {
  return db.transaction('rw', db.metrics, async () => {
    await assertBelowActiveCap()
    return db.metrics.add({
      name: input.name.trim(),
      kind: input.kind,
      unit: input.unit?.trim() || undefined,
      status: 'active',
      createdAt: new Date().toISOString(),
    })
  })
}

export async function updateMetric(
  id: number,
  input: MetricUpdate,
): Promise<void> {
  await db.metrics.update(id, {
    name: input.name.trim(),
    unit: input.unit?.trim() || undefined,
  })
}

// Archives a metric. Its logged entries stay — history must survive.
export async function archiveMetric(id: number): Promise<void> {
  await db.metrics.update(id, { status: 'archived' })
}

// Restores an archived metric, re-checking the active cap.
export async function unarchiveMetric(id: number): Promise<void> {
  await db.transaction('rw', db.metrics, async () => {
    await assertBelowActiveCap()
    await db.metrics.update(id, { status: 'active' })
  })
}

async function assertBelowActiveCap(): Promise<void> {
  const activeCount = await db.metrics.where('status').equals('active').count()
  if (activeCount >= MAX_ACTIVE_METRICS) {
    throw new Error(
      `Cannot exceed ${MAX_ACTIVE_METRICS} active metrics — archive one first`,
    )
  }
}
