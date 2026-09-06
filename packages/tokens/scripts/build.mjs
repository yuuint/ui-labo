#!/usr/bin/env node
/**
 * DTCG 2025.10 のトークンを、resolver.json の解決順に従って各プラットフォームへ変換する
 * （ADR design-token-format）。
 *
 * Style Dictionary は参照の解決だけに使い、出力の形は自前で組む。
 * CSS は 1 ファイルに両テーマを収め、ライト / ダーク / 明示指定の 3 状態すべてで
 * 正しく解決されるようにする。
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import StyleDictionary from "style-dictionary";
import { oklchToHex, oklchToDart, oklchToSwift } from "../formats/oklch.mjs";
import { checkLayers } from "./lib/layers.mjs";

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const resolver = JSON.parse(readFileSync(here("../resolver.json"), "utf8"));
const themes = Object.keys(resolver.modifiers.find((m) => m.name === "theme").values);
const setOf = (name) => resolver.sets.find((s) => s.name === name)?.values ?? [];

// 3 層の参照方向を検査する。破れているとビルドを通さない
{
  const abs = (list) => list.map((p) => here("../" + p));
  const themeVals = resolver.modifiers.find((m) => m.name === "theme").values;
  const errors = checkLayers({
    primitiveFiles: abs(setOf("primitive")),
    semanticFiles: abs([...setOf("semantic-shared"), ...Object.values(themeVals).flat()]),
    componentFiles: abs(setOf("component")),
  });
  if (errors.length) {
    console.error("トークンの層の規約に違反しています:\n" + errors.map((e) => "  - " + e).join("\n"));
    process.exit(1);
  }
}

mkdirSync(here("../dist"), { recursive: true });
mkdirSync(here("../.tmp"), { recursive: true });

StyleDictionary.registerFormat({
  name: "json/resolved",
  format: ({ dictionary }) =>
    JSON.stringify(dictionary.allTokens.map((t) => ({
      path: t.path, value: t.$value ?? t.value, type: t.$type ?? t.type,
    })), null, 0),
});

/** resolver.json の order に従って読み込むファイルを組み立てる */
function sourcesFor(theme) {
  const out = [];
  for (const step of resolver.order) {
    if (step === "theme") out.push(...resolver.modifiers.find((m) => m.name === "theme").values[theme]);
    else out.push(...setOf(step));
  }
  return out.map((p) => here("../" + p));
}

const resolved = {};
for (const theme of themes) {
  const sd = new StyleDictionary({
    source: sourcesFor(theme),
    log: { verbosity: "silent", warnings: "disabled" },
    platforms: {
      json: { transformGroup: "js", buildPath: here("../.tmp/") + "",
              files: [{ destination: `${theme}.json`, format: "json/resolved" }] },
    },
  });
  await sd.buildAllPlatforms();
  resolved[theme] = JSON.parse(readFileSync(here(`../.tmp/${theme}.json`), "utf8"));
}

// --- 値の整形 ---
const flat = (t) => t.path.join("-").replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const camel = (t) => t.path.map((s, i) => (i ? s[0].toUpperCase() + s.slice(1) : s)).join("");
const isColor = (t) => t.type === "color";
const cssValue = (t) => {
  const v = t.value;
  if (v && typeof v === "object" && "value" in v) return `${v.value}${v.unit ?? ""}`;
  return String(v);
};
const numOf = (t) => {
  const v = t.value;
  return v && typeof v === "object" && "value" in v ? v.value : Number(v);
};

const byName = (theme) => Object.fromEntries(resolved[theme].map((t) => [flat(t), t]));
const light = byName("light"), dark = byName("dark");
const names = Object.keys(light);

// --- CSS: 素の :root にライト一式、ダークは変数だけ差し替える ---
const decls = (map) => names.map((n) => `  --${n}: ${cssValue(map[n])};`).join("\n");
writeFileSync(here("../dist/tokens.css"), `/* 生成物。手で編集しない。更新は npm run build（@ynetlabo/ui-tokens） */
@layer ui-labo.tokens {
  :root {
${decls(light)}
  }
  /* 既定（システム追従）のダーク。明示指定のライトが勝つ */
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
${names.map((n) => `      --${n}: ${cssValue(dark[n])};`).join("\n")}
    }
  }
  /* 明示指定のダーク */
  :root[data-theme="dark"] {
${names.map((n) => `    --${n}: ${cssValue(dark[n])};`).join("\n")}
  }
}
`);

// --- Web (JS + 型) ---
const jsObj = (map) => "{\n" + names.map((n) => `  ${JSON.stringify(camel(map[n]))}: ${JSON.stringify(cssValue(map[n]))},`).join("\n") + "\n}";
writeFileSync(here("../dist/tokens.js"),
`// 生成物。手で編集しない
export const light = ${jsObj(light)};
export const dark = ${jsObj(dark)};
export const cssVar = (name) => \`var(--\${name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()})\`;
`);
writeFileSync(here("../dist/tokens.d.ts"),
`// 生成物。手で編集しない
export type TokenName = ${names.map((n) => JSON.stringify(camel(light[n]))).join(" | ")};
export declare const light: Record<TokenName, string>;
export declare const dark: Record<TokenName, string>;
export declare const cssVar: (name: TokenName) => string;
`);

// --- Flutter: ThemeExtension（static const の羅列にしない） ---
const dartField = (t) => camel(t);
const dartType = (t) => (isColor(t) ? "Color" : t.type === "duration" ? "Duration" : "double");
const dartValue = (t) =>
  isColor(t) ? oklchToDart(String(t.value))
  : t.type === "duration" ? `const Duration(milliseconds: ${numOf(t)})`
  : String(numOf(t));
const fields = names.map((n) => light[n]);
writeFileSync(here("../dist/tokens.g.dart"),
`// 生成物。手で編集しない。更新は npm run build（@ynetlabo/ui-tokens）
import 'package:flutter/material.dart';

@immutable
class YnTokens extends ThemeExtension<YnTokens> {
  const YnTokens({
${fields.map((t) => `    required this.${dartField(t)},`).join("\n")}
  });

${fields.map((t) => `  final ${dartType(t)} ${dartField(t)};`).join("\n")}

  static const YnTokens light = YnTokens(
${fields.map((t) => `    ${dartField(t)}: ${dartValue(light[flat(t)])},`).join("\n")}
  );

  static const YnTokens dark = YnTokens(
${fields.map((t) => `    ${dartField(t)}: ${dartValue(dark[flat(t)])},`).join("\n")}
  );

  @override
  YnTokens copyWith({
${fields.map((t) => `    ${dartType(t)}? ${dartField(t)},`).join("\n")}
  }) => YnTokens(
${fields.map((t) => `    ${dartField(t)}: ${dartField(t)} ?? this.${dartField(t)},`).join("\n")}
  );

  @override
  YnTokens lerp(ThemeExtension<YnTokens>? other, double t) {
    if (other is! YnTokens) return this;
    return YnTokens(
${fields.map((tk) => {
  const f = dartField(tk);
  if (isColor(tk)) return `      ${f}: Color.lerp(${f}, other.${f}, t)!,`;
  if (tk.type === "duration") return `      ${f}: t < 0.5 ? ${f} : other.${f},`;
  return `      ${f}: lerpDouble(${f}, other.${f}, t)!,`;
}).join("\n")}
    );
  }
}

double? lerpDouble(double a, double b, double t) => a + (b - a) * t;
`);

// --- SwiftUI ---
const swType = (t) => (isColor(t) ? "Color" : t.type === "duration" ? "Double" : "CGFloat");
const swValue = (t) =>
  isColor(t) ? oklchToSwift(String(t.value))
  : t.type === "duration" ? String(numOf(t) / 1000)
  : String(numOf(t));
writeFileSync(here("../dist/Tokens.g.swift"),
`// 生成物。手で編集しない。更新は npm run build（@ynetlabo/ui-tokens）
import SwiftUI

public struct YNTokens: Sendable {
${fields.map((t) => `    public let ${camel(t)}: ${swType(t)}`).join("\n")}

    public static let light = YNTokens(
${fields.map((t) => `        ${camel(t)}: ${swValue(light[flat(t)])}`).join(",\n")}
    )

    public static let dark = YNTokens(
${fields.map((t) => `        ${camel(t)}: ${swValue(dark[flat(t)])}`).join(",\n")}
    )

    public static func of(_ scheme: ColorScheme) -> YNTokens { scheme == .dark ? .dark : .light }
}
`);

rmSync(here("../.tmp"), { recursive: true, force: true });
console.log(`build  トークン ${names.length} 個 × ${themes.length} テーマ → dist/ に 5 ファイル`);
