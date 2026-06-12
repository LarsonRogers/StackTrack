// src/screens/StackScreen.tsx — the Stack view: manage medications &
// supplements. Reads live from the db (useLiveQuery re-renders on writes);
// all writes go through stackRepository. Change history is recorded there
// automatically — this screen never touches stackEvents.
import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type StackItem } from '../db/db'
import {
  addItem,
  archiveItem,
  unarchiveItem,
  updateItem,
  type StackItemInput,
} from '../db/stackRepository'
import {
  distinctGroups,
  groupByPurpose,
  latestEventDates,
  SORT_MODE_LABELS,
  sortByEarliestTime,
  sortByName,
  sortByRecentlyChanged,
  type StackSortMode,
} from '../lib/stackView'
import { exportAsCsv, exportAsJson } from '../lib/exportData'
import { applyBundle, parseBundle } from '../lib/importData'
import { mergeBundle } from '../lib/mergeData'
import ItemForm from '../components/ItemForm'

// Form state: closed, adding new, or editing a specific item.
type FormState =
  | { mode: 'closed' }
  | { mode: 'add' }
  | { mode: 'edit'; item: StackItem }

// Sort choice is a UI preference, not health data — localStorage, not the
// db, and deliberately absent from exports.
const SORT_STORAGE_KEY = 'stacktrack.stackSortMode'

function readSavedSortMode(): StackSortMode {
  const saved = localStorage.getItem(SORT_STORAGE_KEY)
  return saved !== null && saved in SORT_MODE_LABELS
    ? (saved as StackSortMode)
    : 'group'
}

export default function StackScreen() {
  const activeItems = useLiveQuery(
    () => db.items.where('status').equals('active').toArray(),
    [],
  )
  const archivedItems = useLiveQuery(
    () => db.items.where('status').equals('archived').toArray(),
    [],
  )
  const stackEvents = useLiveQuery(() => db.stackEvents.toArray(), [])
  const [form, setForm] = useState<FormState>({ mode: 'closed' })
  const [showArchived, setShowArchived] = useState(false)
  const [sortMode, setSortMode] = useState<StackSortMode>(readSavedSortMode)
  const [importStatus, setImportStatus] = useState<{
    kind: 'success' | 'error'
    text: string
  } | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)
  const syncInputRef = useRef<HTMLInputElement>(null)

  // First render before IndexedDB answers — avoid an "empty stack" flash
  if (activeItems === undefined || archivedItems === undefined) return null

  // Restore flow: validate file → confirm with counts → download a safety
  // snapshot of current data → replace atomically (lib/importData).
  async function handleImportFile(file: File) {
    try {
      const bundle = parseBundle(await file.text())
      const [currentItems, currentValues] = await Promise.all([
        db.items.count(),
        db.metricEntries.count(),
      ])
      const backupDate = bundle.exportedAt
        ? new Date(bundle.exportedAt).toLocaleDateString()
        : 'an unknown date'
      const confirmed = window.confirm(
        `Restore the backup from ${backupDate}?\n\n` +
          `Backup contains: ${bundle.data.items.length} stack items, ` +
          `${bundle.data.metrics.length} metrics, ` +
          `${bundle.data.metricEntries.length} logged values.\n\n` +
          `This REPLACES everything currently in the app ` +
          `(${currentItems} items, ${currentValues} logged values). ` +
          `A backup of your current data will download first, just in case.`,
      )
      if (!confirmed) return
      await exportAsJson() // safety snapshot — the user's undo path
      await applyBundle(bundle)
      setImportStatus({ kind: 'success', text: 'Backup restored.' })
    } catch (error) {
      setImportStatus({
        kind: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Import failed — your data was not changed.',
      })
    }
  }

  // Sync flow: validate file → dry-run merge for the preview numbers →
  // confirm → apply atomically (lib/mergeData). Nothing is ever deleted.
  async function handleSyncFile(file: File) {
    try {
      const bundle = parseBundle(await file.text())
      const preview = await mergeBundle(bundle, false)
      const backupDate = bundle.exportedAt
        ? new Date(bundle.exportedAt).toLocaleDateString()
        : 'an unknown date'
      const confirmed = window.confirm(
        `Merge the file from ${backupDate} into this device?\n\n` +
          `This adds ${preview.added} and updates ${preview.updated} ` +
          `record${preview.updated === 1 ? '' : 's'} — nothing is deleted.`,
      )
      if (!confirmed) return
      const result = await mergeBundle(bundle, true)
      setImportStatus({
        kind: 'success',
        text:
          `Synced: ${result.added} added, ${result.updated} updated` +
          (result.deleted > 0 ? `, ${result.deleted} removed` : '') +
          '.' +
          (result.skipped > 0
            ? ` ${result.skipped} skipped (unknown parent).`
            : ''),
      })
    } catch (error) {
      setImportStatus({
        kind: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Sync failed — your data was not changed.',
      })
    }
  }

  async function handleSubmit(input: StackItemInput) {
    if (form.mode === 'edit') {
      await updateItem(form.item.id, input)
    } else {
      await addItem(input)
    }
    setForm({ mode: 'closed' })
  }

  async function handleArchive(item: StackItem) {
    const confirmed = window.confirm(
      `Remove "${item.name}" from your stack? Its history is kept and it can be restored later.`,
    )
    if (confirmed) await archiveItem(item.id)
  }

  // Flat ordering for the non-group sort modes.
  function sortedFlatItems(): StackItem[] {
    if (activeItems === undefined) return []
    if (sortMode === 'name') return sortByName(activeItems)
    if (sortMode === 'time') return sortByEarliestTime(activeItems)
    return sortByRecentlyChanged(
      activeItems,
      latestEventDates(stackEvents ?? []),
    )
  }

  // One active-item row. showGroup: flat sorts lose the section headers,
  // so the group rides along in the detail line instead.
  function renderActiveItem(item: StackItem, showGroup: boolean) {
    return (
      <li key={item.id} className="stack-item">
        <div className="stack-item-info">
          <span className="stack-item-name">
            {item.name}
            <span className={`kind-badge kind-badge-${item.kind}`}>
              {item.kind === 'med' ? 'Med' : 'Supp'}
            </span>
          </span>
          <span className="stack-item-detail">
            {[item.dose, item.times.join(', '), showGroup ? item.group : null]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </div>
        <div className="stack-item-actions">
          <button
            type="button"
            className="button-subtle"
            onClick={() => setForm({ mode: 'edit', item })}
          >
            Edit
          </button>
          <button
            type="button"
            className="button-subtle"
            onClick={() => handleArchive(item)}
          >
            Archive
          </button>
        </div>
      </li>
    )
  }

  if (form.mode !== 'closed') {
    return (
      <main className="screen">
        <ItemForm
          initial={form.mode === 'edit' ? form.item : undefined}
          groupSuggestions={distinctGroups([...activeItems, ...archivedItems])}
          onSubmit={handleSubmit}
          onCancel={() => setForm({ mode: 'closed' })}
        />
      </main>
    )
  }

  return (
    <main className="screen">
      <header className="screen-header">
        <h1>Your Stack</h1>
        <p className="screen-subtitle">
          {activeItems.length === 0
            ? 'Nothing here yet.'
            : `${activeItems.length} item${activeItems.length === 1 ? '' : 's'}`}
        </p>
      </header>

      <button
        type="button"
        className="button-primary"
        onClick={() => setForm({ mode: 'add' })}
      >
        + Add medication or supplement
      </button>

      {activeItems.length > 1 && (
        <div className="stack-sort">
          <label htmlFor="stack-sort">Sort by</label>
          <select
            id="stack-sort"
            value={sortMode}
            onChange={(e) => {
              const mode = e.target.value as StackSortMode
              setSortMode(mode)
              localStorage.setItem(SORT_STORAGE_KEY, mode)
            }}
          >
            {(
              Object.entries(SORT_MODE_LABELS) as [StackSortMode, string][]
            ).map(([mode, label]) => (
              <option key={mode} value={mode}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}

      {sortMode === 'group' ? (
        groupByPurpose(activeItems).map((section) => (
          <section key={section.group ?? '(ungrouped)'} className="stack-group">
            <h2 className="stack-group-title">{section.group ?? 'No group'}</h2>
            <ul className="stack-list">
              {section.items.map((item) => renderActiveItem(item, false))}
            </ul>
          </section>
        ))
      ) : (
        <ul className="stack-list stack-list-flat">
          {sortedFlatItems().map((item) => renderActiveItem(item, true))}
        </ul>
      )}

      {archivedItems.length > 0 && (
        <section className="stack-archived">
          <button
            type="button"
            className="button-subtle"
            onClick={() => setShowArchived((value) => !value)}
          >
            {showArchived
              ? 'Hide archived'
              : `Show archived (${archivedItems.length})`}
          </button>
          {showArchived && (
            <ul className="stack-list">
              {archivedItems.map((item) => (
                <li key={item.id} className="stack-item stack-item-archived">
                  <div className="stack-item-info">
                    <span className="stack-item-name">{item.name}</span>
                    <span className="stack-item-detail">{item.dose}</span>
                  </div>
                  <button
                    type="button"
                    className="button-subtle"
                    onClick={() => unarchiveItem(item.id)}
                  >
                    Restore
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="stack-export" aria-label="Export">
        <h2 className="today-section-title">Backup</h2>
        <p className="screen-note">
          Your data lives only on this device. Download a copy now and then —
          JSON is the full backup; CSV opens in spreadsheets. To carry changes
          between your devices, export on one and "Sync from file" on the other
          (merges, never deletes; "Import backup" fully replaces).
        </p>
        <div className="stack-export-actions">
          <button
            type="button"
            className="button-subtle"
            onClick={() => exportAsJson()}
          >
            Export JSON
          </button>
          <button
            type="button"
            className="button-subtle"
            onClick={() => exportAsCsv()}
          >
            Export CSV
          </button>
          <button
            type="button"
            className="button-subtle"
            onClick={() => syncInputRef.current?.click()}
          >
            Sync from file
          </button>
          <input
            ref={syncInputRef}
            type="file"
            accept="application/json,.json"
            className="visually-hidden"
            aria-label="Sync from file"
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) handleSyncFile(file)
            }}
          />
          <button
            type="button"
            className="button-subtle"
            onClick={() => importInputRef.current?.click()}
          >
            Import backup
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="visually-hidden"
            aria-label="Import backup file"
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = '' // allow re-picking the same file
              if (file) handleImportFile(file)
            }}
          />
        </div>
        {importStatus && (
          <p
            className={
              importStatus.kind === 'error'
                ? 'item-form-error'
                : 'metric-number-saved'
            }
            role={importStatus.kind === 'error' ? 'alert' : 'status'}
          >
            {importStatus.text}
          </p>
        )}
      </section>
    </main>
  )
}
