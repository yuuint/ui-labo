/** codeFormat による値の表現。入出力で対称にする（spec `prefecture-picker` の「値の表現」） */

export function formatPrefecture(pref, codeFormat) {
  switch (codeFormat) {
    case "jisNumber": return Number(pref.code);
    case "ynetlabo":  return pref.ynetlaboCode;
    case "iso":       return "JP-" + pref.code;
    case "name":      return pref.name;
    case "shortName": return pref.shortName;
    default:          return pref.code;
  }
}

/** エリアの値。region9 のときだけ ynetlabo のエリアコードと一致する */
export function formatArea(key, { labels, memberCodes, byCode, codeFormat }) {
  if (codeFormat === "name" || codeFormat === "shortName") return labels[key];
  if (codeFormat === "ynetlabo") return byCode(memberCodes[0])?.areaCode ?? key;
  return key;
}

/** 表示に使う表記。codeFormat とは独立して指定できる */
export const displayOf = (pref, display) => (display === "shortName" ? pref.shortName : pref.name);

/** 受け取った値を内部のキー（県コード / エリアキー）に戻す。不正な値は未選択として扱う */
export function toKey(value, { level, prefectures, grouping, memberMap }) {
  if (value === null || value === undefined || value === "") return null;
  const s = String(value);
  if (level === "area") {
    if (memberMap[s]) return s;
    for (const [k, codes] of Object.entries(memberMap)) {
      const first = prefectures.find((p) => p.code === codes[0]);
      if (first?.areaCode === s) return k;
      if (grouping.labels[k] === s) return k;
    }
    return null;
  }
  const n = s.replace(/^JP-/, "");
  const hit = prefectures.find((p) =>
    p.code === n.padStart(2, "0") || p.ynetlaboCode === s || p.name === s || p.shortName === s);
  return hit ? hit.code : null;
}
