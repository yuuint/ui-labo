/** ui-labo の Vue 向け入口。core のカスタム要素を Vue から使えるようにする */
import { YnPrefecturePicker } from "./prefecture-picker.js";

export { YnPrefecturePicker, TAG, PROP_MAP } from "./prefecture-picker.js";

/** app.use() でまとめて登録したいとき */
export default {
  install(app) {
    app.component("YnPrefecturePicker", YnPrefecturePicker);
  },
};
