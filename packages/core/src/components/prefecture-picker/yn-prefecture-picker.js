/**
 * <yn-prefecture-picker>
 * 仕様は spec `prefecture-picker`。第三者ライブラリを使わない素の Custom Element。
 */
import { YnElement } from "../../base/element.js";
import { PREFECTURES } from "@ynetlabo/ui-data";
import { VIEW_BOX, PATHS } from "@ynetlabo/ui-data/outline";
import { normalize, match } from "@ynetlabo/ui-data/normalize";
import { grouping, members } from "../../lib/grouping.js";
import { formatPrefecture, formatArea, displayOf, toKey } from "../../lib/value.js";
import { css } from "./styles.js";

/** エリアの中心。所属県の面積で重み付けする（大きい県に引っぱられるのが自然） */
function areaCenter(codes) {
  let w = 0, x = 0, y = 0;
  for (const c of codes) {
    const o = PATHS[c]; if (!o) continue;
    const a = o.a ?? 1;
    x += o.c[0] * a; y += o.c[1] * a; w += a;
  }
  return w ? [x / w, y / w] : null;
}

/** "170ms" / "0.3s" / "0s" を数値へ */
function durationMs(v) {
  const t = String(v).trim();
  if (!t) return 0;
  const n = parseFloat(t);
  if (!Number.isFinite(n)) return 0;
  return t.endsWith("ms") ? n : n * 1000;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const sheet = new CSSStyleSheet();
sheet.replaceSync(css);

export class YnPrefecturePicker extends YnElement {
  static formAssociated = true;
  static props = {
    value:            { value: null, reflect: false },
    selectionLevel:   { value: "prefecture" },
    multiple:         { type: "boolean", value: false },
    codeFormat:       { value: "jis" },
    grouping:         { value: "region9" },
    layout:           { value: "map" },
    display:          { value: "name" },
    searchable:       { type: "boolean", value: true },
    placeholder:      { value: "選択してください" },
    disabled:         { type: "boolean", value: false },
    required:         { type: "boolean", value: false },
    invalid:          { type: "boolean", value: false },
    name:             { value: "" },
    transition:       { value: "auto" },
    mode:             { value: "dropdown" },
    footer:           { value: "auto" },
    items:            { type: "json", value: null },
  };

  #sel = [];            // 内部キー（県コード / エリアキー）の配列
  #openState = false;
  #step = "area";
  #area = null;
  #query = "";
  #lastT = { s: 1, x: 0, y: 0 };
  #internals;

  constructor() {
    super();
    this.#internals = this.attachInternals?.();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [sheet];
  }

  // --- 派生 ---
  /** 常時表示（inline）では開閉の概念を持たない */
  get #inline() { return this.mode === "inline"; }
  get #open() { return this.#inline || this.#openState; }
  set #open(v) { this.#openState = v; }

  get #prefs() { return this.items ?? PREFECTURES; }
  get #isArea() { return this.selectionLevel === "area"; }
  /**
   * フッタに出す部品。"auto" は mode と multiple から決める。
   * 埋め込み先が自前のクリア／完了を持つ場合は "none" にして丸ごと消す。
   */
  get #footParts() {
    const raw = String(this.footer ?? "auto").trim();
    if (raw === "none") return [];
    if (raw === "auto") {
      if (!this.multiple) return [];
      // 常時表示では閉じるものが無いので「完了」を出さない
      return this.#inline ? ["count", "clear"] : ["count", "clear", "done"];
    }
    return raw.split(/\s+/).filter((k) => k === "count" || k === "clear" || k === "done");
  }
  get #group() { return grouping(this.grouping); }
  get #members() { const g = this.#group; return g ? members(g, this.#prefs) : {}; }
  #byCode(c) { return this.#prefs.find((p) => p.code === c); }

  /** 検索中と、地図を持たない区切りでは一覧として描く */
  #effectiveLayout() {
    if (this.layout === "list") return "list";
    const g = this.#group;
    if (!g || !g.geo) return "list";
    if (!this.#isArea && this.searchable && this.#query.trim()) return "list";
    return "map";
  }

  /** エリア選択モードでは、選択したエリアに属する県コードを返す */
  #selectedCodes() {
    if (!this.#isArea) return this.#sel;
    const m = this.#members;
    return this.#sel.flatMap((k) => m[k] ?? []);
  }

  #emitValue() {
    const g = this.#group, m = this.#members;
    const one = (k) => this.#isArea
      ? formatArea(k, { labels: g.labels, memberCodes: m[k] ?? [], byCode: (c) => this.#byCode(c), codeFormat: this.codeFormat })
      : formatPrefecture(this.#byCode(k), this.codeFormat);
    return this.multiple ? this.#sel.map(one) : (this.#sel.length ? one(this.#sel[0]) : null);
  }

  #labelOf(k) {
    return this.#isArea ? this.#group.labels[k] : displayOf(this.#byCode(k), this.display);
  }

  // --- ライフサイクル ---
  setup() {
    this.addEventListener("keydown", this.#onKeydown);
    document.addEventListener("click", this.#onOutside);
    if (window.visualViewport) {
      this.#fitKeyboard = () => {
        const gap = window.innerHeight - (visualViewport.height + visualViewport.offsetTop);
        this.shadowRoot.querySelector(".panel")?.style.setProperty("--_kb", (gap > 60 ? gap : 0) + "px");
      };
      visualViewport.addEventListener("resize", this.#fitKeyboard);
    }
    this.#syncFromValue();
  }
  disconnectedCallback() {
    document.removeEventListener("click", this.#onOutside);
    if (this.#fitKeyboard) visualViewport.removeEventListener("resize", this.#fitKeyboard);
  }
  #fitKeyboard = null;
  #onOutside = (e) => {
    if (this.#inline) return;                       // 常時表示では閉じない
    if (this.#open && !e.composedPath().includes(this)) this.#close();
  };

  /** value 属性・プロパティから内部キーへ。不正な値は未選択として扱う */
  #syncFromValue() {
    const raw = this.value;
    const list = raw == null ? [] : Array.isArray(raw) ? raw : [raw];
    const g = this.#group, m = this.#members;
    this.#sel = list
      .map((v) => toKey(v, { level: this.selectionLevel, prefectures: this.#prefs, grouping: g, memberMap: m }))
      .filter(Boolean);
    if (!this.multiple) this.#sel = this.#sel.slice(0, 1);
  }

  /**
   * 属性・プロパティのどちらから変わってもここを通る。
   * フレームワークは value をプロパティで渡すため、属性だけを見ていると取りこぼす。
   */
  propChanged(key) {
    if (this.#internalWrite) return;              // 自分で書き戻した分は無視する
    if (key === "value") return this.#syncFromValue();
    if (key === "selectionLevel") { this.#sel = []; this.#syncValue(); return; }
    if (key === "grouping") { if (this.#isArea) this.#sel = []; this.#syncValue(); return; }
    if (key === "codeFormat" || key === "multiple") {
      if (!this.multiple) this.#sel = this.#sel.slice(0, 1);
      this.#syncValue();
    }
  }

  #internalWrite = false;
  /** 選択から value を作り直す。設定変更による追随なので change は発火しない */
  #syncValue() {
    const next = this.#emitValue();
    if (JSON.stringify(next) === JSON.stringify(this.value)) return;
    this.#internalWrite = true;
    try { this.value = next; } finally { this.#internalWrite = false; }
  }

  // --- 選択 ---
  #toggle(key) {
    const before = JSON.stringify(this.#sel);
    if (this.multiple) {
      const i = this.#sel.indexOf(key);
      i < 0 ? this.#sel.push(key) : this.#sel.splice(i, 1);
    } else {
      if (this.#sel[0] === key) return;      // 同じ項目の再選択では発火しない
      this.#sel = [key];
    }
    if (JSON.stringify(this.#sel) === before) return;
    this.#commit();
    if (!this.multiple) this.#close(); else this.updateNow();
  }
  #commit() {
    const v = this.#emitValue();
    this.#internalWrite = true;
    try { this.value = v; } finally { this.#internalWrite = false; }
    this.#setFormValue();
    this.emit("change", { value: v, keys: [...this.#sel] });
  }
  #setFormValue() {
    if (!this.#internals || !this.name) return;
    if (this.multiple) {
      const fd = new FormData();
      for (const v of this.#emitValue()) fd.append(this.name, String(v));
      this.#internals.setFormValue(fd);
    } else {
      const v = this.#emitValue();
      this.#internals.setFormValue(v == null ? null : String(v));
    }
    this.#internals.setValidity(
      this.required && !this.#sel.length ? { valueMissing: true } : {},
      "都道府県を選択してください",
      this.shadowRoot.querySelector(".trigger") ?? undefined,
    );
  }

  #openPanel() { if (this.disabled) return; this.#open = true; this.#step = "area"; this.#area = null; this.#query = ""; this.updateNow(); }
  #close() { if (this.#inline) return; this.#open = false; this.updateNow(); }
  #pickArea(key) {
    if (this.#isArea) return this.#toggle(key);
    const ids = this.#members[key] ?? [];
    if (ids.length === 1) return this.#toggle(ids[0]);
    this.#area = key; this.#step = "pref"; this.updateNow();
  }
  #back() { this.#step = "area"; this.#area = null; this.updateNow(); }

  #onKeydown = (e) => {
    if (!this.#open || e.key !== "Escape") return;
    if (this.#effectiveLayout() === "map" && this.#step === "pref") this.#back();
    else if (this.#inline) return;                  // 常時表示では閉じるものが無い
    else { this.#close(); this.shadowRoot.querySelector(".trigger")?.focus(); }
    e.preventDefault();
  };

  // --- 描画 ---
  #wasOpen = false;
  #heightTimer = 0;
  #onHeightEnd = (e) => {
    if (e.propertyName === "height") this.#releaseHeight(e.currentTarget);
  };
  #releaseHeight(panel) {
    clearTimeout(this.#heightTimer); this.#heightTimer = 0;
    panel.style.height = "";
  }

  /**
   * 中身の入れ替えで高さが変わるとき、その差を補間する。
   * 地図と一覧では高さが大きく違い、そのまま入れ替えると跳ねる。
   */
  #renderPanelAnimated() {
    const panel = this.shadowRoot.querySelector(".panel");
    const from = panel.getBoundingClientRect().height;
    panel.style.height = "";
    this.#renderPanel();
    if (!this.#open || !this.#wasOpen || !from) return;
    const to = panel.getBoundingClientRect().height;
    if (Math.abs(to - from) < 2) return;
    // 遷移しない設定（transition="none" / prefers-reduced-motion）では高さを固定しない。
    // 固定すると transitionend が来ず、その高さのまま張り付く
    const ms = durationMs(getComputedStyle(panel).getPropertyValue("--_d"));
    if (!ms) return;
    panel.style.height = `${from}px`;
    void panel.getBoundingClientRect();     // 開始の高さを確定させてから
    panel.style.height = `${to}px`;
    // 遷移が完了しなかった場合の保険（非表示タブなど）
    clearTimeout(this.#heightTimer);
    this.#heightTimer = setTimeout(() => this.#releaseHeight(panel), ms + 120);
  }

  update() {
    const r = this.shadowRoot;
    if (!r.firstChild) {
      r.innerHTML = `<div class="scrim" part="scrim"></div>
        <button class="trigger" part="trigger" type="button" aria-haspopup="dialog"></button>
        <div class="panel" part="panel" role="dialog"></div>`;
      r.querySelector(".trigger").addEventListener("click", (e) => {
        e.stopPropagation(); this.#open ? this.#close() : this.#openPanel();
      });
      r.querySelector(".scrim").addEventListener("click", () => this.#close());
      r.querySelector(".panel").addEventListener("transitionend", this.#onHeightEnd);
    }
    r.querySelector(".trigger").hidden = this.#inline;
    r.querySelector(".scrim").hidden = this.#inline;
    if (!this.#inline) this.#renderTrigger();
    this.#renderPanelAnimated();
    this.#wasOpen = this.#open;
    r.querySelector(".scrim").classList.toggle("open", this.#open && !this.#inline);
    r.querySelector(".panel").classList.toggle("open", this.#open);
    this.#setFormValue();
  }

  #renderTrigger() {
    const t = this.shadowRoot.querySelector(".trigger");
    const n = this.#sel.length;
    const label = !n ? `<span class="ph">${esc(this.placeholder)}</span>`
      : n === 1 ? esc(this.#labelOf(this.#sel[0]))
      : `${esc(this.#labelOf(this.#sel[0]))}<span class="more"> 他 ${n - 1} 件</span>`;
    const v = this.#emitValue();
    const shown = !n ? "" : this.multiple ? `${n}件` : String(v);
    t.innerHTML = `<span>${label}</span><span class="emit">${esc(shown)}</span><span class="caret">▾</span>`;
    t.disabled = this.disabled;
    t.setAttribute("aria-expanded", String(this.#open));
    if (this.required && !n) t.setAttribute("aria-invalid", "true"); else t.removeAttribute("aria-invalid");
  }

  #renderPanel() {
    const p = this.shadowRoot.querySelector(".panel");
    const g = this.#group, lay = this.#effectiveLayout();
    const canMap = !!(g && g.geo);
    const zoomed = lay === "map" && this.#step === "pref";

    let h = `<div class="head">`;
    if (zoomed) h += `<button class="back" type="button">← 全国</button>`;
    h += `<span class="here"></span>`
      + `<div class="modes" role="group" aria-label="表示の切り替え">`
      + `<button type="button" data-lay="map"${canMap ? "" : " disabled"} aria-pressed="${this.layout === "map"}">地図</button>`
      + `<button type="button" data-lay="list" aria-pressed="${this.layout === "list"}">リスト</button></div>`
      + (this.#inline ? "" : `<button class="close" type="button" aria-label="閉じる">✕</button>`)
      + `</div>`;
    if (this.searchable && !this.#isArea)
      h += `<div class="search-row"><input class="search" type="search" placeholder="とうきょう / tokyo / 東京" value="${esc(this.#query)}"></div>`;
    h += lay === "map" ? this.#mapHtml() : this.#listHtml();
    const foot = this.#footParts;
    if (foot.length)
      h += `<div class="foot">`
        + (foot.includes("count") ? `<span class="count">${this.#sel.length} 件選択中</span>` : "")
        + (foot.includes("clear") ? `<button class="fbtn" type="button" data-act="clear"${this.#sel.length ? "" : " disabled"}>クリア</button>` : "")
        + (foot.includes("done") ? `<button class="fbtn primary" type="button" data-act="done">完了</button>` : "")
        + `</div>`;
    p.innerHTML = h;
    p.setAttribute("aria-label", zoomed ? `${g.labels[this.#area]} の都道府県` : "都道府県を選ぶ");

    const here = p.querySelector(".here");
    const setHere = (t) => { here.textContent = t; };
    setHere(zoomed ? g.labels[this.#area] : lay === "map" ? "エリアを選ぶ" : (this.#isArea ? "エリアを選ぶ" : "都道府県を選ぶ"));

    p.querySelector(".back")?.addEventListener("click", (e) => { e.stopPropagation(); this.#back(); });
    p.querySelector(".close")?.addEventListener("click", (e) => { e.stopPropagation(); this.#close(); });
    p.querySelectorAll("[data-lay]").forEach((b) => b.addEventListener("click", (e) => {
      e.stopPropagation(); if (b.disabled) return;
      this.layout = b.dataset.lay; this.#step = "area"; this.#area = null; this.updateNow();
    }));
    p.querySelectorAll("[data-act]").forEach((b) => b.addEventListener("click", (e) => {
      e.stopPropagation();
      if (b.dataset.act === "clear") { this.#sel = []; this.#commit(); this.updateNow(); }
      else this.#close();
    }));
    const q = p.querySelector(".search");
    if (q) {
      q.addEventListener("input", (e) => { this.#query = e.target.value; this.updateNow(); q.focus(); });
      if (this.#query) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
    }
    this.#bindTargets(p, zoomed, setHere);
    this.#applyZoom(p);
  }

  /**
   * 押せるものにハンドラを付ける。
   * 地図と一覧は**別々に**辿る。まとめて `[data-area]` を拾うと、
   * 一覧の項目（同じ属性を持つ）に二重に付き、1 回のクリックで 2 回トグルしてしまう。
   */
  #bindTargets(p, zoomed, setHere) {
    const g = this.#group, m = this.#members;
    const mark = (sel, on) => p.querySelectorAll(sel).forEach((n) => n.classList.toggle("hot", on));
    const ring = (codes) => {
      const r = p.querySelector(".ring.hot");
      if (r) r.setAttribute("d", codes ? codes.map((c) => PATHS[c].d).join("") : "");
    };
    const rest = () => setHere(zoomed ? g.labels[this.#area] : "エリアを選ぶ");
    const mapRoot = p.querySelector(".mapbox");

    if (mapRoot && !zoomed) {
      // 全国: エリア単位で押す・光らせる
      mapRoot.querySelectorAll("[data-area]").forEach((n) => {
        const k = n.dataset.area;
        n.addEventListener("click", (e) => { e.stopPropagation(); this.#pickArea(k); });
        n.addEventListener("mouseenter", () => { mark(`[data-area="${k}"]`, true); if (!this.#isArea) ring(m[k]); setHere(g.labels[k]); });
        n.addEventListener("mouseleave", () => { mark(`[data-area="${k}"]`, false); ring(null); rest(); });
        n.addEventListener("focus", () => { mark(`[data-area="${k}"]`, true); setHere(g.labels[k]); });
        n.addEventListener("blur", () => { mark(`[data-area="${k}"]`, false); rest(); });
      });
    } else if (mapRoot) {
      // 拡大中: 県単位で押す・光らせる
      mapRoot.querySelectorAll("[data-code]").forEach((n) => {
        if (n.classList.contains("dim")) return;
        const c = n.dataset.code;
        n.addEventListener("click", (e) => { e.stopPropagation(); this.#toggle(c); });
        n.addEventListener("mouseenter", () => { mark(`[data-code="${c}"]`, true); ring([c]); setHere(this.#byCode(c).name); });
        n.addEventListener("mouseleave", () => { mark(`[data-code="${c}"]`, false); ring(null); rest(); });
      });
      // 対象外（海・薄いエリア）を押したら全国へ戻す。ダイアログは閉じない
      mapRoot.addEventListener("click", (e) => { e.stopPropagation(); this.#back(); });
    }

    // 一覧は自分の項目だけを見る
    p.querySelectorAll(".opt[data-code]").forEach((n) =>
      n.addEventListener("click", (e) => { e.stopPropagation(); this.#toggle(n.dataset.code); }));
    p.querySelectorAll(".opt[data-area]").forEach((n) =>
      n.addEventListener("click", (e) => { e.stopPropagation(); this.#pickArea(n.dataset.area); }));
  }

  /** 全国の位置で描いてから目標へ動かす。可視性は遷移の終了と同時に切り替わる */
  #applyZoom(p) {
    const zg = p.querySelector(".zoom");
    if (!zg || !this.__t) return;
    const t = this.__t;
    void zg.getBoundingClientRect();
    zg.style.transform = `translate(${t.x}px,${t.y}px) scale(${t.s})`;
    this.#lastT = t;
  }

  #mapHtml() {
    const g = this.#group, keys = Object.keys(g.labels), m = this.#members;
    const idx = Object.fromEntries(keys.map((k, i) => [k, i]));
    const hue = (k) => `var(--color-area-${(idx[k] % 11) + 1}, #7a90a8)`;
    const I = VIEW_BOX.inset;
    const okKey = g.keyOf(this.#byCode("47"));
    const insetHtml = `<rect class="inset" x="${I.x}" y="${I.y}" width="${I.w}" height="${I.h}" rx="8"/>`
      + `<rect class="inset-hit" x="${I.x}" y="${I.y}" width="${I.w}" height="${I.h}" rx="8"`
      + ` data-area="${okKey}" role="button" tabindex="0" aria-label="${esc(g.labels[okKey])}"/>`;
    const svg = (inner, label) => `<div class="mapbox"><svg viewBox="0 0 ${VIEW_BOX.w} ${VIEW_BOX.h}"`
      + ` role="group" aria-label="${esc(label)}">${inner}</svg></div>`;

    if (this.#isArea) {
      // エリアは 1 面として描き、県境を描かない。選択中は最後に濃い縁で描く
      const selSet = new Set(this.#sel);
      const order = [...keys.filter((k) => m[k]?.length && !selSet.has(k)),
                     ...keys.filter((k) => m[k]?.length && selSet.has(k))];
      let body = "";
      for (const k of order) {
        const d = m[k].map((c) => PATHS[c].d).join(""), on = selSet.has(k);
        body += `<path class="area-edge${on ? " sel" : ""}" d="${d}" vector-effect="non-scaling-stroke"/>`
          + `<path class="area-fill${on ? " sel" : ""}" d="${d}" data-area="${k}" style="--tc:${hue(k)}"`
          + ` role="button" tabindex="0" aria-pressed="${on}"`
          + ` aria-label="${esc(g.labels[k])} ${m[k].length}県"><title>${esc(g.labels[k])}</title></path>`;
      }
      this.__t = { s: 1, x: 0, y: 0 };
      return svg(`${insetHtml}<g class="zoom">${body}${this.#checks(m, 1)}</g>`, "日本地図からエリアを選ぶ");
    }

    const zoomed = this.#step === "pref" && this.#area;
    let t = { s: 1, x: 0, y: 0 };
    if (zoomed) {
      const bs = m[this.#area].map((c) => PATHS[c].b), pad = 26;
      const x0 = Math.min(...bs.map((b) => b[0])) - pad, y0 = Math.min(...bs.map((b) => b[1])) - pad;
      const x1 = Math.max(...bs.map((b) => b[2])) + pad, y1 = Math.max(...bs.map((b) => b[3])) + pad;
      const s = Math.min(VIEW_BOX.w / (x1 - x0), VIEW_BOX.h / (y1 - y0));
      t = { s, x: VIEW_BOX.w / 2 - s * (x0 + x1) / 2, y: VIEW_BOX.h / 2 - s * (y0 + y1) / 2 };
    }
    this.__t = t;
    const f = this.#lastT;
    const SC = new Set(this.#selectedCodes());
    let body = "";
    for (const pr of this.#prefs) {
      const k = g.keyOf(pr), dim = zoomed && k !== this.#area;
      const sel = SC.has(pr.code) && (!zoomed || k === this.#area);   // 強調は選択した県だけ
      body += `<path class="pref${dim ? " dim" : ""}${sel ? " sel" : ""}" d="${PATHS[pr.code].d}"`
        + ` data-code="${pr.code}" data-area="${k}" style="--tc:${hue(k)}" vector-effect="non-scaling-stroke"`
        + ` role="button" tabindex="${dim ? -1 : 0}"><title>${esc(pr.name)}</title></path>`;
    }
    let labels = "";
    if (zoomed) for (const c of m[this.#area]) {
      const [cx, cy] = PATHS[c].c;
      labels += `<text class="label" x="${cx}" y="${cy}" font-size="${34 / t.s}">${esc(this.#byCode(c).shortName)}</text>`;
    }
    const selD = (zoomed ? [...SC].filter((c) => g.keyOf(this.#byCode(c)) === this.#area) : [...SC])
      .map((c) => PATHS[c].d).join("");
    return svg(`${zoomed ? "" : insetHtml}<g class="zoom" style="transform:translate(${f.x}px,${f.y}px) scale(${f.s})">`
      + `<path class="ring sel" d="${selD}" vector-effect="non-scaling-stroke"/>`
      + `<path class="ring hot" d="" vector-effect="non-scaling-stroke"/>`
      + `${body}${labels}${this.#checks(m, t.s)}</g>`,
      zoomed ? `${g.labels[this.#area]} の都道府県` : "日本地図");
  }

  /** 選択中の目印。色に依存しない手がかり。図形の中心に置く */
  #checks(m, scale) {
    const pts = this.#isArea
      ? this.#sel.map((k) => areaCenter(m[k] ?? []))
      : this.#selectedCodes()
          .filter((c) => this.#step !== "pref" || this.#group.keyOf(this.#byCode(c)) === this.#area)
          .map((c) => PATHS[c].c);
    return pts.filter(Boolean).map(([cx, cy]) => {
      const R = 13 / scale, w = 2.2 / scale;
      return `<g class="check" aria-hidden="true"><circle cx="${cx}" cy="${cy}" r="${R}" stroke-width="${w}"/>`
        + `<path d="M${cx - R * .44},${cy + R * .04} l${R * .32},${R * .36} l${R * .58},-${R * .7}" stroke-width="${w * 1.4}"/></g>`;
    }).join("");
  }

  #listHtml() {
    const g = this.#group;
    if (this.#isArea && g) {
      const m = this.#members;
      return `<div class="list" role="listbox">` + Object.keys(g.labels).filter((k) => m[k]?.length)
        .map((k) => `<button class="opt" type="button" role="option" data-area="${k}" aria-selected="${this.#sel.includes(k)}">`
          + `<span class="code"></span><span>${esc(g.labels[k])}</span><span class="kana">${m[k].length}県</span></button>`)
        .join("") + `</div>`;
    }
    const hits = this.searchable && this.#query.trim() ? match(this.#prefs, this.#query) : null;
    const one = (p) => `<button class="opt" type="button" role="option" data-code="${p.code}" aria-selected="${this.#sel.includes(p.code)}">`
      + `<span class="code">${p.code}</span><span>${esc(p.name)}</span><span class="kana">${esc(p.kanaShort)}</span></button>`;
    if (hits && !hits.length) return `<div class="empty">「${esc(this.#query)}」に一致する都道府県はありません</div>`;
    if (hits) return `<div class="list" role="listbox">${hits.map(one).join("")}</div>`;
    if (!g) return `<div class="list" role="listbox">${this.#prefs.map(one).join("")}</div>`;
    const m = this.#members;
    return `<div class="list" role="listbox">` + Object.keys(g.labels).filter((k) => m[k]?.length)
      .map((k) => `<div class="group-head">${esc(g.labels[k])}</div>` + m[k].map((c) => one(this.#byCode(c))).join(""))
      .join("") + `</div>`;
  }
}

customElements.define("yn-prefecture-picker", YnPrefecturePicker);
