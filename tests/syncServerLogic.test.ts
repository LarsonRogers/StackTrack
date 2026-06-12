// tests/syncServerLogic.test.ts — unit tests for the sync Worker's pure
// logic: request validation (the server's first line of defense), the
// last-write-wins rule, and bearer-token extraction. The Worker's D1/HTTP
// behavior is integration-tested against wrangler dev + the live deploy.
import { describe, expect, it } from 'vitest'
import {
  bearerTokenOf,
  incomingWins,
  parseSyncRequest,
} from '../workers/sync/src/logic'

const VALID_GROUP = 'a'.repeat(64)

function validRequest() {
  return {
    groupId: VALID_GROUP,
    since: 0,
    changes: [
      {
        uid: 'some-uid',
        cipher: 'b64cipher',
        updatedAt: '2026-06-12T10:00:00.000Z',
        deleted: false,
      },
    ],
  }
}

describe('parseSyncRequest', () => {
  it('accepts a valid request', () => {
    const parsed = parseSyncRequest(validRequest())
    expect(typeof parsed).not.toBe('string')
  })

  it('rejects malformed group ids', () => {
    expect(parseSyncRequest({ ...validRequest(), groupId: 'short' })).toMatch(
      /groupId/,
    )
    expect(
      parseSyncRequest({ ...validRequest(), groupId: 'Z'.repeat(64) }),
    ).toMatch(/groupId/)
  })

  it('rejects negative or fractional cursors', () => {
    expect(parseSyncRequest({ ...validRequest(), since: -1 })).toMatch(/since/)
    expect(parseSyncRequest({ ...validRequest(), since: 1.5 })).toMatch(/since/)
  })

  it('rejects changes missing required fields', () => {
    const broken = validRequest()
    broken.changes = [{ uid: 'x' } as never]
    expect(parseSyncRequest(broken)).toMatch(/cipher/)
  })

  it('rejects oversized pushes', () => {
    const big = validRequest()
    big.changes = Array.from({ length: 2001 }, () => big.changes[0])
    expect(parseSyncRequest(big)).toMatch(/too many/)
  })
})

describe('incomingWins (last-write-wins)', () => {
  it('wins against nothing and older copies; loses ties and newer', () => {
    expect(incomingWins('2026-06-12T10:00:00Z', undefined)).toBe(true)
    expect(incomingWins('2026-06-12T10:00:00Z', '2026-06-12T09:00:00Z')).toBe(
      true,
    )
    expect(incomingWins('2026-06-12T10:00:00Z', '2026-06-12T10:00:00Z')).toBe(
      false,
    )
    expect(incomingWins('2026-06-12T10:00:00Z', '2026-06-12T11:00:00Z')).toBe(
      false,
    )
  })
})

describe('bearerTokenOf', () => {
  it('extracts a valid hex bearer token', () => {
    expect(bearerTokenOf(`Bearer ${'ab'.repeat(32)}`)).toBe('ab'.repeat(32))
  })

  it('rejects missing, malformed, or non-hex tokens', () => {
    expect(bearerTokenOf(null)).toBeNull()
    expect(bearerTokenOf('Basic abc')).toBeNull()
    expect(bearerTokenOf('Bearer not-hex!')).toBeNull()
  })
})
