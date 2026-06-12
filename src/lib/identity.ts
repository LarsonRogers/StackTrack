// src/lib/identity.ts — record identity for sync. Every record carries a
// device-independent uid (UUID v4) and an updatedAt stamp so copies of the
// database from two devices can be merged ("newest wins") without the
// per-device auto-increment ids ever colliding.
export function newUid(): string {
  return crypto.randomUUID()
}

export function nowIso(): string {
  return new Date().toISOString()
}
