/**
 * 描画を伴わない部分の検査。要素そのものの挙動は実ブラウザで確認する
 * （DOM を持ち込むと第三者ライブラリが要り、依存ゼロの方針と衝突するため）。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { PREFECTURES } from "@ynetlabo/ui-data";
import { PATHS, VIEW_BOX } from "@ynetlabo/ui-data/outline";
import { normalize, match } from "@ynetlabo/ui-data/normalize";
import { grouping, members } from "../src/lib/grouping.js";
import { formatPrefecture, formatArea, displayOf, toKey } from "../src/lib/value.js";

const byCode = (c) => PREFECTURES.find((p) => p.code === c);

test("すべての区切りが 47 県を過不足なく覆う", () => {
  for (const name of ["region9", "region8", "region11", "kana"]) {
    const g = grouping(name), m = members(g, PREFECTURES);
    const total = Object.values(m).reduce((s, a) => s + a.length, 0);
    assert.equal(total, 47, name);
    const dup = Object.values(m).flat();
    assert.equal(new Set(dup).size, 47, `${name}: 重複がある`);
    for (const k of Object.keys(m)) assert.ok(k in g.labels, `${name}: ラベルの無いキー ${k}`);
  }
});

test("region9 と region11 で三重の所属が異なる（意図的）", () => {
  const mie = byCode("24");
  assert.equal(grouping("region9").keyOf(mie), "kinki");
  assert.equal(grouping("region11").keyOf(mie), "tokai");
});

test("region8 は沖縄を九州に含める", () => {
  const g = grouping("region8"), m = members(g, PREFECTURES);
  assert.ok(!("okinawa" in g.labels));
  assert.equal(g.labels.kyushu, "九州・沖縄");
  assert.ok(m.kyushu.includes("47"));
});

test("地理的でない区切りは geo=false（地図を持たない）", () => {
  assert.equal(grouping("region9").geo, true);
  assert.equal(grouping("kana").geo, false);
  assert.equal(grouping("none"), null);
});

test("codeFormat 6 種が仕様どおりの表現を返す", () => {
  const nagano = byCode("20");
  assert.equal(formatPrefecture(nagano, "jis"), "20");
  assert.equal(formatPrefecture(nagano, "jisNumber"), 20);
  assert.equal(formatPrefecture(nagano, "ynetlabo"), "20-NGN");
  assert.equal(formatPrefecture(nagano, "iso"), "JP-20");
  assert.equal(formatPrefecture(nagano, "name"), "長野県");
  assert.equal(formatPrefecture(nagano, "shortName"), "長野");
});

test("エリアの ynetlabo 表現は region9 のとき API のエリアコードと一致する", () => {
  const g = grouping("region9"), m = members(g, PREFECTURES);
  const args = (k) => ({ labels: g.labels, memberCodes: m[k], byCode, codeFormat: "ynetlabo" });
  assert.equal(formatArea("kanto", args("kanto")), "3-KTO");
  assert.equal(formatArea("okinawa", args("okinawa")), "9-OKA");
  assert.equal(formatArea("kanto", { ...args("kanto"), codeFormat: "jis" }), "kanto");
  assert.equal(formatArea("kanto", { ...args("kanto"), codeFormat: "name" }), "関東");
});

test("display は codeFormat と独立している", () => {
  const t = byCode("13");
  assert.equal(displayOf(t, "name"), "東京都");
  assert.equal(displayOf(t, "shortName"), "東京");
  assert.equal(formatPrefecture(t, "jisNumber"), 13);   // 表示を変えても値は変わらない
});

test("受け取った値を内部キーへ戻せる。不正な値は未選択", () => {
  const g = grouping("region9"), m = members(g, PREFECTURES);
  const opts = { level: "prefecture", prefectures: PREFECTURES, grouping: g, memberMap: m };
  for (const v of ["13", 13, "13-TOK", "JP-13", "東京都", "東京"]) {
    assert.equal(toKey(v, opts), "13", String(v));
  }
  for (const v of ["99", "", null, undefined, "ありません"]) {
    assert.equal(toKey(v, opts), null, String(v));
  }
  const area = { ...opts, level: "area" };
  assert.equal(toKey("kanto", area), "kanto");
  assert.equal(toKey("3-KTO", area), "kanto");
  assert.equal(toKey("関東", area), "kanto");
  assert.equal(toKey("nowhere", area), null);
});

test("検索は生成済みのキーへの部分一致だけで済む", () => {
  for (const q of ["とうきょう", "tokyo", "toukyou", "東京", "トーキョー"]) {
    assert.deepEqual(match(PREFECTURES, q).map((p) => p.name), ["東京都"], q);
  }
  assert.deepEqual(match(PREFECTURES, "オーサカ").map((p) => p.name), ["大阪府"]);
  assert.equal(match(PREFECTURES, "  ")?.length ?? null, null, "空白のみは絞り込まない");
  assert.deepEqual(match(PREFECTURES, "ありえない"), []);
});

test("前方一致が部分一致より上に並ぶ", () => {
  const hits = match(PREFECTURES, "しま").map((p) => p.name);
  assert.equal(hits[0], "島根県", hits.join(","));
  assert.ok(hits.includes("福島県") && hits.includes("広島県"));
});

test("地図のパスが 47 件そろい、ラベル位置が viewBox に収まる", () => {
  assert.equal(Object.keys(PATHS).length, 47);
  for (const p of PREFECTURES) {
    const o = PATHS[p.code];
    assert.ok(o?.d?.startsWith("M"), `${p.code} のパス`);
    const [cx, cy] = o.c;
    assert.ok(cx >= 0 && cx <= VIEW_BOX.w, `${p.code} のラベル x が範囲外`);
    assert.ok(cy >= 0 && cy <= VIEW_BOX.h, `${p.code} のラベル y が範囲外`);
  }
});

test("要素の定義ファイルがタグを登録し、素の Custom Elements で書かれている", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("../src/components/prefecture-picker/yn-prefecture-picker.js", import.meta.url), "utf8");
  assert.match(src, /customElements\.define\("yn-prefecture-picker"/);
  assert.match(src, /static formAssociated = true/);
  assert.ok(!/from "(?!\.|@ynetlabo\/)/.test(src), "第三者ライブラリを import している");
});

test("基底クラスは小さいまま（300 行を超えたら方針を見直す）", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("../src/base/element.js", import.meta.url), "utf8");
  const lines = src.split("\n").length;
  assert.ok(lines <= 300, `基底クラスが ${lines} 行。ADR plain-web-custom-elements の再検討条件`);
});
