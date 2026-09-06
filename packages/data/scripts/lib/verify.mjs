/**
 * 合成時の整合性検査。1 つでも満たさなければビルドを失敗させる
 * （spec `prefecture-picker` の「整合性の保証」）。
 *
 * 検査 1 が、この構成における唯一の実質的なリスク
 * （API 側の増減に補完側が追随できていない状態）を機械的に捕まえる。
 */
export function verify({ api, supplement, outline }) {
  const errors = [];
  const codes = api.prefs.map((p) => p.pref_code.slice(0, 2));

  // 1. 補完テーブルのキー集合が API の JIS コード集合と過不足なく一致する
  const a = new Set(codes), b = new Set(Object.keys(supplement));
  const missing = [...a].filter((c) => !b.has(c));
  const extra = [...b].filter((c) => !a.has(c));
  if (codes.length !== 47) errors.push(`[1] API が 47 件ではありません: ${codes.length}`);
  if (missing.length) errors.push(`[1] 補完テーブルに無い: ${missing.join(", ")}`);
  if (extra.length) errors.push(`[1] 補完テーブルに余分: ${extra.join(", ")}`);

  for (const p of api.prefs) {
    const code = p.pref_code.slice(0, 2);
    const s = supplement[code];
    if (!s) continue;
    // 2. shortName が name の前方部分（等しい場合を含む。北海道が該当）
    if (!s.name.startsWith(p.name_jp)) errors.push(`[2] ${code} ${s.name} が ${p.name_jp} で始まりません`);
    // 3. kanaShort が kana の前方部分（同上）
    if (!s.kana.startsWith(s.kanaShort)) errors.push(`[3] ${code} ${s.kana} が ${s.kanaShort} で始まりません`);
    // 4. 47 件すべてが 1 つの areaCode に属する
    if (!p.prefarea_code) errors.push(`[4] ${code} に areaCode がありません`);
    // 5. japan-outline が 47 件すべてのパスを持つ
    if (!outline.paths[code]?.d) errors.push(`[5] ${code} の地図パスがありません`);
  }
  return errors;
}
