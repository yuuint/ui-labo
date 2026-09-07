# @ynetlabo/ui-core

[ui-labo](https://github.com/yuuint/ui-labo) のプレーン Web 実装。
素の Custom Elements で書いており、ランタイム依存はありません。

**[デモとドキュメント](https://ui.ynetlabo.net/)**

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

`import` した時点でカスタム要素が登録されます。色・寸法・モーションは
[`@ynetlabo/ui-tokens`](https://www.npmjs.com/package/@ynetlabo/ui-tokens) の
CSS カスタムプロパティ経由なので、読み込むだけでテーマが効きます。

## コンポーネント

| 要素 | 仕様 |
|---|---|
| `<yn-prefecture-picker>` | [都道府県 Picker](https://ui.ynetlabo.net/prefecture-picker.html) |

## フレームワークから使う

Vue では、カスタム要素と誤認させない設定と、値のプロパティ束縛が必要です。

```ts
// nuxt.config.ts / vite.config.ts
vue: { compilerOptions: { isCustomElement: (tag) => tag.startsWith("yn-") } }
```

```vue
<yn-prefecture-picker :value.prop="pref" @change="pref = $event.detail.value" />
```

MIT © Yuuki.U ([ynetlabo](https://ynetlabo.net))
