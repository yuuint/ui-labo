import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { checkLayers, definedPaths } from "../scripts/lib/layers.mjs";
import { oklchToHex, parseOklch } from "../formats/oklch.mjs";

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const read = (p) => readFileSync(here(p), "utf8");
const resolver = JSON.parse(read("../resolver.json"));
const abs = (list) => list.map((p) => here("../" + p));
const setOf = (n) => resolver.sets.find((s) => s.name === n).values;
const themeVals = resolver.modifiers.find((m) => m.name === "theme").values;

const allFiles = [...setOf("primitive"), ...setOf("semantic-shared"),
                  ...Object.values(themeVals).flat(), ...setOf("component")].map((p) => here("../" + p));

test("すべてのトークンが $value を持ち、$type が自身か祖先で決まる", () => {
  const walk = (node, path, inheritedType) => {
    if (node === null || typeof node !== "object") return;
    const type = node.$type ?? inheritedType;
    if ("$value" in node) {
      assert.ok(node.$value !== undefined, `${path.join(".")} に $value がありません`);
      assert.ok(type, `${path.join(".")} の $type が決まりません`);
      return;
    }
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith("$")) continue;
      walk(v, [...path, k], type);
    }
  };
  for (const f of allFiles) walk(JSON.parse(readFileSync(f, "utf8")), [], null);
});

test("3 層の参照方向が守られている（component は primitive を直接参照しない）", () => {
  assert.deepEqual(checkLayers({
    primitiveFiles: abs(setOf("primitive")),
    semanticFiles: abs([...setOf("semantic-shared"), ...Object.values(themeVals).flat()]),
    componentFiles: abs(setOf("component")),
  }), []);
});

test("層の検査が、component → primitive の直接参照を捕まえる", () => {
  // 一時ファイルを作り、実際に primitive を指す component を検査させる
  const tmp = here("../.tmp-violation.tokens.json");
  writeFileSync(tmp, JSON.stringify({
    bad: { $type: "color", sample: { $value: "{color.neutral.0}" } },
  }));
  try {
    const errs = checkLayers({
      primitiveFiles: abs(setOf("primitive")),
      semanticFiles: abs([...setOf("semantic-shared"), ...Object.values(themeVals).flat()]),
      componentFiles: [tmp],
    });
    assert.equal(errs.length, 1, errs.join("\n"));
    assert.match(errs[0], /primitive "color\.neutral\.0" を直接参照/);
  } finally {
    rmSync(tmp, { force: true });
  }
});

test("light と dark が同じトークン名を過不足なく持つ", async () => {
  const { light, dark } = await import("../dist/tokens.js");
  assert.deepEqual(Object.keys(light).sort(), Object.keys(dark).sort());
  assert.ok(Object.keys(light).length > 100);
});

test("生成物に未解決の参照が残っていない", async () => {
  const { light, dark } = await import("../dist/tokens.js");
  for (const [k, v] of [...Object.entries(light), ...Object.entries(dark)]) {
    assert.ok(!String(v).includes("{"), `${k} が未解決: ${v}`);
  }
  assert.ok(!read("../dist/tokens.css").includes("{color."), "CSS に未解決の参照");
});

test("CSS がライト / ダーク / 明示指定の 3 状態すべてで解決する", () => {
  const css = read("../dist/tokens.css");
  assert.ok(css.includes("@layer ui-labo.tokens"), "@layer に入っていない");
  // 素の :root にライト一式（未指定の状態で必ず値が決まる）
  const rootBlock = css.slice(css.indexOf("  :root {"), css.indexOf("  @media"));
  assert.ok(rootBlock.includes("--color-bg:"), "素の :root に定義が無い");
  // システム追従のダークは、明示指定のライトに負ける
  assert.ok(css.includes('@media (prefers-color-scheme: dark)'));
  assert.ok(css.includes(':root:not([data-theme="light"])'), "明示ライトの除外が無い");
  // 明示指定のダーク
  assert.ok(css.includes(':root[data-theme="dark"]'));
});

test("Flutter は ThemeExtension を実装し lerp / copyWith を持つ", () => {
  const dart = read("../dist/tokens.g.dart");
  assert.ok(dart.includes("class YnTokens extends ThemeExtension<YnTokens>"));
  assert.ok(dart.includes("YnTokens copyWith("));
  assert.ok(dart.includes("YnTokens lerp("));
  assert.ok(dart.includes("static const YnTokens light") && dart.includes("static const YnTokens dark"));
  assert.ok(!dart.includes("oklch("), "Dart に OKLCH が残っている");
});

test("SwiftUI は sRGB に変換され、テーマを選べる", () => {
  const sw = read("../dist/Tokens.g.swift");
  assert.ok(sw.includes("public struct YNTokens"));
  assert.ok(sw.includes("static func of(_ scheme: ColorScheme)"));
  assert.ok(!sw.includes("oklch("), "Swift に OKLCH が残っている");
});

test("OKLCH → sRGB の変換が正しい", () => {
  assert.equal(oklchToHex("oklch(1 0 0)"), "#ffffff");
  assert.equal(oklchToHex("oklch(0 0 0)"), "#000000");
  const [r, g, b] = parseOklch("oklch(0.438 0.118 252)");
  assert.ok(b > g && g > r, "藍は青が最も強いはず");
});

test("地図の塗り分けは、隣り合う色の明度が十分に離れている", async () => {
  // 色相の差が失われても（グレースケールでも）境目が残ることの担保。
  // 厳密な交互ではなく、隣接する明度の差そのものを検査する
  const { light, dark } = await import("../dist/tokens.js");
  const L = (set, n) => parseOklch(set[`colorArea${n}`])
    .slice(0, 3).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
  for (const [label, set] of [["light", light], ["dark", dark]]) {
    for (let i = 1; i <= 10; i++) {
      const d = Math.abs(L(set, i + 1) - L(set, i));
      assert.ok(d >= 0.10, `${label}: area ${i} と ${i + 1} の明度差が ${d.toFixed(3)} しかありません`);
    }
  }
});
