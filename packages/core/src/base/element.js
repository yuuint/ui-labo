/**
 * 最小の基底クラス。属性とプロパティの同期、まとめ描画だけを持つ。
 *
 * Lit を使わない代わりに書くのはここだけに閉じる（ADR plain-web-custom-elements）。
 * 300 行を超えたら Lit の再実装に近づいている兆候なので、その時点で方針を見直す。
 */
export class YnElement extends HTMLElement {
  /** @type {Record<string, {attr?: string, type?: 'string'|'number'|'boolean'|'json', value?: any, reflect?: boolean}>} */
  static props = {};

  static get observedAttributes() {
    return Object.entries(this.props).map(([k, d]) => d.attr ?? toAttr(k));
  }

  #state = {};
  #frame = 0;
  #ready = false;
  #reflectingAttr = null;
  #pending = null;

  constructor() {
    super();
    const props = this.constructor.props;
    for (const [key, def] of Object.entries(props)) {
      // 定義前の要素にフレームワークが値を入れていることがある。
      // そのまま defineProperty すると消えるので、いったん退避しておく。
      // ここで入れ直してはいけない。サブクラスのフィールド初期化は super() の
      // あとに走るため、setter から propChanged へ入ると未初期化の私有フィールドに触る
      if (Object.hasOwn(this, key)) {
        (this.#pending ??= new Map()).set(key, this[key]);
        delete this[key];
      }

      this.#state[key] = def.value;
      Object.defineProperty(this, key, {
        get: () => this.#state[key],
        set: (v) => {
          if (this.#state[key] === v) return;      // 変わっていないなら何もしない
          this.#state[key] = v;
          // 属性・プロパティのどちらから来ても、ここ 1 か所を通る。
          // フレームワークはプロパティで値を渡すため、属性だけを見ていると取りこぼす
          this.#reflect(key, def, v);
          this.propChanged?.(key, v);
          this.requestUpdate();
        },
        enumerable: true,
      });
    }
  }

  connectedCallback() {
    if (!this.#ready) { this.#ready = true; this.setup?.(); }
    // 退避しておいた値は setup のあとで通す。属性より後なので、
    // 両方から来ていればプロパティが勝つ（より明示的な指定だから）
    if (this.#pending) {
      const pending = this.#pending;
      this.#pending = null;
      for (const [key, v] of pending) this[key] = v;
    }
    // 初回は同期で描く。次のフレームに任せると、非表示タブや
    // バックグラウンドでは requestAnimationFrame が発火せず一度も描画されない
    this.updateNow();
  }

  attributeChangedCallback(attr, _old, value) {
    // 自分で書き戻した「その属性」だけを無視する。
    // setAttribute は [CEReactions] なので、その中で保留中の
    // 別の属性のコールバックまで同期で流れてくる。まとめて止めると、
    // HTML に書かれた 2 つ目以降の属性を丸ごと取りこぼす
    if (this.#reflectingAttr === attr) return;
    const entry = Object.entries(this.constructor.props)
      .find(([k, d]) => (d.attr ?? toAttr(k)) === attr);
    if (!entry) return;
    const [key, def] = entry;
    this[key] = parse(value, def.type ?? "string", def.value);
  }

  /**
   * プロパティの変更を属性へ書き戻す。
   * CSS は :host([mode="inline"]) のように属性を見るため、
   * Vue のようにプロパティで値を渡すフレームワークでは属性がないと何も効かない。
   * 属性で表せない値（配列・オブジェクト・json 型）は対象外。
   */
  #reflect(key, def, v) {
    const type = def.type ?? "string";
    if (def.reflect === false || type === "json") return;
    if (v !== null && typeof v === "object") return;
    const attr = def.attr ?? toAttr(key);
    const prev = this.#reflectingAttr;
    this.#reflectingAttr = attr;
    try {
      if (type === "boolean") this.toggleAttribute(attr, !!v);
      else if (v === null || v === undefined) this.removeAttribute(attr);
      else this.setAttribute(attr, String(v));
    } finally {
      this.#reflectingAttr = prev;
    }
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
