// src/db/metricRepository.ts — the only write path for metric definitions.
// Enforces the never-delete rule (archive keeps all logged entries).
// A metric's kind is fixed at creation — changing it would corrupt the
// meaning of already-logged values.
import { db, type MetricComponent, type MetricKind } from './db'
import { newUid, nowIso } from '../lib/identity'

export interface MetricInput {
  name: string
  kind: MetricKind
  unit?: string
  components?: MetricComponent[] // 'composite' only — the ordered parts
  note?: string // persistent context note shown when logging
}

// What can change after creation — everything except kind and components
// (changing components would misalign already-logged values).
export interface MetricUpdate {
  name: string
  unit?: string
  note?: string
}

export async function addMetric(input: MetricInput): Promise<number> {
  const stamp = nowIso()
  return db.metrics.add({
    uid: newUid(),
    name: input.name.trim(),
    kind: input.kind,
    unit: input.kind === 'number' ? input.unit?.trim() || undefined : undefined,
    components:
      input.kind === 'composite'
        ? input.components?.map((c) => ({
            name: c.name.trim(),
            unit: c.unit?.trim() || undefined,
          }))
        : undefined,
    note: input.note?.trim() || undefined,
    status: 'active',
    createdAt: stamp,
    updatedAt: stamp,
  })
}

export async function updateMetric(
  id: number,
  input: MetricUpdate,
): Promise<void> {
  await db.metrics.update(id, {
    name: input.name.trim(),
    unit: input.unit?.trim() || undefined,
    note: input.note?.trim() || undefined,
    updatedAt: nowIso(),
  })
}

// Archives a metric. Its logged entries stay — history must survive.
export async function archiveMetric(id: number): Promise<void> {
  await db.metrics.update(id, { status: 'archived', updatedAt: nowIso() })
}

// Restores an archived metric.
export async function unarchiveMetric(id: number): Promise<void> {
  await db.metrics.update(id, { status: 'active', updatedAt: nowIso() })
}
