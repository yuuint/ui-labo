# ADR（Architecture Decision Record）一覧

このディレクトリは **「なぜそう決めたか」** を持つ。決定した時点の記録であり、書き換えない。

## 一覧

日付順。

| 決定 | status | date |
|---|---|---|
| [monorepo](monorepo.md) — 4 プラットフォームを 1 リポジトリに置く | 採用 | 2026-09-05 |
| [design-token-format](design-token-format.md) — トークンは DTCG 2025.10 形式を正とし Style Dictionary v5 で変換する | 採用 | 2026-09-05 |
| [plain-web-custom-elements](plain-web-custom-elements.md) — プレーン Web は依存ゼロの Custom Elements で実装する | 採用 | 2026-09-05 |
| [shared-data-package](shared-data-package.md) — 共有マスタデータは packages/data に置き、コード生成で配る | 採用 | 2026-09-05 |
| [data-snapshot-from-api](data-snapshot-from-api.md) — マスタデータは ynetlabo API のビルド時スナップショットを原本とする | 採用 | 2026-09-05 |
| [supplement-merge](supplement-merge.md) — API が持たないフィールドはリポジトリ側で持ち、フィールド単位で所有者を分ける | 採用 | 2026-09-05 |
| [doc-naming](doc-naming.md) — spec と ADR は通し番号を持たず、物理名で識別する | 採用 | 2026-09-06 |
| [japan-map-geodata](japan-map-geodata.md) — 地図の県境は Natural Earth（パブリックドメイン）を簡略化して同梱する | 採用 | 2026-09-06 |
| [package-manager](package-manager.md) — JS ワークスペースは npm workspaces で管理する | 採用 | 2026-09-06 |

## spec との役割分担

|  | 書くもの | 時制 | 変更時 |
|---|---|---|---|
| **[spec](../specs/)** | 現在の仕様（何がどう動くか） | 常に「今」 | 本文を**書き換える** |
| **ADR** | 決定の経緯（なぜそうしたか） | 決定した時点 | 書き換えず**新しく起票**し、旧 ADR を「廃止」にする |

混ぜると両方が腐る。仕様を ADR に書かない。理由を spec に書かない。

## 運用ルール

### 命名

**ファイル名は kebab-case の物理名のみ。通し番号は付けない**（ADR `doc-naming`）。
参照するときも ``ADR `japan-map-geodata` `` と名前で書く。

### 書き方

- **書き換えて決定を覆さない。** 新しい名前で起票し、旧 ADR の status を
  `廃止（→ ADR \`name\` で置換）` にする。旧 ADR の本文はそのまま残す。
- **「理由」には具体的な事実を書く。** 「モダンだから」ではなく、依存の衝突・計測値・
  仕様のバージョン・ライセンスの原文を書く。理由が具体的であるほど、後から
  **その理由が当たらないケース**を見分けられる。
- **捨てた選択肢も書く。** 特に、試して駄目だったものは「試した」と分かるように書く。
  同じ道を二度歩かないため。
- **「再検討の条件」を必ず書く。** これが無い ADR は、後から見たときに覆してよいのか
  分からず、判断を縛り続ける。
- 新規追加のたびに、この README の一覧を更新する。

## status

| 値 | 意味 |
|---|---|
| `提案中` | 検討中。まだ従わなくてよい |
| `採用` | 有効。これに従う |
| `廃止（→ ADR \`name\` で置換）` | 無効。置換先を必ず明記する |
