#!/usr/bin/env node
/**
 * 公開サイトを組み立てる。依存ゼロ（ADR plain-web-custom-elements の方針をサイトにも適用）。
 *
 * やることは 3 つだけ。
 *   1. packages/ の配布物を dist/lib/ へ複製する（サイトは実物のコードを動かす）
 *   2. docs/specs/ の frontmatter と API 表から HTML の断片を作る
 *   3. src/*.html の <!--#name--> を断片で置き換えて dist/ へ書く
 *
 * spec を唯一のソースにしているため、仕様を直せばサイトも直る。
 * 逆にサイト側で表を手書きすると必ずずれるので、手書きしない。
 */
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync, cpSync } from "node:fs";
import { join } from "node:path";

const HERE = new URL("..", import.meta.url).pathname;
const ROOT = new URL("../../../", import.meta.url).pathname;
const SRC = join(HERE, "src");
const DIST = join(HERE, "dist");

const PLATFORMS = [
  ["web", "プレーン Web"],
  ["vue", "Vue"],
  ["flutter", "Flutter"],
  ["swiftui", "SwiftUI"],
];

// ---- spec の読み取り ------------------------------------------------------

/** frontmatter だけを読む。YAML の完全実装は要らないので、使う形だけを扱う */
function frontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return {};
  const out = {};
  let nest = null;
  for (const line of m[1].split("\n")) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const indented = /^\s/.test(line);
    const kv = line.trim().match(/^([\w-]+):\s*(.*)$/);
    if (!kv) continue;
    const [, key, value] = kv;
    if (indented && nest) out[nest][key] = value;
    else if (value === "") { nest = key; out[key] = {}; }
    else { nest = null; out[key] = value; }
  }
  return out;
}

function specs() {
  const dir = join(ROOT, "docs/specs");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md") && f !== "README.md" && !f.startsWith("_"))
    .map((f) => {
      const body = readFileSync(join(dir, f), "utf8");
      return { file: f, ...frontmatter(body), body };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** 見出しの直後にある markdown の表を取り出す */
function tableUnder(body, heading) {
  const lines = body.split("\n");
  const at = lines.findIndex((l) => l.trim() === heading);
  if (at < 0) throw new Error(`見出しが無い: ${heading}`);
  const rows = [];
  for (let i = at + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("|")) rows.push(line);
    else if (rows.length) break;
  }
  if (!rows.length) throw new Error(`表が無い: ${heading}`);
  return rows
    .filter((r) => !/^\|[\s:|-]+\|$/.test(r))
    .map((r) => r.replace(/^\||\|$/g, "").split(/(?<!\\)\|/).map((c) => c.trim()));
}

// ---- markdown → HTML（使う範囲だけ） --------------------------------------

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** 表のセルで使っている記法だけを変換する。汎用の markdown 変換ではない */
function inline(md) {
  return esc(md.replace(/\\\|/g, "|"))
    .replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`)
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
}

const cell = (c) => (c === "" || c === "—" ? '<span class="nil">—</span>' : inline(c));

function htmlTable(rows, className = "") {
  const [head, ...body] = rows;
  return `<div class="tablebox"><table${className ? ` class="${className}"` : ""}>`
    + `<thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead>`
    + `<tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${cell(c)}</td>`).join("")}</tr>`).join("")}</tbody>`
    + `</table></div>`;
}

// ---- 断片 -----------------------------------------------------------------

/** 対応状況。docs/specs の frontmatter が唯一のソース（docs/specs/README.md の取り決め） */
function matrix(list) {
  const head = `<tr><th>コンポーネント</th>${PLATFORMS.map(([, l]) => `<th>${l}</th>`).join("")}</tr>`;
  const rows = list
    .filter((s) => s.platforms)
    .map((s) => {
      const cells = PLATFORMS.map(([k]) => {
        const v = s.platforms[k] ?? "none";
        return `<td><span class="badge is-${v}">${v}</span></td>`;
      }).join("");
      const href = s.name === "prefecture-picker" ? "./prefecture-picker.html" : null;
      const title = href ? `<a href="${href}">${esc(s.title)}</a>` : esc(s.title);
      return `<tr><th scope="row">${title}<code>${esc(s.name)}</code></th>${cells}</tr>`;
    })
    .join("");
  return `<div class="tablebox"><table class="matrix"><thead>${head}</thead><tbody>${rows}</tbody></table></div>`;
}

// ---- 組み立て -------------------------------------------------------------

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

// 1. 実物のコードを置く。サイトのデモは npm で配るものと同じファイルを動かす
mkdirSync(join(DIST, "lib/data"), { recursive: true });
cpSync(join(ROOT, "packages/core/src"), join(DIST, "lib/core"), { recursive: true });
for (const [from, to] of [
  ["packages/data/dist/prefectures.js", "lib/data/prefectures.js"],
  ["packages/data/dist/japan-outline.js", "lib/data/japan-outline.js"],
  ["packages/data/src/normalize.js", "lib/data/normalize.js"],
  ["packages/tokens/dist/tokens.css", "lib/tokens.css"],
]) cpSync(join(ROOT, from), join(DIST, to));

// 2. 断片
const list = specs();
const picker = list.find((s) => s.name === "prefecture-picker");
const fragments = {
  matrix: matrix(list),
  "api-prefecture-picker": htmlTable(tableUnder(picker.body, "### API"), "api"),
  "grouping-prefecture-picker": htmlTable(tableUnder(picker.body, "### 区切り — `grouping`")),
  "codeformat-prefecture-picker": htmlTable(tableUnder(picker.body, "### 値の表現 — `codeFormat`")),
};

// 3. ページ
let pages = 0;
for (const name of readdirSync(SRC)) {
  const from = join(SRC, name);
  if (!name.endsWith(".html")) { cpSync(from, join(DIST, name)); continue; }
  const html = readFileSync(from, "utf8").replace(/<!--#([\w-]+)-->/g, (all, key) => {
    if (!(key in fragments)) throw new Error(`${name}: 未知の差し込み <!--#${key}-->`);
    return fragments[key];
  });
  writeFileSync(join(DIST, name), html);
  pages++;
}

// GitHub Pages の Jekyll を止める。_ で始まる名前が消えるのを防ぐ
writeFileSync(join(DIST, ".nojekyll"), "");

console.log(`site  ${pages} ページ / spec ${list.length} 件から生成`);
