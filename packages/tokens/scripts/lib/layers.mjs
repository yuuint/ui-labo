/**
 * 3 層（primitive → semantic → component）の参照方向を検査する。
 *
 * component が primitive を直接参照すると、semantic 層の絶縁が破れ、
 * 「semantic を差し替えれば全コンポーネント／primitive を差し替えれば全テーマ」
 * という 2 軸の独立が失われる（spec `design-tokens`）。
 * 規約では守れないので、ビルドで落とす。
 */
import { readFileSync } from "node:fs";

/** トークンファイルから、定義されている葉のドット表記パスを集める */
export function definedPaths(file) {
  const out = new Set();
  const walk = (node, path) => {
    if (node === null || typeof node !== "object") return;
    if ("$value" in node) { out.add(path.join(".")); return; }
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith("$")) continue;
      walk(v, [...path, k]);
    }
  };
  walk(JSON.parse(readFileSync(file, "utf8")), []);
  return out;
}

/** ファイル内の {a.b.c} 参照を、参照元のパスつきで集める */
export function references(file) {
  const out = [];
  const walk = (node, path) => {
    if (node === null || typeof node !== "object") return;
    if ("$value" in node) {
      const v = node.$value;
      if (typeof v === "string") {
        for (const m of v.matchAll(/\{([^}]+)\}/g)) out.push({ from: path.join("."), to: m[1] });
      }
      return;
    }
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith("$")) continue;
      walk(v, [...path, k]);
    }
  };
  walk(JSON.parse(readFileSync(file, "utf8")), []);
  return out;
}

/** @returns 違反の説明の配列。空なら問題なし */
export function checkLayers({ primitiveFiles, semanticFiles, componentFiles }) {
  const union = (files) => files.reduce((s, f) => new Set([...s, ...definedPaths(f)]), new Set());
  const primitive = union(primitiveFiles);
  const semantic = union(semanticFiles);
  const errors = [];

  for (const f of componentFiles) {
    for (const { from, to } of references(f)) {
      if (semantic.has(to)) continue;
      if (primitive.has(to)) errors.push(`component "${from}" が primitive "${to}" を直接参照しています`);
      else errors.push(`component "${from}" の参照先 "${to}" が見つかりません`);
    }
  }
  for (const f of semanticFiles) {
    for (const { from, to } of references(f)) {
      if (primitive.has(to) || semantic.has(to)) continue;
      errors.push(`semantic "${from}" の参照先 "${to}" が見つかりません`);
    }
  }
  return errors;
}
