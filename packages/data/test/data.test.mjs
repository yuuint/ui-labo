import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { normalize, toWapuro, searchKeys } from "../scripts/lib/kana.mjs";
import { verify } from "../scripts/lib/verify.mjs";
import { signedArea } from "../scripts/lib/geom.mjs";

const r = (p) => JSON.parse(readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8"));
const txt = (p) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");
const api = r("../src/prefectures.api.json");
const supplement = r("../src/prefectures.supplement.json");
const outline = r("../src/japan-outline.json");
const { PREFECTURES, AREAS } = await import("../dist/prefectures.js");

test("整合性検査 5 項目を満たす", () => {
  assert.deepEqual(verify({ api, supplement, outline }), []);
});

test("47 件あり、JIS コードが 01〜47 に重複なく対応する", () => {
  assert.equal(PREFECTURES.length, 47);
  const codes = PREFECTURES.map((p) => p.code);
  assert.equal(new Set(codes).size, 47);
  assert.deepEqual(codes, [...codes].sort());
  assert.deepEqual(codes, Array.from({ length: 47 }, (_, i) => String(i + 1).padStart(2, "0")));
});

test("補完テーブルの検査が、キーの過不足を捕まえる", () => {
  const broken = { ...supplement };
  delete broken["13"];
  const errs = verify({ api, supplement: broken, outline });
  assert.ok(errs.some((e) => e.startsWith("[1]")), errs.join("\n"));
});

test("北海道は shortName と name が等しくても前方一致検査を通る", () => {
  const h = PREFECTURES.find((p) => p.code === "01");
  assert.equal(h.name, "北海道");
  assert.equal(h.shortName, "北海道");
  assert.equal(h.kana, h.kanaShort);
});

test("とうきょう / tokyo / toukyou / 東京 のすべてで東京都に到達する", () => {
  const hit = (q) => PREFECTURES.filter((p) => p.searchKeys.some((k) => k.startsWith(normalize(q))));
  for (const q of ["とうきょう", "tokyo", "toukyou", "東京", "トウキョウ", "ﾄｳｷｮｳ", "TOKYO"]) {
    const names = hit(q).map((p) => p.name);
    assert.deepEqual(names, ["東京都"], `${q} → ${names.join(",")}`);
  }
});

test("長音の畳み込みが効く（トーキョー / オーサカ / コーチ）", () => {
  const hit = (q) => PREFECTURES.filter((p) => p.searchKeys.some((k) => k.startsWith(normalize(q))))
    .map((p) => p.name);
  assert.deepEqual(hit("トーキョー"), ["東京都"]);
  assert.deepEqual(hit("オーサカ"), ["大阪府"]);
  assert.deepEqual(hit("コーチ"), ["高知県"]);
  // 「ー」を除くだけでは足りないことの確認
  assert.equal(normalize("トーキョー"), normalize("とうきょう"));
  assert.equal(normalize("オーサカ"), normalize("おおさか"));
});

test("ヘボン式とワープロ式が両方入り、表記揺れに両対応する", () => {
  const f = PREFECTURES.find((p) => p.code === "07");
  assert.ok(f.searchKeys.includes("fukushima"), "ヘボン式");
  assert.ok(f.searchKeys.includes(toWapuro(f.kanaShort)), "ワープロ式");
  const c = PREFECTURES.find((p) => p.code === "12");
  assert.ok(c.searchKeys.includes("chiba") && c.searchKeys.includes("tiba"));
});

test("正規化後の searchKeys が 47 件のあいだで重複しない", () => {
  const seen = new Map();
  for (const p of PREFECTURES) for (const k of p.searchKeys) {
    if (seen.has(k) && seen.get(k) !== p.code) assert.fail(`"${k}" が ${seen.get(k)} と ${p.code} で重複`);
    seen.set(k, p.code);
  }
});

test("47 件すべてが 1 つのエリアに属し、エリアは実在する", () => {
  const areas = new Set(AREAS.map((a) => a.code));
  for (const p of PREFECTURES) assert.ok(areas.has(p.areaCode), `${p.code} の ${p.areaCode}`);
});

test("地図パスの向きが全リングで揃っている（エリア結合時に穴が空かない）", () => {
  // 符号がどちらかは問わない（投影で Y を反転するため負になる）。
  // 揃っていることが要件で、揃っていないと結合時に塗りが打ち消し合う。
  const NUM = /(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g;
  let expected = null, count = 0;
  for (const [code, o] of Object.entries(outline.paths)) {
    const rings = o.d.split("Z").filter(Boolean);
    assert.ok(rings.length >= 1, `${code} にリングがありません`);
    for (const ring of rings) {
      const pts = [...ring.matchAll(NUM)].map((m) => [Number(m[1]), Number(m[2])]);
      assert.ok(pts.length >= 4, `${code} のリングが短すぎます`);
      const sign = Math.sign(signedArea(pts));
      assert.notEqual(sign, 0, `${code} に面積ゼロのリングがあります`);
      expected ??= sign;
      assert.equal(sign, expected, `${code} に逆向きのリングがあります`);
      count++;
    }
  }
  assert.ok(count >= 47, `リングが少なすぎます: ${count}`);
});

test("生成物が 47 件・同一順序で揃っている（TS / Dart / Swift）", () => {
  const order = PREFECTURES.map((p) => p.code);
  const pick = (src, re) => [...src.matchAll(re)].map((m) => m[1]);
  assert.deepEqual(pick(txt("../dist/prefectures.g.dart"), /YnPrefecture\(code: '(\d{2})'/g), order);
  assert.deepEqual(pick(txt("../dist/Prefectures.g.swift"), /YNPrefecture\(code: "(\d{2})"/g), order);
  assert.equal(Object.keys(outline.paths).length, 47);
});

test("searchKeys は生成側で決まり、実装側は部分一致だけでよい", () => {
  const t = PREFECTURES.find((p) => p.code === "13");
  assert.deepEqual(searchKeys(t), t.searchKeys);
});
