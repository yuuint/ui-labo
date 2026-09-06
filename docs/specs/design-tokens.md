---
name: design-tokens
title: デザイントークン
status: draft
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

| 層 | ディレクトリ | 例 | 参照先 |
|---|---|---|---|
| primitive | `src/primitive/` | `color.blue.500`, `dimension.space.16` | なし（実値） |
| semantic | `src/semantic/` | `color.action.primary`, `space.stack.md` | primitive のみ |
| component | `src/component/` | `button.bg.hover`, `button.padding.inline` | semantic のみ |

**コンポーネント実装が primitive を直接参照することを禁止する。**
semantic 層を絶縁体とすることで、semantic の差し替え＝全コンポーネントの変更、
primitive の差し替え＝全テーマの変更、という 2 軸の独立を保つ。

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
│   ├── primitive/{color,dimension,typography,elevation,motion}.tokens.json
│   ├── semantic/{color,space,typography}.tokens.json
│   └── component/<component>.tokens.json
├── resolver.json          # light / dark / ブランドの解決順
├── config.js              # Style Dictionary v5
└── formats/               # Dart(ThemeExtension) / Swift のカスタム出力
```

## 生成先

生成物はコミットする（利用者に Node.js を要求しないため）。
生成物は手で編集しない。ファイル名で判別できるようにする。

| プラットフォーム | 生成先 | 形式 |
|---|---|---|
| プレーン Web | `packages/core/src/tokens/tokens.css` | CSS カスタムプロパティ（`@layer tokens`） |
| プレーン Web | `packages/core/src/tokens/tokens.ts` | 型付き定数（JS から参照する用） |
| Vue | （なし） | core の `tokens.css` をそのまま使う |
| Flutter | `packages/flutter/lib/src/tokens/tokens.g.dart` | `ThemeExtension<T>` |
| SwiftUI | `packages/swiftui/Sources/YnetlaboUI/Tokens/Tokens.g.swift` | 静的定数 + dynamic color provider |

## 対象外

- アイコン。トークンではなくアセットとして別 spec で扱う。
- Figma との双方向同期。原本はリポジトリ側の JSON とし、当面 Figma は参照しない。

## 受け入れ条件

`[x]` = 自動テスト・静的解析で確認できる / `[ ]` = 手動確認が残る

### 共通
- [ ] `src/` 配下のすべてのファイルが DTCG v2025.10 のスキーマ検証を通る
- [ ] component 層のトークンが primitive を直接参照していないことを検査するテストがある
- [ ] 未解決の参照（存在しないトークンへの `{...}`）がビルドで失敗する

### 生成
- [ ] `npm run build` で 4 つの生成先すべてが出力される
- [ ] 生成物がコミット済みの内容と一致することを CI が検査する（生成忘れの検出）

### プレーン Web
- [ ] `tokens.css` が `@layer tokens` 内で `:root` に変数を定義する
- [ ] light / dark が `prefers-color-scheme` と明示指定の両方で切り替わる
- [ ] 実ブラウザ（Safari / Chrome / Firefox）で OKLCH が意図した色で表示される

### Flutter
- [ ] `tokens.g.dart` が `ThemeExtension` を実装し `lerp` / `copyWith` を持つ
- [ ] `Theme.of(context).extension<YnTokens>()` から全トークンが取得できる
- [ ] iOS / Android 実機でライト・ダーク切替が反映される

### SwiftUI
- [ ] `Tokens.g.swift` が Swift Package 内で公開シンボルとして解決する
- [ ] iOS 実機でライト・ダーク切替が反映される

## 関連

- ADR `design-token-format`（トークン形式と変換ツールの選定）
