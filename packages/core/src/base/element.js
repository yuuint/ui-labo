/**
 * 最小の基底クラス。属性とプロパティの同期、まとめ描画だけを持つ。
 *
 * Lit を使わない代わりに書くのはここだけに閉じる（ADR plain-web-custom-elements）。
 * 300 行を超えたら Lit の再実装に近づいている兆候なので、その時点で方針を見直す。
 */
export class YnElement extends HTMLElement {
  /** @type {Record<string, {attr?: string, type?: 'string'|'number'|'boolean'|'json', value?: any}>} */
  static props = {};

  static get observedAttributes() {
    return Object.entries(this.props).map(([k, d]) => d.attr ?? toAttr(k));
  }

  #state = {};
  #frame = 0;
  #ready = false;

  constructor() {
    super();
    const props = this.constructor.props;
    for (const [key, def] of Object.entries(props)) {
      this.#state[key] = def.value;
      Object.defineProperty(this, key, {
        get: () => this.#state[key],
        set: (v) => {
          if (this.#state[key] === v) return;      // 変わっていないなら何もしない
          this.#state[key] = v;
          this.requestUpdate();
        },
        enumerable: true,
      });
    }
  }

  connectedCallback() {
    if (!this.#ready) { this.#ready = true; this.setup?.(); }
    // 初回は同期で描く。次のフレームに任せると、非表示タブや
    // バックグラウンドでは requestAnimationFrame が発火せず一度も描画されない
    this.updateNow();
  }

  attributeChangedCallback(attr, _old, value) {
    const entry = Object.entries(this.constructor.props)
      .find(([k, d]) => (d.attr ?? toAttr(k)) === attr);
    if (!entry) return;
    const [key, def] = entry;
    this[key] = parse(value, def.type ?? "string", def.value);
  }

  /** 同じフレーム内の複数変更を 1 回の描画にまとめる（初回描画のあとだけ） */
  requestUpdate() {
    if (!this.isConnected || !this.#ready || this.#frame) return;
    this.#frame = requestAnimationFrame(() => { this.#frame = 0; this.update?.(); });
  }

  /** 直ちに描画する（テストや、遷移の開始位置を確定させたいとき） */
  updateNow() {
    if (this.#frame) { cancelAnimationFrame(this.#frame); this.#frame = 0; }
    this.update?.();
  }

  emit(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }
}

const toAttr = (key) => key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

function parse(value, type, fallback) {
  if (value === null) return type === "boolean" ? false : fallback;
  switch (type) {
    case "boolean": return value !== "false";
    case "number": { const n = Number(value); return Number.isNaN(n) ? fallback : n; }
    case "json": try { return JSON.parse(value); } catch { return fallback; }
    default: return value;
  }
}
