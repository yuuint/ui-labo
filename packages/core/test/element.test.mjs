/**
 * 基底クラスの属性まわりの検査。
 *
 * ブラウザを持ち込まずに済むよう、HTMLElement の代わりに
 * 「setAttribute が attributeChangedCallback を同期で呼び、
 * そのとき保留中のコールバックもまとめて流れる」という
 * [CEReactions] の性質だけを写した最小の土台を使う。
 * この性質こそが、書き戻しの実装を誤ったときに属性を取りこぼす原因になる。
 */
import { test } from "node:test";
import assert from "node:assert/strict";

class FakeHTMLElement {
  #attrs = new Map();
  #pending = [];
  #draining = false;

  getAttribute(n) { return this.#attrs.has(n) ? this.#attrs.get(n) : null; }
  hasAttribute(n) { return this.#attrs.has(n); }
  setAttribute(n, v) {
    const old = this.getAttribute(n);
    this.#attrs.set(n, String(v));
    this.#enqueue(n, old, String(v));
  }
  removeAttribute(n) {
    if (!this.#attrs.has(n)) return;
    const old = this.#attrs.get(n);
    this.#attrs.delete(n);
    this.#enqueue(n, old, null);
  }
  toggleAttribute(n, on) { on ? this.setAttribute(n, "") : this.removeAttribute(n); }

  #enqueue(n, o, v) { this.#pending.push([n, o, v]); this.#drain(); }
  #drain() {
    // 入れ子で呼ばれても同じ待ち行列を最後まで流す（ブラウザと同じ）
    while (this.#pending.length) {
      const [n, o, v] = this.#pending.shift();
      this.attributeChangedCallback?.(n, o, v);
    }
  }

  /** HTML に属性が書かれた要素が、あとから定義されて昇格する場面を模す */
  upgradeWith(pairs) {
    for (const [n, v] of pairs) this.#attrs.set(n, v);
    this.#pending.push(...pairs.map(([n, v]) => [n, null, v]));
    this.#drain();
  }
}

globalThis.HTMLElement = FakeHTMLElement;
globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => {};
const { YnElement } = await import("../src/base/element.js");

class Sample extends YnElement {
  static props = {
    mode: { value: "dropdown" },
    selectionLevel: { value: "prefecture" },
    multiple: { type: "boolean", value: false },
    size: { type: "number", value: 1 },
    data: { type: "json", value: null },
    secret: { value: "", reflect: false },
  };
  seen = [];
  propChanged(key, v) { this.seen.push([key, v]); }
}

test("HTML に並んだ属性が、2 つ目以降も取りこぼされずに反映される", () => {
  const el = new Sample();
  el.upgradeWith([
    ["mode", "inline"],
    ["selection-level", "area"],
    ["multiple", ""],
    ["size", "3"],
  ]);
  assert.equal(el.mode, "inline");
  assert.equal(el.selectionLevel, "area", "2 つ目の属性が落ちている");
  assert.equal(el.multiple, true);
  assert.equal(el.size, 3);
});

test("プロパティで渡した値が属性へ書き戻される（CSS が属性を見るため）", () => {
  const el = new Sample();
  el.mode = "inline";
  el.multiple = true;
  el.size = 7;
  assert.equal(el.getAttribute("mode"), "inline");
  assert.equal(el.getAttribute("multiple"), "");
  assert.equal(el.getAttribute("size"), "7");
});

test("false の boolean は属性を消す", () => {
  const el = new Sample();
  el.multiple = true;
  el.multiple = false;
  assert.equal(el.hasAttribute("multiple"), false);
  assert.equal(el.multiple, false);
});

test("属性で表せない値は書き戻さない", () => {
  const el = new Sample();
  el.data = { a: 1 };
  el.secret = "内緒";
  assert.equal(el.hasAttribute("data"), false, "json 型は対象外");
  assert.equal(el.hasAttribute("secret"), false, "reflect: false は対象外");
  assert.deepEqual(el.data, { a: 1 });
  assert.equal(el.secret, "内緒");
});

test("書き戻しが propChanged を二重に呼ばない", () => {
  const el = new Sample();
  el.mode = "inline";
  assert.deepEqual(el.seen, [["mode", "inline"]]);
});

test("属性から来た変更も propChanged を 1 回だけ通る", () => {
  const el = new Sample();
  el.setAttribute("selection-level", "area");
  assert.deepEqual(el.seen, [["selectionLevel", "area"]]);
  assert.equal(el.selectionLevel, "area");
});
