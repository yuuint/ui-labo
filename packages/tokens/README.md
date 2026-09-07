# @ynetlabo/ui-tokens

[ui-labo](https://github.com/yuuint/ui-labo) のデザイントークン。
[DTCG Design Tokens Format 2025.10](https://tr.designtokens.org/) で書き、
CSS / TypeScript / Dart / Swift へ変換したものを同梱しています。

```sh
npm install @ynetlabo/ui-tokens
```

```html
<link rel="stylesheet" href="node_modules/@ynetlabo/ui-tokens/dist/tokens.css">
```

## 中身

| ファイル | 用途 |
|---|---|
| `dist/tokens.css` | CSS カスタムプロパティ。ライト / ダークの 2 テーマ |
| `dist/tokens.js` `dist/tokens.d.ts` | JS から参照する場合 |
| `dist/tokens.g.dart` | Flutter の `ThemeExtension` |
| `dist/Tokens.g.swift` | SwiftUI（sRGB へ変換済み） |
| `src/**/*.tokens.json` | 元の DTCG 定義 |

## テーマ

`dist/tokens.css` は 3 つの状態を扱います。

- 何も指定しない → OS の配色設定に従う
- `<html data-theme="light">` → 常にライト
- `<html data-theme="dark">` → 常にダーク

## 3 層

`primitive`（生の値）→ `semantic`（役割）→ `component`（部品ごと）の順に参照します。
`component` から `primitive` を直接参照する近道はビルド時に検出して落とします。

MIT © Yuuki.U ([ynetlabo](https://ynetlabo.net))
