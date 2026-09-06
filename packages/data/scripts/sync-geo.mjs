#!/usr/bin/env node
/**
 * Natural Earth（パブリックドメイン）から日本の県境を取得し、
 * 簡略化・平滑化・投影して日本地図のパスを書き出す（ADR japan-map-geodata）。
 * 明示的に実行したときだけ通信する。元データ（15MB）はコミットしない。
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { unzip, readDbf, readShpPolygons } from "./lib/shapefile.mjs";
import { simplify, chaikin, signedArea, area, centroid } from "./lib/geom.mjs";

const URL_NE = "https://naciscdn.org/naturalearth/10m/cultural/ne_10m_admin_1_states_provinces.zip";
const CACHE = fileURLToPath(new URL("../.cache/ne.zip", import.meta.url));
const OUT = fileURLToPath(new URL("../src/japan-outline.json", import.meta.url));

// --- 取得（キャッシュがあれば再利用。CI では毎回取り直す必要はない） ---
let zipBuf;
if (existsSync(CACHE)) {
  zipBuf = readFileSync(CACHE);
  console.log("sync:geo  キャッシュを使用");
} else {
  console.log("sync:geo  取得中 " + URL_NE);
  const res = await fetch(URL_NE);
  if (!res.ok) throw new Error(`配布元が ${res.status} を返しました`);
  zipBuf = Buffer.from(await res.arrayBuffer());
  mkdirSync(fileURLToPath(new URL("../.cache", import.meta.url)), { recursive: true });
  writeFileSync(CACHE, zipBuf);
}

const files = unzip(zipBuf);
const stem = "ne_10m_admin_1_states_provinces";
const rows = readDbf(files.get(stem + ".dbf"), new Set(["adm0_a3", "iso_3166_2", "name_ja"]));
const geo = readShpPolygons(files.get(stem + ".shp"));

const prefs = new Map();
rows.forEach((r, i) => {
  if (!r || r.adm0_a3 !== "JPN") return;
  const m = /^JP-(\d{2})$/.exec(r.iso_3166_2 ?? "");
  if (!m || !geo[i]?.length) return;
  prefs.set(m[1], { name: r.name_ja, rings: geo[i] });
});
if (prefs.size !== 47) throw new Error(`日本の都道府県が 47 件ではありません: ${prefs.size}`);

// --- 簡略化・平滑化 ---
const ISLAND_GAP = 1.15;     // 本島からこの度数以上離れた島は落とす
const MIN_RATIO = 0.007;     // 最大リング比でこの割合未満の島は落とす
let raw = 0, kept = 0;
for (const [code, p] of prefs) {
  let rs = [...p.rings].sort((a, b) => area(b) - area(a));
  raw += rs.reduce((s, r) => s + r.length, 0);

  // 穴リング（最大リングと逆向き）を落とし、残りの向きを揃える。
  // 揃えないと、エリアを 1 パスに結合したとき塗りが打ち消し合って穴が空く
  const sign = Math.sign(signedArea(rs[0])) || 1;
  rs = rs.filter((r) => Math.sign(signedArea(r)) === sign)
         .map((r) => (Math.sign(signedArea(r)) === 1 ? r : [...r].reverse()));

  const amax = area(rs[0]);
  const mc = centroid(rs[0]);
  rs = rs.filter((r) => area(r) >= amax * MIN_RATIO)
         .filter((r) => Math.hypot(centroid(r)[0] - mc[0], centroid(r)[1] - mc[1]) <= ISLAND_GAP)
         .slice(0, 8);

  p.rings = rs
    .map((r) => simplify(r, 0.024))
    .filter((r) => r.length >= 4)
    .map((r) => simplify(chaikin(r, 2), 0.0035))
    .filter((r) => r.length >= 4);
  kept += p.rings.reduce((s, r) => s + r.length, 0);
  if (!p.rings.length) throw new Error(`${code} のリングが空になりました`);
}

// --- 投影（cos37° 補正の正距円筒図法）と viewBox への正規化 ---
const K = Math.cos((37 * Math.PI) / 180);
const bounds = (codes) => {
  const xs = [], ys = [];
  for (const c of codes) for (const r of prefs.get(c).rings) for (const [x, y] of r) { xs.push(x * K); ys.push(-y); }
  return [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
};
const main = [...prefs.keys()].filter((c) => c !== "47");
const [mx0, mx1, my0, my1] = bounds(main);
const W = 1000, PAD = 12;
const H = Math.round((((my1 - my0) / (mx1 - mx0)) * (W - 2 * PAD) + 2 * PAD) * 10) / 10;
const r1 = (n) => Math.round(n * 10) / 10;
const T = (x, y) => [r1(PAD + ((x * K - mx0) / (mx1 - mx0)) * (W - 2 * PAD)),
                     r1(PAD + ((-y - my0) / (my1 - my0)) * (H - 2 * PAD))];
const [ox0, ox1, oy0, oy1] = bounds(["47"]);
const INSET = { x: 648, y: r1(H - 232), w: 268, h: 210 };
const so = Math.min((INSET.w - 16) / (ox1 - ox0), (INSET.h - 30) / (oy1 - oy0));
const TO = (x, y) => [r1(INSET.x + 8 + (x * K - ox0) * so), r1(INSET.y + 12 + (-y - oy0) * so)];

const paths = {};
for (const code of [...prefs.keys()].sort()) {
  const t = code === "47" ? TO : T;
  const rings = prefs.get(code).rings.map((r) => r.map(([x, y]) => t(x, y)));
  const d = rings.map((r) => "M" + r.map(([a, b]) => `${a},${b}`).join(" ") + "Z").join("");
  const all = rings.flat(), first = rings[0];
  paths[code] = {
    n: prefs.get(code).name,
    d,
    b: [r1(Math.min(...all.map((p) => p[0]))), r1(Math.min(...all.map((p) => p[1]))),
        r1(Math.max(...all.map((p) => p[0]))), r1(Math.max(...all.map((p) => p[1])))],
    c: [r1(first.reduce((s, p) => s + p[0], 0) / first.length),
        r1(first.reduce((s, p) => s + p[1], 0) / first.length)],
  };
}

writeFileSync(OUT, JSON.stringify({
  _meta: {
    source: "Natural Earth ne_10m_admin_1_states_provinces",
    license: "public domain（出典明記・利用報告とも不要）",
    url: "https://www.naturalearthdata.com/",
    generatedAt: new Date().toISOString(),
    note: "生成物。手で編集しない。更新は npm run sync:geo",
  },
  viewBox: { w: W, h: H, inset: INSET },
  paths,
}, null, 0) + "\n");
console.log(`sync:geo  47 件 / 頂点 ${raw} → ${kept} / viewBox 0 0 ${W} ${H} → src/japan-outline.json`);
