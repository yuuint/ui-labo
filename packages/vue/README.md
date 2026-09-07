# @ynetlabo/ui-vue

[ui-labo](https://github.com/yuuint/ui-labo) の Vue 3 向けラッパー。
[`@ynetlabo/ui-core`](https://www.npmjs.com/package/@ynetlabo/ui-core) のカスタム要素を、
`v-model` と型付きの props で使えるようにします。

**[デモとドキュメント](https://ui.ynetlabo.net/)**

```sh
npm install @ynetlabo/ui-vue
```

```vue
<script setup>
import { ref } from "vue";
import { YnPrefecturePicker } from "@ynetlabo/ui-vue";
import "@ynetlabo/ui-tokens/dist/tokens.css";

const pref = ref(null);
</script>

<template>
  <YnPrefecturePicker v-model="pref" name="pref" code-format="jis" />
</template>
```

`app.use()` でまとめて登録もできます。

```js
import YnLaboUi from "@ynetlabo/ui-vue";
app.use(YnLaboUi);
```

## 使い勝手のためにしていること

- **`isCustomElement` の設定が要りません。** レンダー関数で書いているため、
  テンプレートコンパイラを通りません
- **SSR を通せます。** 要素の登録は `onMounted` の動的 import に寄せてあるので、
  サーバでは空の要素が出るだけです。`<client-only>` で囲む必要はありません
- **指定しなかった prop は既定を倒しません。** 例えば `searchable` は既定が真ですが、
  書かなければ真のままです

## props

`modelValue`（`v-model`）のほか、core と同じ指定が使えます。

`selectionLevel` / `multiple` / `codeFormat` / `grouping` / `layout` / `display` /
`searchable` / `placeholder` / `disabled` / `required` / `invalid` / `name` /
`transition` / `mode` / `footer` / `items`

意味と取りうる値は[コンポーネントのページ](https://ui.ynetlabo.net/prefecture-picker.html)にあります。

## イベント

| | |
|---|---|
| `update:modelValue` | 選択が変わったとき。値は `codeFormat` に従う（複数選択では配列） |
| `change` | 下地のカスタム要素の `CustomEvent` をそのまま渡す |

## 下地の要素に触る

```vue
<YnPrefecturePicker ref="picker" />
```

```js
picker.value.element   // <yn-prefecture-picker>
```

MIT © ynetlabo
