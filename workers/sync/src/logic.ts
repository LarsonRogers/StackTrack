// workers/sync/src/logic.ts — pure request validation and conflict rules
// for the sync Worker. No I/O, no D1 — unit-tested in the main suite.

// What a client pushes/pulls. cipher is opaque base64; the server never
// inspects it.
export interface ChangeRow {
  uid: string
  cipher: string
  updatedAt: string
  deleted: boolean
}

export interface SyncRequest {
  groupId: string
  since: number // last server seq this client has seen; 0 = everything
  changes: ChangeRow[]
}

const MAX_CHANGES_PER_PUSH = 2000
const MAX_CIPHER_LENGTH = 64 * 1024 // 64 KB per record is far beyond any real row

// Validates an untrusted request body. Returns an error string (client-safe)
// or the typed request. Never throws.
export function parseSyncRequest(body: unknown): SyncRequest | string {
  if (typeof body !== 'object' || body === null) return 'body must be an object'
  const req = body as Record<string, unknown>

  if (typeof req.groupId !== 'string' || !/^[0-9a-f]{32,64}$/.test(req.groupId))
    return 'groupId must be a 32-64 char lowercase hex string'
  if (
    typeof req.since !== 'number' ||
    !Number.isInteger(req.since) ||
    req.since < 0
  )
    return 'since must be a non-negative integer'
  if (!Array.isArray(req.changes)) return 'changes must be an array'
  if (req.changes.length > MAX_CHANGES_PER_PUSH)
    return `too many changes in one push (max ${MAX_CHANGES_PER_PUSH})`

  for (const change of req.changes) {
    const c = change as Record<string, unknown>
    if (typeof c.uid !== 'string' || c.uid.length === 0 || c.uid.length > 128)
      return 'each change needs a uid (string, <=128 chars)'
    if (typeof c.cipher !== 'string' || c.cipher.length > MAX_CIPHER_LENGTH)
      return 'each change needs a cipher payload (string, <=64KB)'
    if (typeof c.updatedAt !== 'string' || c.updatedAt.length === 0)
      return 'each change needs an updatedAt timestamp'
    if (typeof c.deleted !== 'boolean')
      return 'each change needs deleted: boolean'
  }

  return {
    groupId: req.groupId,
    since: req.since,
    changes: req.changes as unknown as ChangeRow[],
  }
}

// Last-write-wins: an incoming change is applied only if the server has no
// copy or the incoming one is newer (ISO strings compare lexicographically).
// Ties keep the server copy — deterministic across devices.
export function incomingWins(
  incomingUpdatedAt: string,
  existingUpdatedAt: string | undefined,
): boolean {
  return (
    existingUpdatedAt === undefined || incomingUpdatedAt > existingUpdatedAt
  )
}

// Constant-shape token check helper: extracts the bearer token or null.
export function bearerTokenOf(
  authorizationHeader: string | null,
): string | null {
  if (!authorizationHeader?.startsWith('Bearer ')) return null
  const token = authorizationHeader.slice('Bearer '.length).trim()
  return /^[0-9a-f]{32,128}$/.test(token) ? token : null
}
