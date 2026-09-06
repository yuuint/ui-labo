---
name: package-manager
title: JS ワークスペースは npm workspaces で管理する
status: 採用
date: 2026-09-06
---

# JS ワークスペースは npm workspaces で管理する

## 背景

モノレポ（ADR `monorepo`）の JS 側をどのツールで管理するか。
開発環境は Node.js v24.14.1 / npm あり、**pnpm・yarn は未インストール**。

管理対象は `packages/tokens` `packages/data` `packages/core` `packages/vue` と
`apps/site` の 5 ワークスペース程度。当面 8 を超える見込みはない。

## 決定

**npm workspaces** を使う。Turborepo / Changesets は導入しない。

## 理由

- **追加インストールが要らない。** Node に同梱されており、開発環境にすでにある。
  CI も `actions/setup-node` だけで動く。
- ワークスペースが一桁のうちは、`--workspace` によるコマンド絞り込みで足りる。
  pnpm の `--filter` ほど柔軟ではないが、5 個の並びで困る場面が想像できない。
- ui-labo の目的は UI コンポーネントをフルスクラッチで作ることであり、
  ビルド基盤の最適化に時間を使う段階ではない。**まだ 1 コンポーネントも実装していない。**

## 影響とトレードオフ

### 依存の分離が効かない — 検査で代替する

npm workspaces は hoisting により、**全パッケージが全依存を参照できてしまう**。
ADR `plain-web-custom-elements` で `packages/core` は「ランタイム依存ゼロ」と決めているが、
npm はこれを保証しない。`core` が他パッケージの依存を誤って import しても、
ローカルでも CI でも通り、**利用者が npm から入れた時点で初めて壊れる**。

これは規約では守れないので、**検査スクリプトで機械的に守る**。

- `packages/*/src` の import 文を走査し、そのパッケージの `package.json` に
  宣言されていない外部パッケージを参照していたら失敗させる
- CI の必須チェックに入れる
- `packages/core` は外部 import が 1 件でもあれば失敗（依存ゼロのため）

pnpm ならパッケージマネージャ自身が同じことを保証する。
**この検査は、pnpm を選ばなかったことの対価**であり、外してはいけない。

### その他

- ロックファイルはルートに 1 つ。パッケージ単位のインストール分離はできない。
- npm への publish 運用を始めるとき、バージョン管理と CHANGELOG を手作業で回すことになる。
  Changesets の導入はその時点で別途判断する。

### 捨てた選択肢: pnpm workspaces

2026 時点のモノレポでは主流（Vue / Vite / Nuxt / Astro / Prisma / Turborepo、
Vercel の社内モノレポが採用）。依存の分離がパッケージマネージャ自身で効くため、
上記の検査スクリプトが不要になる。
採用しなかったのは、追加インストールと CI 設定が増えることに対して、
現時点の規模では見返りが小さいと判断したため。

## 再検討の条件

- **依存の検査スクリプトをすり抜けて、宣言外の依存が出荷された場合。**
  検査で守る前提が崩れたということなので、pnpm へ移行する。
- ワークスペースが 8 個を超えた場合。
- CI のインストール・ビルド時間が 1 変更あたり 5 分を超えた場合。
- npm レジストリへの publish 運用を始める時点。Changesets の導入とあわせて再検討する。

移行は、ワークスペースが少ないうちは低コスト（`package.json` の `workspaces` を消し、
`pnpm-workspace.yaml` を置く）。**この決定は後戻りしやすい。**

## 関連

- ADR `monorepo`
- ADR `plain-web-custom-elements`（依存ゼロの約束）
