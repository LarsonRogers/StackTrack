// src/db/metricRepository.ts — the only write path for metric definitions.
// Enforces the never-delete rule (archive keeps all logged entries).
// A metric's kind is fixed at creation — changing it would corrupt the
// meaning of already-logged values.
import { db, type MetricKind } from './db'

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

export async function addMetric(input: MetricInput): Promise<number> {
  return db.metrics.add({
    name: input.name.trim(),
    kind: input.kind,
    unit: input.unit?.trim() || undefined,
    status: 'active',
    createdAt: new Date().toISOString(),
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

// Restores an archived metric.
export async function unarchiveMetric(id: number): Promise<void> {
  await db.metrics.update(id, { status: 'active' })
}
