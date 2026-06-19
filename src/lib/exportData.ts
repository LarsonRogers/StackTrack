// src/lib/exportData.ts — full-data export. JSON is the canonical backup
// format (a future import/restore reads JSON, not CSV); CSV is a
// spreadsheet-friendly view: one file, one section per table, separated by
// blank lines, each section starting with its table name and header row.
// Both contain health data in plain text — the user owns the file.
import { db } from '../db/db'
import { toIsoDate } from './dates'

// Everything needed to restore (or inspect) the database.
export interface ExportBundle {
  app: 'StackTrack'
  exportedAt: string // ISO datetime
  schemaVersion: number
  data: {
    items: unknown[]
    stackEvents: unknown[]
    intakes: unknown[]
    itemNotes: unknown[]
    metrics: unknown[]
    metricEntries: unknown[]
    metricNotes: unknown[]
    dayNotes: unknown[]
    healthEvents: unknown[]
    reminders: unknown[]
    tombstones: unknown[]
  }
}

export async function buildExportBundle(): Promise<ExportBundle> {
  const [
    items,
    stackEvents,
    intakes,
    itemNotes,
    metrics,
    metricEntries,
    metricNotes,
    dayNotes,
    healthEvents,
    reminders,
    tombstones,
  ] = await Promise.all([
    db.items.toArray(),
    db.stackEvents.toArray(),
    db.intakes.toArray(),
    db.itemNotes.toArray(),
    db.metrics.toArray(),
    db.metricEntries.toArray(),
    db.metricNotes.toArray(),
    db.dayNotes.toArray(),
    db.healthEvents.toArray(),
    db.reminders.toArray(),
    db.tombstones.toArray(),
  ])
  return {
    app: 'StackTrack',
    exportedAt: new Date().toISOString(),
    schemaVersion: db.verno,
    data: {
      items,
      stackEvents,
      intakes,
      itemNotes,
      metrics,
      metricEntries,
      metricNotes,
      dayNotes,
      healthEvents,
      reminders,
      tombstones,
    },
  }
}

// Quotes a CSV field when it contains a comma, quote, or newline
// (doubling inner quotes per RFC 4180). Arrays (e.g. schedule times)
// join with "; " so they stay one spreadsheet cell. Plain objects (e.g. an
// item's `schedule`) serialize to JSON so the cell stays lossless rather than
// rendering "[object Object]" — the JSON backup remains the canonical restore.
export function toCsvValue(value: unknown): string {
  if (value === undefined || value === null) return ''
  const text = Array.isArray(value)
    ? value.join('; ')
    : typeof value === 'object'
      ? JSON.stringify(value)
      : String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

// One section per table: table name line, header row, data rows, blank
// line between sections. Opens cleanly in Excel/Sheets for human reading.
export function buildExportCsv(bundle: ExportBundle): string {
  const sections: string[] = []
  for (const [tableName, rows] of Object.entries(bundle.data)) {
    const lines = [tableName]
    if (rows.length > 0) {
      // Union of keys across rows — optional fields (e.g. group) may be
      // missing from some rows but still need a column
      const columns = [
        ...new Set(rows.flatMap((row) => Object.keys(row as object))),
      ]
      lines.push(columns.map(toCsvValue).join(','))
      for (const row of rows) {
        lines.push(
          columns
            .map((column) =>
              toCsvValue((row as Record<string, unknown>)[column]),
            )
            .join(','),
        )
      }
    }
    sections.push(lines.join('\n'))
  }
  return sections.join('\n\n') + '\n'
}

// Triggers a browser download of generated content.
function downloadFile(filename: string, content: string, mimeType: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function exportAsJson(): Promise<void> {
  const bundle = await buildExportBundle()
  downloadFile(
    `stacktrack-export-${toIsoDate(new Date())}.json`,
    JSON.stringify(bundle, null, 2),
    'application/json',
  )
}

export async function exportAsCsv(): Promise<void> {
  const bundle = await buildExportBundle()
  downloadFile(
    `stacktrack-export-${toIsoDate(new Date())}.csv`,
    buildExportCsv(bundle),
    'text/csv',
  )
}
