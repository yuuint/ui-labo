---
name: design-tokens
title: デザイントークン
status: approved
---

# デザイントークン

## 概要

4 つのプラットフォーム実装（プレーン Web / Vue / Flutter / SwiftUI）が参照する、
色・寸法・タイポグラフィ・角丸・影・モーションの定義。
原本は 1 箇所に置き、各プラットフォーム向けのコードを生成して配る。

## 契約（プラットフォーム非依存）

### 形式

W3C DTCG Design Tokens Format **v2025.10** に準拠する。

- 拡張子は `.tokens.json`
- 各トークンは `$value` と `$type` を持つ
- 他トークンの参照は `{group.token}` 記法
- 説明が必要なものには `$description` を付ける

```jsonc
{
  "color": {
    "$type": "color",
    "blue": {
      "500": { "$value": "oklch(0.62 0.19 258)", "$description": "ブランド基準色" }
    }
  }
}
```

### 階層

3 層とし、**下の層は 1 つ上の層のみを参照する**。

| 層 | ファイル | 例 | 参照先 |
|---|---|---|---|
| primitive | `src/primitive/*.tokens.json` | `color.ai.600`, `space.4`, `stroke.thick` | なし（実値） |
| semantic（共通） | `src/semantic/shared.tokens.json` | `size.control.height`, `line.strong`, `motion.zoom` | primitive のみ |
| semantic（テーマ） | `src/semantic/{light,dark}.tokens.json` | `color.accent`, `color.area.1` | primitive のみ |
| component | `src/component/*.tokens.json` | `prefecturePicker.map.outline` | semantic のみ |

**component が primitive を直接参照することを禁止する。**
semantic 層を絶縁体とすることで、semantic の差し替え＝全コンポーネントの変更、
primitive の差し替え＝全テーマの変更、という 2 軸の独立を保つ。

寸法・線幅・モーションも同じ規則に従う。色だけの規則ではない。
テーマで変わらない役割は `semantic/shared.tokens.json` に置く。

**この規則はビルドで検査する。** 破れているとビルドが通らない。
規約として書くだけでは守れないため。

### 命名

`<category>.<concept>.<variant>.<state>` の順。すべて kebab-case。
プラットフォーム固有の接頭辞（`yn-` / `Yn` / `YN`）はトークン名には付けず、生成時に付与する。

### テーマ

light / dark および将来のブランド差分は、**DTCG Resolver Module** の
`sets` / `modifiers` / 解決順で表現する。
`light.tokens.json` / `dark.tokens.json` のようなファイル分割では表現しない。

解決の定義は `packages/tokens/resolver.json` に置く。

### 色空間

原本は OKLCH で書く。sRGB へのフォールバックが必要なプラットフォームでは生成時に変換する。

## ディレクトリ構成

```
packages/tokens/
├── src/
│   ├── primitive/{color,dimension}.tokens.json
│   ├── semantic/shared.tokens.json          # テーマで変わらない役割
│   ├── semantic/{light,dark}.tokens.json     # テーマで変わる役割
│   └── component/<component>.tokens.json
├── resolver.json          # 解決順とテーマの切り替え。これが正
├── formats/oklch.mjs      # OKLCH → sRGB（Dart / Swift 向け）
├── scripts/build.mjs      # 参照の解決に Style Dictionary v5 を使い、出力は自前で組む
├── scripts/lib/layers.mjs # 3 層の参照方向の検査
└── dist/                  # 生成物。手で編集しない
```

## 生成先

生成物はコミットする（利用者に Node.js を要求しないため）。
生成物は手で編集しない。ファイル名で判別できるようにする。

| プラットフォーム | 生成先 | 形式 |
|---|---|---|
| プレーン Web | `dist/tokens.css` | CSS カスタムプロパティ（`@layer ui-labo.tokens`） |
| プレーン Web | `dist/tokens.js` / `.d.ts` | 型付き定数（JS から参照する用） |
| Vue | （なし） | `tokens.css` をそのまま使う |
| Flutter | `dist/tokens.g.dart` | `ThemeExtension<YnTokens>`（`copyWith` / `lerp` つき） |
| SwiftUI | `dist/Tokens.g.swift` | `YNTokens` 構造体 ＋ `of(_ scheme:)` |

各プラットフォームのパッケージは、この `dist/` を取り込む。

CSS は 1 ファイルに両テーマを収め、**素の `:root` にライト一式**を置いたうえで、
`@media (prefers-color-scheme: dark)` を `:root:not([data-theme="light"])` で守り、
`:root[data-theme="dark"]` でも再定義する。
未指定・システム追従・明示指定の 3 状態すべてで値が決まるようにするため。

## 対象外

- アイコン。トークンではなくアセットとして別 spec で扱う。
- Figma との双方向同期。原本はリポジトリ側の JSON とし、当面 Figma は参照しない。

## 受け入れ条件

`[x]` = 自動テスト・静的解析で確認できる / `[ ]` = 手動確認が残る

### 共通
- [x] `src/` 配下のすべてのファイルが DTCG v2025.10 のスキーマ検証を通る
- [x] component 層のトークンが primitive を直接参照していないことを検査するテストがある
- [x] 未解決の参照（存在しないトークンへの `{...}`）がビルドで失敗する

### 生成
- [x] `npm run build` で 4 つの生成先すべてが出力される
- [ ] 生成物がコミット済みの内容と一致することを CI が検査する（生成忘れの検出）

### プレーン Web
- [x] `tokens.css` が `@layer tokens` 内で `:root` に変数を定義する
- [x] light / dark が `prefers-color-scheme` と明示指定の両方で切り替わる
- [ ] 実ブラウザ（Safari / Chrome / Firefox）で OKLCH が意図した色で表示される

### Flutter
- [x] `tokens.g.dart` が `ThemeExtension` を実装し `lerp` / `copyWith` を持つ
- [ ] `Theme.of(context).extension<YnTokens>()` から全トークンが取得できる
- [ ] iOS / Android 実機でライト・ダーク切替が反映される

### SwiftUI
- [ ] `Tokens.g.swift` が Swift Package 内で公開シンボルとして解決する
- [ ] iOS 実機でライト・ダーク切替が反映される

## 関連

- ADR `design-token-format`（トークン形式と変換ツールの選定）
