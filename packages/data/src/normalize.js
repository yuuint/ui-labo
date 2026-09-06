/**
 * 検索クエリと searchKeys の正規化。**実装はここ 1 か所だけ**に置く。
 * 生成側（searchKeys の作成）と実行側（クエリの正規化）が同じ関数を使わないと、
 * 検索結果が必ずズレる（spec `prefecture-picker` の「検索」）。
 *
 * 1. NFKC / 2. 小文字化 / 3. カタカナ→ひらがな / 4. 長音の畳み込み / 5. 前後の空白除去
 *
 * 手順 4 は `ー` を除くだけでは足りない。日本語の長音は「とうきょう」（う）と
 * 「おおさか」（お）で表記が割れるため、母音に展開する方式ではどちらかが必ず外れる。
 * 畳んで「ときょ」「おさか」に寄せると、トーキョー / とうきょう / オーサカ / おおさか
 * がすべて同じ形に落ちる。
 */
const O_DAN = "おこそとのほもよろごぞどぼぽょ";
const E_DAN = "えけせてねへめれげぜでべぺぇ";

export function normalize(input) {
  const s = String(input)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .replace(/ー/g, "")
    .trim();
  let out = "";
  for (const ch of s) {
    const prev = out[out.length - 1];
    if (prev && O_DAN.includes(prev) && (ch === "う" || ch === "お")) continue;
    if (prev && E_DAN.includes(prev) && (ch === "い" || ch === "え")) continue;
    out += ch;
  }
  return out;
}

/**
 * 正規化済みの searchKeys に対する照合。前方一致を上位に並べる。
 * 実装側はこれだけを行い、ローマ字変換やかなの規則を持たない。
 */
export function match(items, query) {
  const q = normalize(query);
  if (!q) return null;
  const head = [], rest = [];
  for (const it of items) {
    if (it.searchKeys.some((k) => k.startsWith(q))) head.push(it);
    else if (it.searchKeys.some((k) => k.includes(q))) rest.push(it);
  }
  return [...head, ...rest];
}
