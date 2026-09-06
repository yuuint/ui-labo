/** 検索キーの正規化とローマ字変換。仕様は spec `prefecture-picker` の「検索」節 */

const O_DAN = "おこそとのほもよろごぞどぼぽょ";
const E_DAN = "えけせてねへめれげぜでべぺぇ";

/**
 * 1. NFKC / 2. 小文字化 / 3. カタカナ→ひらがな / 4. 長音の畳み込み / 5. 前後の空白除去
 *
 * 手順 4 は `ー` を除くだけでは足りない。日本語の長音は「とうきょう」（う）と
 * 「おおさか」（お）で表記が割れるため、母音に展開する方式ではどちらかが必ず外れる。
 * 畳んで「ときょ」「おさか」に寄せると、トーキョー / とうきょう / オーサカ / おおさか
 * がすべて同じ形に落ちる。
 */
export function normalize(input) {
  const s = input
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

const YOON = {
  きゃ:"kya",きゅ:"kyu",きょ:"kyo",しゃ:"sya",しゅ:"syu",しょ:"syo",
  ちゃ:"tya",ちゅ:"tyu",ちょ:"tyo",にゃ:"nya",にゅ:"nyu",にょ:"nyo",
  ひゃ:"hya",ひゅ:"hyu",ひょ:"hyo",みゃ:"mya",みゅ:"myu",みょ:"myo",
  りゃ:"rya",りゅ:"ryu",りょ:"ryo",ぎゃ:"gya",ぎゅ:"gyu",ぎょ:"gyo",
  じゃ:"zya",じゅ:"zyu",じょ:"zyo",びゃ:"bya",びゅ:"byu",びょ:"byo",
};
const MONO = {
  あ:"a",い:"i",う:"u",え:"e",お:"o",か:"ka",き:"ki",く:"ku",け:"ke",こ:"ko",
  さ:"sa",し:"si",す:"su",せ:"se",そ:"so",た:"ta",ち:"ti",つ:"tu",て:"te",と:"to",
  な:"na",に:"ni",ぬ:"nu",ね:"ne",の:"no",は:"ha",ひ:"hi",ふ:"hu",へ:"he",ほ:"ho",
  ま:"ma",み:"mi",む:"mu",め:"me",も:"mo",や:"ya",ゆ:"yu",よ:"yo",
  ら:"ra",り:"ri",る:"ru",れ:"re",ろ:"ro",わ:"wa",を:"wo",ん:"n",
  が:"ga",ぎ:"gi",ぐ:"gu",げ:"ge",ご:"go",ざ:"za",じ:"zi",ず:"zu",ぜ:"ze",ぞ:"zo",
  だ:"da",ぢ:"di",づ:"du",で:"de",ど:"do",ば:"ba",び:"bi",ぶ:"bu",べ:"be",ぼ:"bo",
  ぱ:"pa",ぴ:"pi",ぷ:"pu",ぺ:"pe",ぽ:"po",
};

/** かな → ワープロ式ローマ字。ヘボン式（API 由来）と併せて表記揺れを両対応にする */
export function toWapuro(kana) {
  let out = "", i = 0;
  while (i < kana.length) {
    if (kana[i] === "っ") {
      const rest = YOON[kana.slice(i + 1, i + 3)] ? kana.slice(i + 1, i + 3) : kana.slice(i + 1, i + 2);
      const next = toWapuro(rest);
      out += next[0] ?? ""; i += 1; continue;
    }
    const pair = kana.slice(i, i + 2);
    if (YOON[pair]) { out += YOON[pair]; i += 2; continue; }
    out += MONO[kana[i]] ?? kana[i]; i += 1;
  }
  return out;
}

/** 照合に使うキー。生成側に寄せることで 4 実装の検索結果を揃える */
export function searchKeys({ name, shortName, kana, kanaShort, romaji }) {
  const raw = [name, shortName, kana, kanaShort, romaji, toWapuro(kana), toWapuro(kanaShort)];
  return [...new Set(raw.map(normalize))].sort();
}
