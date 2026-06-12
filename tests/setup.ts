// tests/setup.ts — Vitest setup, loaded before every test file.
// Registers jest-dom matchers (toBeInTheDocument, etc.) on Vitest's expect
// and installs an in-memory IndexedDB so the Dexie layer works under jsdom.
import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
