---
name: design-token-format
title: トークンは DTCG 2025.10 形式を正とし Style Dictionary v5 で変換する
status: 採用
date: 2026-09-05
---

# トークンは DTCG 2025.10 形式を正とし Style Dictionary v5 で変換する

## 背景

4 実装の見た目を一致させるには、色・余白・タイポグラフィの定義を 1 箇所に持ち、
CSS / TypeScript / Dart / Swift へ機械的に配る必要がある。
この「1 箇所」のファイル形式と、変換ツールを決める必要があった。

自前の JSON スキーマ + 自作変換スクリプトという選択肢もある
（本プロジェクトは UI コンポーネントをフルスクラッチで作る方針のため）。

## 決定

- トークンの原本は **W3C DTCG Design Tokens Format v2025.10** に準拠した
  `*.tokens.json` とする。
- 変換は **Style Dictionary v5** に任せる。Dart / Swift の出力のみカスタム
  フォーマッタを `packages/tokens/formats/` に自作する。
- テーマ（light / dark、将来のブランド）は **DTCG Resolver Module** で表現し、
  `light.json` / `dark.json` のようなファイル分割では表現しない。
- 階層は **primitive → semantic → component** の 3 層。
  コンポーネントから primitive を直接参照することを禁止する。

## 理由

- DTCG は 2025-10-28 に**初の安定版 v2025.10** に到達した。それ以前は draft のみで、
  自前スキーマを選ぶ合理性があったが、この日を境に前提が変わった。
  Adobe / Amazon / Google / Microsoft / Meta / Figma / Salesforce / Shopify など
  20 社以上の編集者が関与している。
- 対応ツールが出揃っている — Figma / Penpot / Sketch / Tokens Studio /
  Style Dictionary / Terrazzo。将来 Figma をデザイン原本にしたくなった時に、
  独自スキーマだと変換層を自作することになる。zeroheight の調査では
  採用率が 56% → 84%（約 300 名）に上昇。
- Style Dictionary は最新 v5.5.2 が 2025.10 準拠。CSS / SCSS / iOS Swift /
  Compose / Flutter / JS の出力を内蔵しており、Web 側は追加実装ゼロで済む。
  **旧形式のサポートは 2026 年 9 月頭で終了**するため、新規に旧形式を選ぶ理由がない。
- 「フルスクラッチ」の価値は UI コンポーネントの実装にあり、
  トークン変換パイプラインの自作から得られるものは少ないと判断した。
- 3 層構造は semantic 層が絶縁体として働き、「semantic を差し替えれば全コンポーネント」
  「primitive を差し替えれば全テーマ」という 2 軸の独立を生む。
  2 層だとテーマ追加時にコンポーネント側の書き換えが発生する。

## 影響とトレードオフ

- Node.js への依存が Flutter / SwiftUI パッケージのビルド前段に入る。
  生成物はコミットするため、**利用者側には Node が不要**。開発者のみ必要。
- Style Dictionary の Dart / Swift 標準出力は静的定数の羅列であり、
  Flutter の `ThemeExtension` を生成するにはカスタムフォーマッタが要る。
  ここは自作コストとして受け入れる。
- 捨てた選択肢: Terrazzo（DTCG ネイティブ、modes の発祥）。
  Flutter / Swift 出力の実績が Style Dictionary より薄く、
  カスタムフォーマッタを書く前提なら差が出ないと判断した。

## 再検討の条件

- Dart / Swift のカスタムフォーマッタが合計 500 行を超え、
  Style Dictionary の枠内で書く利点が消えた場合（自作パイプラインへ）。
- DTCG に後方互換性のない変更が入り、v2025.10 準拠のまま止まる判断をした場合
  （その時点で ADR を新規起票し、バージョンを固定する）。
- Terrazzo が Flutter / Swift の一級サポートを持ち、
  カスタムフォーマッタが不要になった場合。

## 関連

- spec `design-tokens`（デザイントークンの仕様）
- [Design Tokens specification reaches first stable version](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/)
- [Design Tokens Format Module](https://www.designtokens.org/tr/drafts/format/)
- [Design Tokens Resolver Module 2025.10](https://www.designtokens.org/tr/drafts/resolver/)
- [Style Dictionary — DTCG](https://styledictionary.com/info/dtcg/)
