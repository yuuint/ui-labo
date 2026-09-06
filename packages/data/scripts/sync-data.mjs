#!/usr/bin/env node
/**
 * ynetlabo API から都道府県マスタを取得し、スナップショットを書き出す（ADR data-snapshot-from-api）。
 * 明示的に実行したときだけ通信する。通常のビルドはこの生成物だけを読む。
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const BASE = process.env.YNETLABO_API ?? "https://api.ynetlabo.net";
const OUT = fileURLToPath(new URL("../src/prefectures.api.json", import.meta.url));

const get = async (path) => {
  const res = await fetch(BASE + path);
  if (!res.ok) throw new Error(`${path} が ${res.status} を返しました`);
  return res.json();
};

const [prefs, areas] = await Promise.all([get("/com/prefs"), get("/com/pref_areas")]);

// 壊れたデータをコミットしないための検証
if (!Array.isArray(prefs?.prefs) || prefs.prefs.length !== 47)
  throw new Error(`/com/prefs が 47 件ではありません: ${prefs?.prefs?.length}`);
if (!Array.isArray(areas?.pref_areas) || areas.pref_areas.length < 1)
  throw new Error("/com/pref_areas が空です");
for (const p of prefs.prefs) {
  if (!/^\d{2}-[A-Z]{3}$/.test(p.pref_code ?? "")) throw new Error(`pref_code が不正: ${p.pref_code}`);
  if (!p.name_jp || !p.name || !p.prefarea_code) throw new Error(`欠けた項目があります: ${p.pref_code}`);
}

const snapshot = {
  _meta: {
    source: BASE,
    endpoints: ["/com/prefs", "/com/pref_areas"],
    fetchedAt: new Date().toISOString(),
    note: "生成物。手で編集しない。更新は npm run sync:data",
  },
  prefs: prefs.prefs
    .map(({ pref_code, name, name_jp, prefarea_code }) => ({ pref_code, name, name_jp, prefarea_code }))
    .sort((a, b) => a.pref_code.localeCompare(b.pref_code)),
  areas: areas.pref_areas
    .map(({ prefarea_code, name, name_jp }) => ({ prefarea_code, name, name_jp }))
    .sort((a, b) => a.prefarea_code.localeCompare(b.prefarea_code)),
};
writeFileSync(OUT, JSON.stringify(snapshot, null, 2) + "\n");
console.log(`sync:data  ${snapshot.prefs.length} 件 / エリア ${snapshot.areas.length} 件 → src/prefectures.api.json`);
