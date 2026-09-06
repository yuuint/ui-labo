---
name: <kebab-case の物理名>
title: <機能領域名>
status: draft            # draft | approved | done
platforms:               # コンポーネント spec のみ。基盤 spec では省略可
  web: none              # none | draft | beta | stable
  vue: none
  flutter: none
  swiftui: none
---

# <機能領域名>

## 概要

何のための機能か。1〜3行。背景や経緯は書かない（それは ADR）。

## 契約（プラットフォーム非依存）

4つの実装すべてが守るべき仕様。ここが本体。

### API

| 名前 | 型 | 既定値 | 説明 |
|---|---|---|---|
| | | | |

### 状態

default / hover / active / focus / disabled / loading などの定義と、それぞれの見た目・挙動。

### 使用トークン

このコンポーネントが参照する semantic / component トークン。primitive を直接参照しないこと。

### アクセシビリティ

ロール、キーボード操作、フォーカス可視性、コントラスト比。

## プラットフォーム差異

意図的に揃えない点と、その理由。「揃えられなかった」ではなく「揃えない」と決めたものだけを書く。

| プラットフォーム | 差異 | 理由 |
|---|---|---|
| | | |

## 対象外

このコンポーネントでは扱わないこと。

## 受け入れ条件

`[x]` = 実装完了。自動テスト・静的解析で確認できる。
`[ ]` = 実機・実値・ネイティブ設定など、手動確認が残る。

### 共通（契約）
- [ ]

### Web
- [ ]

### Vue
- [ ]

### Flutter
- [ ]

### SwiftUI
- [ ]

## 関連

- ADR NNNN
- spec NNNN
