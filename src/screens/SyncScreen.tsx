// src/screens/SyncScreen.tsx — the Sync view: set up, monitor, or
// disconnect E2E-encrypted sync. The passphrase is never stored or
// displayed; only derived credentials persist (db.syncState, local-only).
import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import {
  disableSync,
  enableSync,
  getSyncStatus,
  onSyncStatus,
  runSync,
  type SyncStatus,
} from '../lib/syncEngine'
import SettingsMenu from '../components/SettingsMenu'

// Suggestion wordlist — memorable four-word passphrases. Entropy comes
// from random selection (4 of 64 ≈ 24 bits) PLUS the 600k-iteration
// stretch; users can always type something stronger of their own.
const WORDS = [
  'amber',
  'anchor',
  'aspen',
  'badge',
  'bison',
  'blaze',
  'breeze',
  'cedar',
  'cliff',
  'clover',
  'cobalt',
  'comet',
  'coral',
  'crane',
  'delta',
  'drift',
  'ember',
  'falcon',
  'fern',
  'flint',
  'gale',
  'glade',
  'grove',
  'harbor',
  'hazel',
  'heron',
  'ivory',
  'jasper',
  'juniper',
  'kestrel',
  'lagoon',
  'larch',
  'lunar',
  'maple',
  'meadow',
  'mesa',
  'mosaic',
  'nectar',
  'north',
  'oasis',
  'ochre',
  'onyx',
  'opal',
  'orchid',
  'osprey',
  'pebble',
  'pine',
  'plume',
  'prairie',
  'quartz',
  'raven',
  'reef',
  'ridge',
  'river',
  'saffron',
  'sage',
  'slate',
  'summit',
  'thistle',
  'tundra',
  'umber',
  'vale',
  'willow',
  'zephyr',
]

function suggestPassphrase(): string {
  const picks = crypto.getRandomValues(new Uint32Array(4))
  return [...picks].map((n) => WORDS[n % WORDS.length]).join('-')
}

export default function SyncScreen() {
  // undefined = query resolving; null = resolved, sync not configured
  // (first() alone can't tell those apart — same pattern as JournalSection)
  const syncState = useLiveQuery(
    async () => (await db.syncState.toCollection().first()) ?? null,
    [],
  )
  const [status, setStatus] = useState<SyncStatus>(getSyncStatus())
  const [passphrase, setPassphrase] = useState('')
  const [confirm, setConfirm] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [settingUp, setSettingUp] = useState(false)

  useEffect(() => onSyncStatus(setStatus), [])

  if (syncState === undefined) return null

  async function handleEnable(event: React.FormEvent) {
    event.preventDefault()
    if (passphrase.length < 8) {
      setFormError('Use at least 8 characters — longer is stronger.')
      return
    }
    if (passphrase !== confirm) {
      setFormError("The two entries don't match.")
      return
    }
    setFormError(null)
    setSettingUp(true)
    try {
      await enableSync(passphrase)
      setPassphrase('')
      setConfirm('')
    } finally {
      setSettingUp(false)
    }
  }

  async function handleDisconnect() {
    const confirmed = window.confirm(
      'Disconnect sync on this device? Your data stays here; this device just stops syncing. Reconnect anytime with the same passphrase.',
    )
    if (confirmed) await disableSync()
  }

  if (!syncState) {
    return (
      <main className="screen">
        <header className="screen-header">
          <h1>Sync</h1>
          <p className="screen-subtitle">
            Keep your devices in sync — end-to-end encrypted.
          </p>
          <SettingsMenu />
        </header>

        <p className="screen-note">
          Choose a passphrase and enter the same one on each device. Your data
          is encrypted on your device before it leaves; the server only ever
          stores unreadable ciphertext.
        </p>
        <p className="screen-note sync-warning">
          There is no reset. If you lose the passphrase, the synced copy is
          unrecoverable — your local data and JSON backups survive, but you'd
          start a new sync group.
        </p>

        <form className="item-form" onSubmit={handleEnable}>
          <label htmlFor="sync-passphrase">Passphrase</label>
          <input
            id="sync-passphrase"
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            autoComplete="new-password"
          />
          <label htmlFor="sync-confirm">Repeat passphrase</label>
          <input
            id="sync-confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
          <button
            type="button"
            className="button-subtle"
            onClick={() => {
              const suggestion = suggestPassphrase()
              setPassphrase(suggestion)
              setConfirm(suggestion)
              setFormError(
                `Suggestion filled in: "${suggestion}" — write it down somewhere safe.`,
              )
            }}
          >
            Suggest one for me
          </button>

          {formError && (
            <p className="item-form-error" role="alert">
              {formError}
            </p>
          )}

          <div className="item-form-actions">
            <button
              type="submit"
              className="button-primary"
              disabled={settingUp}
            >
              {settingUp
                ? 'Securing your passphrase… (a few seconds, on purpose)'
                : 'Enable sync'}
            </button>
          </div>
        </form>
      </main>
    )
  }

  return (
    <main className="screen">
      <header className="screen-header">
        <h1>Sync</h1>
        <p className="screen-subtitle">
          {status.state === 'syncing'
            ? 'Syncing…'
            : status.state === 'error'
              ? 'Sync problem'
              : 'Connected'}
        </p>
        <SettingsMenu />
      </header>

      <p className="screen-note">
        Last synced:{' '}
        {syncState.lastSyncedAt
          ? new Date(syncState.lastSyncedAt).toLocaleString()
          : 'not yet'}
        . Syncs automatically when you open the app, return to it, and shortly
        after changes.
      </p>

      {status.state === 'error' && status.error && (
        <p className="item-form-error" role="alert">
          {status.error}
        </p>
      )}

      <div className="item-form-actions">
        <button
          type="button"
          className="button-primary"
          disabled={status.state === 'syncing'}
          onClick={() => runSync()}
        >
          {status.state === 'syncing' ? 'Syncing…' : 'Sync now'}
        </button>
        <button
          type="button"
          className="button-subtle"
          onClick={handleDisconnect}
        >
          Disconnect this device
        </button>
      </div>

      <p className="screen-note sync-hint">
        To link another device: install the app there, open its Sync tab, and
        enter the same passphrase.
      </p>
    </main>
  )
}
