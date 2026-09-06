/** zip / dbf / shp の最小読み取り。外部依存を持たない（ADR package-manager の依存ゼロ方針） */
import { inflateRawSync } from "node:zlib";

/** ZIP の中央ディレクトリを辿り、名前 → Buffer を返す */
export function unzip(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 66000; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("ZIP の終端レコードが見つかりません");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const files = new Map();
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("中央ディレクトリが壊れています");
    const method = buf.readUInt16LE(p + 10);
    const csize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const cmtLen = buf.readUInt16LE(p + 32);
    const lho = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    const lNameLen = buf.readUInt16LE(lho + 26);
    const lExtraLen = buf.readUInt16LE(lho + 28);
    const start = lho + 30 + lNameLen + lExtraLen;
    const raw = buf.subarray(start, start + csize);
    files.set(name, method === 0 ? Buffer.from(raw) : inflateRawSync(raw));
    p += 46 + nameLen + extraLen + cmtLen;
  }
  return files;
}

const trimZ = (s) => s.split("\0")[0].trim();

/** dBase III のレコードを読む。want に挙げた列だけ取り出す */
export function readDbf(buf, want) {
  const recCount = buf.readUInt32LE(4);
  const headerLen = buf.readUInt16LE(8);
  const recLen = buf.readUInt16LE(10);
  const fields = [];
  for (let p = 32; buf[p] !== 0x0d; p += 32) {
    fields.push({ name: trimZ(buf.toString("latin1", p, p + 11)), len: buf[p + 16] });
  }
  const rows = [];
  for (let i = 0; i < recCount; i++) {
    const base = headerLen + i * recLen;
    if (buf[base] === 0x2a) { rows.push(null); continue; }   // 削除済み
    const row = {};
    let o = base + 1;
    for (const f of fields) {
      if (want.has(f.name)) row[f.name] = trimZ(buf.toString("utf8", o, o + f.len));
      o += f.len;
    }
    rows.push(row);
  }
  return rows;
}

/** shp のポリゴンを読む。レコードごとにリング配列を返す */
export function readShpPolygons(buf) {
  const total = buf.readUInt32BE(24) * 2;
  const out = [];
  let p = 100;
  while (p < total) {
    const len = buf.readUInt32BE(p + 4) * 2;
    const body = buf.subarray(p + 8, p + 8 + len);
    p += 8 + len;
    if (body.readUInt32LE(0) !== 5) { out.push([]); continue; }   // 5 = Polygon
    const nParts = body.readUInt32LE(36);
    const nPts = body.readUInt32LE(40);
    const parts = [];
    for (let i = 0; i < nParts; i++) parts.push(body.readUInt32LE(44 + 4 * i));
    parts.push(nPts);
    const off = 44 + 4 * nParts;
    const rings = [];
    for (let k = 0; k < nParts; k++) {
      const ring = [];
      for (let i = parts[k]; i < parts[k + 1]; i++) {
        ring.push([body.readDoubleLE(off + 16 * i), body.readDoubleLE(off + 16 * i + 8)]);
      }
      rings.push(ring);
    }
    out.push(rings);
  }
  return out;
}
