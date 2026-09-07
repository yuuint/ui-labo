/**
 * ラッパーの検査。
 *
 * 一番大事なのは 2 つ。
 *   - core の props とずれていないこと（ずれたら渡せない指定が黙って生まれる）
 *   - サーバ側で DOM に触らないこと（Nuxt などの SSR を通すため）
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createSSRApp, h } from "vue";
import { renderToString } from "@vue/server-renderer";
import { YnPrefecturePicker, TAG, PROP_MAP } from "../src/index.js";
import plugin from "../src/index.js";

/** core の要素定義を、DOM 無しで読み込むための最小の土台 */
async function loadCoreProps() {
  const g = globalThis;
  const saved = { ...g };
  g.HTMLElement = class {};
  g.CSSStyleSheet = class { replaceSync() {} };
  g.customElements = { get: () => undefined, define() {} };
  try {
    const m = await import("@ynetlabo/ui-core");
    return m.YnPrefecturePicker.props;
  } finally {
    for (const k of ["HTMLElement", "CSSStyleSheet", "customElements"]) {
      if (k in saved) g[k] = saved[k]; else delete g[k];
    }
  }
}

test("core の props と過不足なく対応している", async () => {
  const core = Object.keys(await loadCoreProps());
  const mapped = Object.values(PROP_MAP);
  assert.deepEqual(mapped.slice().sort(), core.slice().sort(),
    "core に props が増減したらここも直す");
  assert.deepEqual(Object.keys(PROP_MAP).slice().sort(), Object.keys(YnPrefecturePicker.props).slice().sort());
});

test("value は最後に入れる（設定より先だと別の表現として読まれる）", () => {
  assert.equal(Object.keys(PROP_MAP).at(-1), "modelValue");
  for (const k of ["codeFormat", "selectionLevel", "multiple"])
    assert.ok(Object.keys(PROP_MAP).indexOf(k) < Object.keys(PROP_MAP).indexOf("modelValue"), k);
});

test("v-model のために value を modelValue で受ける", () => {
  assert.equal(PROP_MAP.modelValue, "value");
  assert.ok(YnPrefecturePicker.emits.includes("update:modelValue"));
  // change を宣言しておかないと、Vue が native リスナを重ねて二重に発火する
  assert.ok(YnPrefecturePicker.emits.includes("change"));
});

test("指定しなかった真偽値は undefined のまま（core の既定を倒さない）", () => {
  for (const k of ["multiple", "searchable", "disabled", "required", "invalid"]) {
    const def = YnPrefecturePicker.props[k];
    assert.ok("default" in def, `${k}: default を書かないと Vue が false を入れる`);
    assert.equal(def.default, undefined, k);
  }
});

test("サーバでは DOM に触らず、空の要素だけを出す", async () => {
  const app = createSSRApp({
    render: () => h(YnPrefecturePicker, { modelValue: ["13"], multiple: true, mode: "inline" }),
  });
  const html = await renderToString(app);
  assert.match(html, new RegExp(`<${TAG}[^>]*>`), "要素そのものは出る");
  assert.doesNotMatch(html, /undefined|\[object/, "値が文字列化して漏れていない");
});

test("app.use() で登録できる", () => {
  const seen = [];
  plugin.install({ component: (name, c) => seen.push([name, c]) });
  assert.deepEqual(seen, [["YnPrefecturePicker", YnPrefecturePicker]]);
});
