// scripts/generate-icons.mjs — generates public/pwa-192.png and public/pwa-512.png
// (the brand teal with a white capsule, matching public/favicon.svg).
// Hand-rolled PNG encoder so icon generation needs no image dependencies.
// Re-run after design changes: node scripts/generate-icons.mjs
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

const TEAL = [15, 118, 110] // --color-primary #0f766e
const WHITE = [255, 255, 255]
const CAPSULE_ANGLE = -(35 * Math.PI) / 180 // matches the favicon's -35° tilt

// --- Minimal PNG encoding (spec: signature + IHDR + IDAT + IEND) ---

const crcTable = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  crcTable[n] = c >>> 0
}

// Standard CRC-32 over a buffer — PNG chunks require it over type + data.
function crc32(buf) {
  let c = 0xffffffff
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

// Builds one PNG chunk: length, ASCII type, data, CRC(type + data).
function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii')
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])))
  return Buffer.concat([length, typeBytes, data, crc])
}

// Encodes raw RGBA pixel rows into a complete PNG file buffer.
function encodePng(size, rgbaRows) {
  const signature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0) // width
  ihdr.writeUInt32BE(size, 4) // height
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type: RGBA
  // bytes 10-12 (compression, filter, interlace) stay 0
  const idat = deflateSync(Buffer.concat(rgbaRows))
  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

// --- Icon artwork: full-bleed teal + tilted white capsule with a gap ---

// Decides the color of one pixel. Full-bleed background (no transparency)
// so the same image works as a maskable icon.
function pixelColor(x, y, size) {
  const dx = x - size / 2
  const dy = y - size / 2
  // Rotate into the capsule's local frame so the capsule test is axis-aligned
  const cos = Math.cos(CAPSULE_ANGLE)
  const sin = Math.sin(CAPSULE_ANGLE)
  const lx = dx * cos + dy * sin
  const ly = -dx * sin + dy * cos

  const halfLength = size * 0.28 // capsule body half-length
  const radius = size * 0.13 // capsule end radius
  const gapHalfWidth = size * 0.012 // the two-halves divider line

  const inBody = Math.abs(lx) <= halfLength && Math.abs(ly) <= radius
  const inEndCap = Math.hypot(Math.abs(lx) - halfLength, ly) <= radius
  const inGap = Math.abs(lx) <= gapHalfWidth

  return (inBody || inEndCap) && !inGap ? WHITE : TEAL
}

function renderIcon(size) {
  const rows = []
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4) // leading 0 = "no filter" byte
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixelColor(x, y, size)
      const offset = 1 + x * 4
      row[offset] = r
      row[offset + 1] = g
      row[offset + 2] = b
      row[offset + 3] = 255
    }
    rows.push(row)
  }
  return encodePng(size, rows)
}

for (const size of [192, 512]) {
  const path = new URL(`../public/pwa-${size}.png`, import.meta.url)
  writeFileSync(path, renderIcon(size))
  console.log(`wrote public/pwa-${size}.png`)
}
