# ui-labo

ynetlabo の UI コンポーネント集。1 つの仕様とデザイントークンを、
プレーン Web / Vue / Flutter / SwiftUI の 4 実装が共有します。

**[サイト（デモとドキュメント）](https://ui.ynetlabo.net/)**

## パッケージ

| パッケージ | 中身 |
|---|---|
| [`@ynetlabo/ui-core`](packages/core) | プレーン Web 実装（素の Custom Elements、ランタイム依存ゼロ） |
| [`@ynetlabo/ui-tokens`](packages/tokens) | デザイントークン（DTCG 2025.10）と CSS / Dart / Swift への変換 |
| [`@ynetlabo/ui-data`](packages/data) | 都道府県マスタと日本地図の形状。4 実装が同じ値を見る |

## 使う

```sh
npm install @ynetlabo/ui-core
```

```html
<link rel="stylesheet" href="node_modules/@ynetlabo/ui-tokens/dist/tokens.css">
<script type="module">
  import "@ynetlabo/ui-core";
</script>

<yn-prefecture-picker name="pref" code-format="jis"></yn-prefecture-picker>
```

`import` した時点でカスタム要素が登録されます。`form` の中に置けばそのまま送信されます。

## 作る

```sh
npm install
npm run check     # check:deps → build → test
```

- `npm run build` — トークン・データ・サイトの生成物を作り直す
- `npm test` — 各パッケージのテスト
- `npm run check:deps` — 宣言していない外部依存の検出（ADR `package-manager`）

生成物（`packages/*/dist`、`packages/data/src/*.json`）はコミットします。
CI が `git diff --exit-code` で入れ忘れを見つけます。

### 元データの取得

外部から取ってくるものは、生成物だけをコミットして取得スクリプトを残しています。

```sh
npm run sync:data -w @ynetlabo/ui-data   # ynetlabo API の都道府県マスタ
npm run sync:geo  -w @ynetlabo/ui-data   # Natural Earth（公有ドメイン）の形状
```

## ドキュメント

- [`docs/specs/`](docs/specs) — **今、何がどう動くか**。4 実装が守る契約
- [`docs/adr/`](docs/adr) — **なぜそうしたか**。判断とトレードオフ

振る舞いを変えるときは spec を先に直します。サイトの API 表と対応状況は
spec から生成しているため、spec が唯一のソースです。

## ライセンス

MIT © ynetlabo

地図の形状は [Natural Earth](https://www.naturalearthdata.com/)（パブリックドメイン）を
加工して生成しています（ADR `japan-map-geodata`）。
