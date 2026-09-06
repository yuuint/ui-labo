#!/usr/bin/env node
/**
 * 共有カード（og.png 1200×630）を作る。
 *
 * 生成物は src/og.png としてコミットする。CI に画用のブラウザを要求しないため、
 * 見た目を変えたときだけ手元で `npm run og -w @ynetlabo/ui-site` を叩く。
 *
 * 地図は実データから描く。イラストを別途用意すると、区切りの色や形が
 * 本体と食い違ったときに気づけないため。
 */
import { readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { PREFECTURES } from "../../../packages/data/dist/prefectures.js";
import { VIEW_BOX, PATHS } from "../../../packages/data/dist/japan-outline.js";
import { grouping, members } from "../../../packages/core/src/lib/grouping.js";

const HERE = new URL("..", import.meta.url).pathname;
const ROOT = new URL("../../../", import.meta.url).pathname;
const OUT = join(HERE, "src/og.png");
const TMP = join(HERE, "scripts/.og.html");

const CHROME = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].find(existsSync);
if (!CHROME) throw new Error("Chrome が見つからない（og.png は生成済みのものをコミットしてある）");

// トークンの色をそのまま使う。サイトと同じ見た目にするため CSS から読む
const css = readFileSync(join(ROOT, "packages/tokens/dist/tokens.css"), "utf8");
const token = (name) => css.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1]?.trim()
  ?? (() => { throw new Error(`トークンが無い: ${name}`); })();

const g = grouping("region9");
const byArea = members(g, PREFECTURES);
const areaOf = Object.fromEntries(
  Object.entries(byArea).flatMap(([k, codes]) => codes.map((c) => [c, k])));
const idx = Object.fromEntries(Object.keys(g.labels).map((k, i) => [k, i]));

const paths = PREFECTURES.map((p) => {
  const k = areaOf[p.code];
  const color = token(`color-area-${(idx[k] % 11) + 1}`);
  return `<path d="${PATHS[p.code].d}" fill="${color}" fill-opacity=".62" `
       + `stroke="${token("color-land-line")}" stroke-width="1" stroke-linejoin="round"/>`;
}).join("");

writeFileSync(TMP, `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><style>
  @page { size: 1200px 630px }
  * { margin: 0; box-sizing: border-box }
  body { width: 1200px; height: 630px; background: ${token("color-bg")};
         color: ${token("color-ink")}; overflow: hidden; position: relative;
         font-family: system-ui, -apple-system, "Hiragino Sans", sans-serif; }
  .ribbon { display: flex; height: 8px }
  .ribbon i { flex: 1 }
  .body { display: flex; height: calc(630px - 8px) }
  .txt { flex: 1; padding: 64px 0 64px 72px; display: flex; flex-direction: column; justify-content: center }
  .brand { font-family: ui-monospace, Menlo, monospace; font-size: 22px; font-weight: 700;
           letter-spacing: -.01em; color: ${token("color-ink3")}; margin-bottom: 22px }
  h1 { font-size: 62px; line-height: 1.22; letter-spacing: -.025em; font-weight: 700 }
  h1 em { font-style: normal; color: ${token("color-accent")} }
  p { margin-top: 24px; font-size: 25px; line-height: 1.62; color: ${token("color-ink2")} }
  .pkg { margin-top: 34px; font-family: ui-monospace, Menlo, monospace; font-size: 20px;
         color: ${token("color-ink2")}; background: ${token("color-surface")};
         border: 1px solid ${token("color-line2")}; border-radius: 999px;
         padding: 9px 22px; align-self: flex-start }
  .map { width: 520px; display: grid; place-items: center; padding: 24px 48px 24px 0 }
  svg { width: 100%; height: 100%; object-fit: contain }
</style></head><body>
  <div class="ribbon">${Array.from({ length: 9 },
    (_, i) => `<i style="background:${token(`color-area-${i + 1}`)}"></i>`).join("")}</div>
  <div class="body">
    <div class="txt">
      <div class="brand">ynetlabo</div>
      <h1>ui-labo<br><em>都道府県 Picker</em></h1>
      <p>日本地図から選ぶ、<br>依存ゼロのカスタム要素</p>
      <div class="pkg">npm i @ynetlabo/ui-core</div>
    </div>
    <div class="map">
      <svg viewBox="0 0 ${VIEW_BOX.w} ${VIEW_BOX.h}" xmlns="http://www.w3.org/2000/svg">${paths}</svg>
    </div>
  </div>
</body></html>`);

execFileSync(CHROME, [
  "--headless", "--disable-gpu", "--hide-scrollbars",
  "--force-color-profile=srgb", "--window-size=1200,630",
  `--screenshot=${OUT}`, `file://${TMP}`,
], { stdio: "ignore" });
rmSync(TMP);

console.log(`og.png を書き出しました: ${OUT}`);
