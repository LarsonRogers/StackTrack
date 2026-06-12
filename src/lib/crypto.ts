// src/lib/crypto.ts — end-to-end encryption for sync. Browser WebCrypto
// only, no dependencies. The passphrase is stretched (PBKDF2-HMAC-SHA256,
// 600k iterations per current OWASP guidance, verified 2026-06-12) into a
// master key, then split via HKDF into three INDEPENDENT values:
//   groupId   — identifies the sync group to the server (hex)
//   authToken — proves membership to the server (hex; server stores its hash)
//   encKey    — encrypts/decrypts records; NEVER leaves the device
// HKDF's one-way expansion means the server-facing values cannot be
// reversed into the encryption key: the server can authenticate us yet
// can never read the data.
//
// The PBKDF2 salt is an app-level constant, deliberately: a brand-new
// device must derive the same groupId from the passphrase ALONE to find
// its group, so there is nowhere to store a random per-user salt before
// authentication exists. The 600k work factor plus a decent passphrase is
// the defense; this trade-off is standard for passphrase-derived E2E and
// is documented in DECISION_LOG.md.

export const PBKDF2_ITERATIONS = 600_000

// Versioned so a future crypto upgrade can re-derive without ambiguity.
const APP_SALT = 'stacktrack-sync-v1'

export interface SyncKeys {
  groupId: string // 64-char hex — matches the server's groupId format
  authToken: string // 64-char hex — sent as the bearer token
  encKey: CryptoKey // AES-GCM 256 — local only, ready to use
  encKeyHex: string // key material as hex for local persistence (plain
  // string survives IndexedDB's structured clone everywhere). Stored in
  // syncState so sync survives restarts. Anyone who can read it can also
  // read the plaintext data sitting beside it in the same database, so
  // this stores no NEW risk; the E2E guarantee protects against the
  // SERVER, not against someone holding the unlocked device.
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function bytesToHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

// Stretch + split. `iterations` is overridable ONLY so tests run fast —
// production callers must use the default.
export async function deriveSyncKeys(
  passphrase: string,
  iterations: number = PBKDF2_ITERATIONS,
): Promise<SyncKeys> {
  const passphraseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase.normalize('NFKC')), // normalize: same passphrase typed on any keyboard derives the same keys
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const masterBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: encoder.encode(APP_SALT),
      iterations,
    },
    passphraseKey,
    256,
  )

  const masterKey = await crypto.subtle.importKey(
    'raw',
    masterBits,
    'HKDF',
    false,
    ['deriveBits', 'deriveKey'],
  )

  const expand = (info: string, bits: number) =>
    crypto.subtle.deriveBits(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: new Uint8Array(0),
        info: encoder.encode(info),
      },
      masterKey,
      bits,
    )

  const [groupIdBits, authTokenBits, encKeyBits] = await Promise.all([
    expand('stacktrack-group-id', 256),
    expand('stacktrack-auth-token', 256),
    expand('stacktrack-encryption', 256),
  ])
  const encKeyHex = bytesToHex(encKeyBits)

  return {
    groupId: bytesToHex(groupIdBits),
    authToken: bytesToHex(authTokenBits),
    encKey: await importEncKey(encKeyHex),
    encKeyHex,
  }
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  // explicit ArrayBuffer backing — WebCrypto's BufferSource typing rejects
  // the default ArrayBufferLike under TS6 lib definitions
  const bytes = new Uint8Array(new ArrayBuffer(hex.length / 2))
  for (let i = 0; i < bytes.length; i++)
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return bytes
}

// Rehydrates the usable (non-extractable) AES key from persisted hex.
export async function importEncKey(hex: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    hexToBytes(hex),
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt'],
  )
}

// Encrypts any JSON-serializable record. Output: base64(iv || ciphertext).
// AES-GCM with a fresh random 96-bit IV per call — also authenticates:
// any tampering makes decryption throw rather than return garbage.
export async function encryptRecord(
  encKey: CryptoKey,
  record: unknown,
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    encKey,
    encoder.encode(JSON.stringify(record)),
  )
  const combined = new Uint8Array(iv.length + ciphertext.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(ciphertext), iv.length)
  return bytesToBase64(combined)
}

// Reverses encryptRecord. Throws on tampered/foreign ciphertext.
export async function decryptRecord(
  encKey: CryptoKey,
  cipher: string,
): Promise<unknown> {
  const combined = base64ToBytes(cipher)
  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    encKey,
    ciphertext,
  )
  return JSON.parse(decoder.decode(plaintext))
}
