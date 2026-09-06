/**
 * サイトの挙動。テーマの切り替えと、プレイグラウンドの操作盤だけ。
 * ここでもライブラリは使わない（サイト自身が「依存ゼロで書ける」ことの実例になる）。
 */

// ---- テーマ ---------------------------------------------------------------
// tokens.css は :root[data-theme] と OS 設定の両方を見る。
// 明示的に選んだときだけ data-theme を書き、選んでいなければ OS に任せる。
const THEME_KEY = "ui-labo:theme";
const btn = document.getElementById("theme");

function applyTheme(v) {
  if (v) document.documentElement.dataset.theme = v;
  else delete document.documentElement.dataset.theme;
  if (btn) {
    const dark = v === "dark" || (!v && matchMedia("(prefers-color-scheme: dark)").matches);
    btn.textContent = dark ? "☀" : "☾";
    btn.setAttribute("aria-label", dark ? "ライトにする" : "ダークにする");
  }
}

let saved = null;
try { saved = localStorage.getItem(THEME_KEY); } catch { /* 保存できない環境もある */ }
applyTheme(saved);

btn?.addEventListener("click", () => {
  const dark = document.documentElement.dataset.theme
    ? document.documentElement.dataset.theme === "dark"
    : matchMedia("(prefers-color-scheme: dark)").matches;
  const next = dark ? "light" : "dark";
  applyTheme(next);
  try { localStorage.setItem(THEME_KEY, next); } catch { /* 同上 */ }
});

// ---- 現在地 ---------------------------------------------------------------
const here = location.pathname.split("/").pop() || "index.html";
for (const a of document.querySelectorAll("nav a[href$='.html']"))
  if (a.getAttribute("href").endsWith(here)) a.setAttribute("aria-current", "page");

// ---- 値の表示 -------------------------------------------------------------
export function watch(picker, out) {
  const show = () => {
    const v = picker.value;
    const empty = v == null || (Array.isArray(v) && v.length === 0);
    out.innerHTML = empty
      ? '<b>value</b> = <span style="opacity:.6">未選択</span>'
      : `<b>value</b> = ${escapeHtml(JSON.stringify(v))}`;
  };
  picker.addEventListener("change", show);
  show();
}

const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ---- 操作盤 ---------------------------------------------------------------
const toAttr = (k) => k.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

/** PARAMS の 1 つ目の値を既定として扱い、押された値を属性へ書く */
export function playground(picker, box, params) {
  box.innerHTML = Object.entries(params).map(([k, vs]) =>
    `<div class="row"><b>${k}</b><div class="seg" data-k="${k}">`
    + vs.map((v) => `<button type="button" data-v="${escapeHtml(v)}">${escapeHtml(v || "(空)")}</button>`).join("")
    + `</div></div>`).join("");

  const sync = () => {
    for (const [k, vs] of Object.entries(params)) {
      const attr = toAttr(k);
      const cur = picker.hasAttribute(attr) ? (picker.getAttribute(attr) || "true") : vs[0];
      for (const b of box.querySelectorAll(`[data-k="${k}"] button`))
        b.setAttribute("aria-pressed", String(b.dataset.v === cur));
    }
  };

  box.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-v]");
    if (!b) return;
    const k = b.closest("[data-k]").dataset.k;
    const attr = toAttr(k), v = b.dataset.v;
    // 偽は属性を消して表す。="false" でも偽にはなるが、既定に戻したことが読みやすい
    if (v === "true") picker.setAttribute(attr, "");
    else if (v === "false") picker.removeAttribute(attr);
    else picker.setAttribute(attr, v);
    sync();
  });

  sync();
}
