/** 区切り（grouping）の定義。仕様は spec `prefecture-picker` の「区切り」 */

const AREA_KEY = {
  "1-HKD": "hokkaido", "2-THK": "tohoku", "3-KTO": "kanto", "4-CHB": "chubu",
  "5-KNK": "kinki", "6-CGK": "chugoku", "7-SKK": "shikoku", "8-KYS": "kyushu", "9-OKA": "okinawa",
};
const R9 = { hokkaido:"北海道", tohoku:"東北", kanto:"関東", chubu:"中部", kinki:"近畿",
             chugoku:"中国", shikoku:"四国", kyushu:"九州", okinawa:"沖縄" };
const R8 = { ...R9, kyushu: "九州・沖縄" };
delete R8.okinawa;
const R11 = { hokkaido:"北海道", tohoku:"東北", kanto:"関東", hokuriku:"北陸", koshinetsu:"甲信越",
              tokai:"東海", kinki:"近畿", chugoku:"中国", shikoku:"四国", kyushu:"九州", okinawa:"沖縄" };

/** region11 では中部を 3 つに分け、三重を近畿から東海へ移す。region9 との差は意図的 */
function region11(code) {
  const n = Number(code);
  if (n === 1) return "hokkaido";
  if (n <= 7) return "tohoku";
  if (n <= 14) return "kanto";
  if (n === 15 || n === 19 || n === 20) return "koshinetsu";
  if (n <= 18) return "hokuriku";
  if (n <= 24) return "tokai";
  if (n <= 30) return "kinki";
  if (n <= 35) return "chugoku";
  if (n <= 39) return "shikoku";
  if (n <= 46) return "kyushu";
  return "okinawa";
}

const KANA_ROWS = [
  ["a","あ行","あいうえお"], ["ka","か行","かきくけこがぎぐげご"],
  ["sa","さ行","さしすせそざじずぜぞ"], ["ta","た行","たちつてとだぢづでど"],
  ["na","な行","なにぬねの"], ["ha","は行","はひふへほばびぶべぼぱぴぷぺぽ"],
  ["ma","ま行","まみむめも"], ["ya","や行","やゆよ"],
  ["ra","ら行","らりるれろ"], ["wa","わ行","わをん"],
];

/**
 * @returns {{labels: Record<string,string>, keyOf: (p) => string, geo: boolean} | null}
 *   geo が false の区切りは地図を持たないため、layout="map" でも一覧として描く
 */
export function grouping(name) {
  switch (name) {
    case "region9":  return { labels: R9,  keyOf: (p) => AREA_KEY[p.areaCode], geo: true };
    case "region8":  return { labels: R8,  keyOf: (p) => { const k = AREA_KEY[p.areaCode]; return k === "okinawa" ? "kyushu" : k; }, geo: true };
    case "region11": return { labels: R11, keyOf: (p) => region11(p.code), geo: true };
    case "kana": return {
      labels: Object.fromEntries(KANA_ROWS.map(([k, l]) => [k, l])),
      keyOf: (p) => (KANA_ROWS.find((r) => r[2].includes(p.kanaShort[0])) ?? KANA_ROWS.at(-1))[0],
      geo: false,
    };
    case "none": return null;
    default: return null;
  }
}

/** 区切りごとの所属。キーの並びは labels の順を保つ */
export function members(g, prefectures) {
  const map = Object.fromEntries(Object.keys(g.labels).map((k) => [k, []]));
  for (const p of prefectures) (map[g.keyOf(p)] ??= []).push(p.code);
  return map;
}
