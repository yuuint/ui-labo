#!/usr/bin/env node
/**
 * スナップショット（API 由来）と補完テーブル（リポジトリ所有）を合成し、
 * 各プラットフォーム向けの定数を生成する（ADR supplement-merge）。
 * 通信は一切しない。ネットワーク遮断下でも通る。
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { searchKeys } from "./lib/kana.mjs";
import { verify } from "./lib/verify.mjs";

const r = (p) => JSON.parse(readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8"));
const out = (p) => fileURLToPath(new URL("../dist/" + p, import.meta.url));
mkdirSync(fileURLToPath(new URL("../dist", import.meta.url)), { recursive: true });

const api = r("../src/prefectures.api.json");
const supplement = r("../src/prefectures.supplement.json");
const outline = r("../src/japan-outline.json");

const errors = verify({ api, supplement, outline });
if (errors.length) {
  console.error("整合性検査に失敗しました:\n" + errors.map((e) => "  - " + e).join("\n"));
  process.exit(1);
}

const prefectures = api.prefs.map((p) => {
  const code = p.pref_code.slice(0, 2);
  const s = supplement[code];
  const rec = {
    code,
    ynetlaboCode: p.pref_code,
    name: s.name,
    shortName: p.name_jp,
    kana: s.kana,
    kanaShort: s.kanaShort,
    romaji: p.name.toLowerCase(),
    areaCode: p.prefarea_code,
  };
  return { ...rec, searchKeys: searchKeys(rec) };
});
const areas = api.areas.map((a) => ({ code: a.prefarea_code, name: a.name_jp, romaji: a.name.toLowerCase() }));

const BANNER = "// 生成物。手で編集しない。更新は npm run build（@ynetlabo/ui-data）";
const j = (v) => JSON.stringify(v);

// --- Web (ESM + 型) ---
writeFileSync(out("prefectures.js"),
  `${BANNER}\nexport const PREFECTURES = ${j(prefectures)};\nexport const AREAS = ${j(areas)};\n`);
writeFileSync(out("prefectures.d.ts"), `${BANNER}
export interface Prefecture {
  /** JIS X 0401 の 2 桁ゼロ埋め */
  code: string;
  /** ynetlabo API の pref_code */
  ynetlaboCode: string;
  name: string; shortName: string;
  kana: string; kanaShort: string;
  romaji: string; areaCode: string;
  /** 正規化済みの照合キー。実装側は部分一致だけを行う */
  searchKeys: string[];
}
export interface Area { code: string; name: string; romaji: string }
export declare const PREFECTURES: readonly Prefecture[];
export declare const AREAS: readonly Area[];
`);
writeFileSync(out("japan-outline.js"),
  `${BANNER}\nexport const VIEW_BOX = ${j(outline.viewBox)};\nexport const PATHS = ${j(outline.paths)};\n`);

// --- Flutter ---
const dartStr = (s) => "'" + String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
writeFileSync(out("prefectures.g.dart"), `${BANNER}
class YnPrefecture {
  const YnPrefecture({required this.code, required this.ynetlaboCode, required this.name,
    required this.shortName, required this.kana, required this.kanaShort,
    required this.romaji, required this.areaCode, required this.searchKeys});
  final String code, ynetlaboCode, name, shortName, kana, kanaShort, romaji, areaCode;
  final List<String> searchKeys;
}

const List<YnPrefecture> ynPrefectures = <YnPrefecture>[
${prefectures.map((p) => `  YnPrefecture(code: ${dartStr(p.code)}, ynetlaboCode: ${dartStr(p.ynetlaboCode)}, name: ${dartStr(p.name)}, shortName: ${dartStr(p.shortName)}, kana: ${dartStr(p.kana)}, kanaShort: ${dartStr(p.kanaShort)}, romaji: ${dartStr(p.romaji)}, areaCode: ${dartStr(p.areaCode)}, searchKeys: <String>[${p.searchKeys.map(dartStr).join(", ")}]),`).join("\n")}
];
`);

// --- SwiftUI ---
const sw = (s) => '"' + String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
writeFileSync(out("Prefectures.g.swift"), `${BANNER}
public struct YNPrefecture: Sendable, Hashable {
    public let code, ynetlaboCode, name, shortName, kana, kanaShort, romaji, areaCode: String
    public let searchKeys: [String]
}

public let ynPrefectures: [YNPrefecture] = [
${prefectures.map((p) => `    YNPrefecture(code: ${sw(p.code)}, ynetlaboCode: ${sw(p.ynetlaboCode)}, name: ${sw(p.name)}, shortName: ${sw(p.shortName)}, kana: ${sw(p.kana)}, kanaShort: ${sw(p.kanaShort)}, romaji: ${sw(p.romaji)}, areaCode: ${sw(p.areaCode)}, searchKeys: [${p.searchKeys.map(sw).join(", ")}]),`).join("\n")}
]
`);

console.log(`build  整合性検査 5 項目 OK / ${prefectures.length} 件・エリア ${areas.length} 件 → dist/ に 5 ファイル`);
