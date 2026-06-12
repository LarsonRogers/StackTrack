// workers/sync/src/index.ts — the StackTrack sync Worker.
// One endpoint: POST /v1/sync — "here are my encrypted changes since
// cursor X; give me everything I haven't seen." The server stores only
// opaque ciphertext + timestamps; it cannot read any health data (E2E).
// Auth: bearer token derived on-device from the user's passphrase; the
// first sync of a group registers SHA-256(token), later syncs must match.
import {
  bearerTokenOf,
  incomingWins,
  parseSyncRequest,
  type ChangeRow,
} from './logic'

interface Env {
  DB: D1Database
}

// Browsers allowed to call this API. localhost covers development.
const ALLOWED_ORIGINS = [
  'https://stacktrack-ea9.pages.dev',
  'http://localhost:5173',
  'http://localhost:4173',
]

const PULL_LIMIT = 1000 // changes per response; client repeats until drained

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ''
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  }
}

function json(status: number, body: unknown, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  })
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(text),
  )
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin')
    const url = new URL(request.url)

    if (request.method === 'OPTIONS')
      return new Response(null, { status: 204, headers: corsHeaders(origin) })
    if (url.pathname === '/health') return json(200, { ok: true }, origin)
    if (url.pathname !== '/v1/sync' || request.method !== 'POST')
      return json(404, { error: 'not found' }, origin)

    const token = bearerTokenOf(request.headers.get('Authorization'))
    if (!token) return json(401, { error: 'missing bearer token' }, origin)

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return json(400, { error: 'invalid JSON' }, origin)
    }
    const parsed = parseSyncRequest(body)
    if (typeof parsed === 'string') return json(400, { error: parsed }, origin)

    // --- Group auth: first sync registers the group, later syncs must match
    const tokenHash = await sha256Hex(token)
    const group = await env.DB.prepare(
      'SELECT auth_hash FROM groups WHERE group_id = ?',
    )
      .bind(parsed.groupId)
      .first<{ auth_hash: string }>()

    if (!group) {
      await env.DB.prepare(
        'INSERT INTO groups (group_id, auth_hash, created_at) VALUES (?, ?, ?)',
      )
        .bind(parsed.groupId, tokenHash, new Date().toISOString())
        .run()
    } else if (group.auth_hash !== tokenHash) {
      return json(
        403,
        { error: 'wrong credentials for this sync group' },
        origin,
      )
    }

    // --- Apply pushed changes (last-write-wins; re-insert to bump seq so
    // other devices' delta pulls pick the update up)
    for (const change of parsed.changes as ChangeRow[]) {
      const existing = await env.DB.prepare(
        'SELECT updated_at FROM records WHERE group_id = ? AND uid = ?',
      )
        .bind(parsed.groupId, change.uid)
        .first<{ updated_at: string }>()

      if (!incomingWins(change.updatedAt, existing?.updated_at)) continue

      await env.DB.batch([
        env.DB.prepare(
          'DELETE FROM records WHERE group_id = ? AND uid = ?',
        ).bind(parsed.groupId, change.uid),
        env.DB.prepare(
          'INSERT INTO records (group_id, uid, cipher, updated_at, deleted) VALUES (?, ?, ?, ?, ?)',
        ).bind(
          parsed.groupId,
          change.uid,
          change.cipher,
          change.updatedAt,
          change.deleted ? 1 : 0,
        ),
      ])
    }

    // --- Return everything this client hasn't seen yet
    const rows = await env.DB.prepare(
      `SELECT seq, uid, cipher, updated_at, deleted FROM records
       WHERE group_id = ? AND seq > ? ORDER BY seq LIMIT ${PULL_LIMIT}`,
    )
      .bind(parsed.groupId, parsed.since)
      .all<{
        seq: number
        uid: string
        cipher: string
        updated_at: string
        deleted: number
      }>()

    const changes = rows.results.map((row) => ({
      uid: row.uid,
      cipher: row.cipher,
      updatedAt: row.updated_at,
      deleted: row.deleted === 1,
    }))
    const cursor =
      rows.results.length > 0
        ? rows.results[rows.results.length - 1].seq
        : parsed.since

    return json(
      200,
      { changes, cursor, more: rows.results.length === PULL_LIMIT },
      origin,
    )
  },
}
