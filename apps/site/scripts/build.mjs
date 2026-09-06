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
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync, cpSync, existsSync } from "node:fs";
import { join } from "node:path";

const HERE = new URL("..", import.meta.url).pathname;
const ROOT = new URL("../../../", import.meta.url).pathname;
const SRC = join(HERE, "src");
const DIST = join(HERE, "dist");

/**
 * サイト全体の設定。GA4 の測定 ID は秘密ではない（ページのソースに出る）ので
 * リポジトリに置く。空なら計測タグを一切出さない — 手元のビルドで
 * 本番の数字を汚さないため。環境変数で上書きできる。
 */
const CONFIG = JSON.parse(readFileSync(join(HERE, "site.config.json"), "utf8"));
const GA4 = process.env.GA_MEASUREMENT_ID ?? CONFIG.ga4;
if (GA4 && !/^G-[A-Z0-9]{10}$/.test(GA4)) throw new Error(`GA4 の測定 ID の形が違う: ${GA4}`);

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

// ---- head（検索と共有のための情報） -------------------------------------

/** ページ自身が持っている題と説明を読む。2 か所に書くとずれるので、HTML を唯一のソースにする */
function pageMeta(html, file) {
  const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim();
  const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1]?.trim();
  if (!title) throw new Error(`${file}: <title> が無い`);
  if (!desc) throw new Error(`${file}: <meta name="description"> が無い`);
  const path = file === "index.html" ? "/" : `/${file}`;
  return { title, desc, url: CONFIG.url + path, path };
}

/** 検索エンジンと SNS が読む情報。全ページで同じ形になるよう、ここで 1 回だけ書く */
function head(meta) {
  const og = [
    ["og:type", meta.path === "/" ? "website" : "article"],
    ["og:site_name", CONFIG.name],
    ["og:locale", CONFIG.locale],
    ["og:title", meta.title],
    ["og:description", meta.desc],
    ["og:url", meta.url],
    ["og:image", `${CONFIG.url}/og.png`],
    ["og:image:width", "1200"],
    ["og:image:height", "630"],
  ];
  const tw = [
    ["twitter:card", "summary_large_image"],
    ["twitter:title", meta.title],
    ["twitter:description", meta.desc],
    ["twitter:image", `${CONFIG.url}/og.png`],
  ];
  const ld = meta.path === "/" ? {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: "ui-labo",
    description: meta.desc,
    url: CONFIG.url,
    codeRepository: CONFIG.repo,
    programmingLanguage: ["JavaScript", "CSS", "Dart", "Swift"],
    license: "https://opensource.org/licenses/MIT",
    author: { "@type": "Organization", name: "ynetlabo", url: CONFIG.url },
  } : {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: meta.title,
    description: meta.desc,
    url: meta.url,
    isPartOf: { "@type": "WebSite", name: CONFIG.name, url: CONFIG.url },
    author: { "@type": "Organization", name: "ynetlabo" },
  };

  return [
    `<link rel="canonical" href="${meta.url}">`,
    `<link rel="icon" href="./favicon.svg" type="image/svg+xml">`,
    `<meta name="theme-color" content="#f2f4f8" media="(prefers-color-scheme: light)">`,
    `<meta name="theme-color" content="#191c22" media="(prefers-color-scheme: dark)">`,
    ...og.map(([k, v]) => `<meta property="${k}" content="${attr(v)}">`),
    ...tw.map(([k, v]) => `<meta name="${k}" content="${attr(v)}">`),
    `<script type="application/ld+json">${JSON.stringify(ld)}</script>`,
    ...(GA4 ? analytics(GA4) : []),
  ].join("\n");
}

/** GA4。測定 ID が無いときは 1 行も出さない */
function analytics(id) {
  return [
    `<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>`,
    `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}`
    + `gtag("js",new Date());gtag("config","${id}");</script>`,
  ];
}

const attr = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

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
const built = [];
for (const name of readdirSync(SRC)) {
  const from = join(SRC, name);
  if (!name.endsWith(".html")) { cpSync(from, join(DIST, name)); continue; }
  const raw = readFileSync(from, "utf8");
  const meta = pageMeta(raw, name);
  const all = { ...fragments, head: head(meta) };
  const html = raw.replace(/<!--#([\w-]+)-->/g, (_, key) => {
    if (!(key in all)) throw new Error(`${name}: 未知の差し込み <!--#${key}-->`);
    return all[key];
  });
  if (!raw.includes("<!--#head-->")) throw new Error(`${name}: <!--#head--> が無い`);
  writeFileSync(join(DIST, name), html);
  built.push(meta);
}

// 4. クローラ向け
writeFileSync(join(DIST, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
  + built.map((m) => `  <url><loc>${m.url}</loc></url>`).join("\n")
  + `\n</urlset>\n`);

writeFileSync(join(DIST, "robots.txt"),
  `User-agent: *\nAllow: /\n\nSitemap: ${CONFIG.url}/sitemap.xml\n`);

// GitHub Pages の Jekyll を止める。_ で始まる名前が消えるのを防ぐ
writeFileSync(join(DIST, ".nojekyll"), "");

// 独自ドメインは成果物に CNAME が無いと解除されることがある。src/CNAME を必須にする
if (!existsSync(join(DIST, "CNAME"))) throw new Error("CNAME が無い（apps/site/src/CNAME）");

console.log(`site  ${built.length} ページ / spec ${list.length} 件から生成` + (GA4 ? ` / GA4 ${GA4}` : " / GA4 なし"));
