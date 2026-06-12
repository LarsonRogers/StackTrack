// src/screens/StackScreen.tsx — the Stack view: manage medications &
// supplements. Reads live from the db (useLiveQuery re-renders on writes);
// all writes go through stackRepository. Change history is recorded there
// automatically — this screen never touches stackEvents.
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type StackItem } from '../db/db'
import {
  addItem,
  archiveItem,
  unarchiveItem,
  updateItem,
  type StackItemInput,
} from '../db/stackRepository'
import { distinctGroups, groupByPurpose } from '../lib/stackView'
import { exportAsCsv, exportAsJson } from '../lib/exportData'
import ItemForm from '../components/ItemForm'

// Form state: closed, adding new, or editing a specific item.
type FormState =
  | { mode: 'closed' }
  | { mode: 'add' }
  | { mode: 'edit'; item: StackItem }

export default function StackScreen() {
  const activeItems = useLiveQuery(
    () => db.items.where('status').equals('active').toArray(),
    [],
  )
  const archivedItems = useLiveQuery(
    () => db.items.where('status').equals('archived').toArray(),
    [],
  )
  const [form, setForm] = useState<FormState>({ mode: 'closed' })
  const [showArchived, setShowArchived] = useState(false)

  // First render before IndexedDB answers — avoid an "empty stack" flash
  if (activeItems === undefined || archivedItems === undefined) return null

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

      {groupByPurpose(activeItems).map((section) => (
        <section key={section.group ?? '(ungrouped)'} className="stack-group">
          <h2 className="stack-group-title">{section.group ?? 'No group'}</h2>
          <ul className="stack-list">
            {section.items.map((item) => (
              <li key={item.id} className="stack-item">
                <div className="stack-item-info">
                  <span className="stack-item-name">
                    {item.name}
                    <span className={`kind-badge kind-badge-${item.kind}`}>
                      {item.kind === 'med' ? 'Med' : 'Supp'}
                    </span>
                  </span>
                  <span className="stack-item-detail">
                    {item.dose && `${item.dose} · `}
                    {item.times.join(', ')}
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
            ))}
          </ul>
        </section>
      ))}

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
          JSON is the full backup; CSV opens in spreadsheets.
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
        </div>
      </section>
    </main>
  )
}
