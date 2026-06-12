// tests/crypto.test.ts — behavior tests for the E2E crypto: deterministic
// derivation, independence between passphrases, server-format compatibility,
// encrypt/decrypt round-trips, and tamper rejection.
// Iterations are lowered for test speed only — the derivation ALGORITHM is
// identical, so determinism/format/independence results carry over.
import { describe, expect, it } from 'vitest'
import {
  decryptRecord,
  deriveSyncKeys,
  encryptRecord,
  PBKDF2_ITERATIONS,
} from '../src/lib/crypto'
import { bearerTokenOf, parseSyncRequest } from '../workers/sync/src/logic'

const TEST_ITERATIONS = 1000

describe('deriveSyncKeys', () => {
  it('is deterministic — same passphrase, same keys, on any device', async () => {
    const a = await deriveSyncKeys(
      'correct horse battery staple',
      TEST_ITERATIONS,
    )
    const b = await deriveSyncKeys(
      'correct horse battery staple',
      TEST_ITERATIONS,
    )
    expect(a.groupId).toBe(b.groupId)
    expect(a.authToken).toBe(b.authToken)
  })

  it('normalizes unicode so keyboards agree', async () => {
    // é typed as one codepoint vs e + combining accent
    const composed = await deriveSyncKeys('café', TEST_ITERATIONS)
    const decomposed = await deriveSyncKeys('café', TEST_ITERATIONS)
    expect(composed.groupId).toBe(decomposed.groupId)
  })

  it('different passphrases share nothing', async () => {
    const a = await deriveSyncKeys('passphrase one', TEST_ITERATIONS)
    const b = await deriveSyncKeys('passphrase two', TEST_ITERATIONS)
    expect(a.groupId).not.toBe(b.groupId)
    expect(a.authToken).not.toBe(b.authToken)
  })

  it('groupId and authToken are independent values', async () => {
    const keys = await deriveSyncKeys('any passphrase', TEST_ITERATIONS)
    expect(keys.groupId).not.toBe(keys.authToken)
  })

  it('produces values the sync server accepts', async () => {
    const keys = await deriveSyncKeys('any passphrase', TEST_ITERATIONS)
    // groupId passes the server's request validation
    const parsed = parseSyncRequest({
      groupId: keys.groupId,
      since: 0,
      changes: [],
    })
    expect(typeof parsed).not.toBe('string')
    // authToken passes the server's bearer extraction
    expect(bearerTokenOf(`Bearer ${keys.authToken}`)).toBe(keys.authToken)
  })

  it('defaults to the OWASP-verified work factor', () => {
    expect(PBKDF2_ITERATIONS).toBe(600_000)
  })
})

describe('encryptRecord / decryptRecord', () => {
  it('round-trips any record exactly', async () => {
    const { encKey } = await deriveSyncKeys('roundtrip', TEST_ITERATIONS)
    const record = {
      table: 'items',
      name: 'Zinc, chelated',
      times: ['08:00', '20:00'],
      value: 83.6,
      nested: { deep: true },
    }
    const cipher = await encryptRecord(encKey, record)
    expect(await decryptRecord(encKey, cipher)).toEqual(record)
  })

  it('produces different ciphertext each time (fresh IV)', async () => {
    const { encKey } = await deriveSyncKeys('fresh-iv', TEST_ITERATIONS)
    const a = await encryptRecord(encKey, { same: 'record' })
    const b = await encryptRecord(encKey, { same: 'record' })
    expect(a).not.toBe(b) // identical plaintext must not leak via identical ciphertext
  })

  it('refuses tampered ciphertext instead of returning garbage', async () => {
    const { encKey } = await deriveSyncKeys('tamper', TEST_ITERATIONS)
    const cipher = await encryptRecord(encKey, { dose: '25 mg' })
    // flip one character somewhere in the body
    const middle = Math.floor(cipher.length / 2)
    const tampered =
      cipher.slice(0, middle) +
      (cipher[middle] === 'A' ? 'B' : 'A') +
      cipher.slice(middle + 1)
    await expect(decryptRecord(encKey, tampered)).rejects.toThrow()
  })

  it('refuses ciphertext from a different passphrase', async () => {
    const alice = await deriveSyncKeys('alice passphrase', TEST_ITERATIONS)
    const bob = await deriveSyncKeys('bob passphrase', TEST_ITERATIONS)
    const cipher = await encryptRecord(alice.encKey, { secret: true })
    await expect(decryptRecord(bob.encKey, cipher)).rejects.toThrow()
  })
})
