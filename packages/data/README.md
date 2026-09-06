# @ynetlabo/ui-data

[ui-labo](https://github.com/yuuint/ui-labo) が 4 プラットフォームで共有するマスタデータ。
都道府県 47 件と、日本地図の形状を持ちます。

```sh
npm install @ynetlabo/ui-data
```

```js
import { PREFECTURES } from "@ynetlabo/ui-data";
import { VIEW_BOX, PATHS } from "@ynetlabo/ui-data/outline";
import { normalize, match } from "@ynetlabo/ui-data/normalize";

PREFECTURES[12];
// { code: "13", name: "東京都", shortName: "東京", kana: "とうきょうと", ... }
```

## 中身

| 入口 | 内容 |
|---|---|
| `@ynetlabo/ui-data` | 都道府県 47 件。コード・表記・読み・検索キー・エリア所属 |
| `@ynetlabo/ui-data/outline` | 日本地図の SVG パスと viewBox（沖縄は別枠） |
| `@ynetlabo/ui-data/normalize` | 表記ゆれを吸収する照合。4 実装が同じ規則を使う |

`dist/prefectures.g.dart` と `dist/Prefectures.g.swift` に、同じ順序・同じ件数の
生成物が入っています。3 つが一致していることはテストで保証しています。

「とうきょう」「トーキョー」「tokyo」「toukyou」「東京」はいずれも同じ県に届きます。

## 出典

- 都道府県マスタ: [ynetlabo API](https://api.ynetlabo.net) の応答を固定値として同梱
- 地図の形状: [Natural Earth](https://www.naturalearthdata.com/)（パブリックドメイン）を
  簡略化・平滑化して生成

MIT © ynetlabo
