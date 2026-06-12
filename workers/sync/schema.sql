-- workers/sync/schema.sql — D1 schema for the sync server.
-- The server stores ONLY ciphertext: it never sees record contents, table
-- names, or counts of anything meaningful. Apply with:
--   npx wrangler d1 execute stacktrack-sync --remote --file=workers/sync/schema.sql

-- One row per sync group (= one passphrase). auth_hash is the SHA-256 of
-- the client-derived bearer token — the server never sees the passphrase
-- or the encryption key.
CREATE TABLE IF NOT EXISTS groups (
  group_id TEXT PRIMARY KEY,
  auth_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- One row per record (any table — the table name lives inside the
-- ciphertext). seq is a monotonically increasing cursor for delta pulls;
-- updates re-insert so the row gets a fresh seq (see worker logic).
CREATE TABLE IF NOT EXISTS records (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id TEXT NOT NULL,
  uid TEXT NOT NULL,
  cipher TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0,
  UNIQUE (group_id, uid)
);

CREATE INDEX IF NOT EXISTS idx_records_group_seq ON records (group_id, seq);
