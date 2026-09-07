/**
 * <YnPrefecturePicker> — core のカスタム要素を Vue から自然に使うための薄い覆い。
 *
 * 振る舞いは core にしかない（ADR `vue-wraps-custom-element`）。ここでやるのは 3 つだけ。
 *   1. v-model を仲介する
 *   2. 値をプロパティとして入れる（属性は文字列しか運べない）
 *   3. カスタム要素の登録をクライアントに寄せ、SSR を素通りさせる
 */
import { defineComponent, h, onBeforeUnmount, onMounted, shallowRef, watchEffect } from "vue";

export const TAG = "yn-prefecture-picker";

/**
 * Vue の prop 名 → カスタム要素のプロパティ名。
 * core の `static props` と 1 対 1 で対応する（ずれたら test が落ちる）。
 *
 * **並び順に意味がある。value は必ず最後。**
 * 値の解釈は codeFormat と selectionLevel に依るので、設定より先に value を
 * 入れると別の表現として読まれ、正しい値が捨てられる。
 */
export const PROP_MAP = {
  selectionLevel: "selectionLevel",
  multiple: "multiple",
  codeFormat: "codeFormat",
  grouping: "grouping",
  layout: "layout",
  display: "display",
  searchable: "searchable",
  placeholder: "placeholder",
  disabled: "disabled",
  required: "required",
  invalid: "invalid",
  name: "name",
  transition: "transition",
  mode: "mode",
  footer: "footer",
  items: "items",
  modelValue: "value",
};

// 既定値は core が持っている。ここで false を補うと searchable のように
// 既定が真のものを黙って倒してしまうので、指定が無ければ undefined のままにする
const opt = (type) => ({ type, default: undefined });

export const YnPrefecturePicker = defineComponent({
  name: "YnPrefecturePicker",

  props: {
    modelValue: opt([String, Number, Array]),
    selectionLevel: opt(String),
    multiple: opt(Boolean),
    codeFormat: opt(String),
    grouping: opt([String, Object]),
    layout: opt(String),
    display: opt(String),
    searchable: opt(Boolean),
    placeholder: opt(String),
    disabled: opt(Boolean),
    required: opt(Boolean),
    invalid: opt(Boolean),
    name: opt(String),
    transition: opt(String),
    mode: opt(String),
    footer: opt(String),
    items: opt(Array),
  },

  // ここで宣言しておくと、Vue が同名の native リスナを重ねて付けない
  emits: ["update:modelValue", "change"],

  setup(props, { emit, expose }) {
    const el = shallowRef(null);

    const onChange = (e) => {
      emit("update:modelValue", e.detail.value);
      emit("change", e);
    };

    // 描画の後に流す。要素が出来ていないと入れる先が無い
    watchEffect(() => {
      const node = el.value;
      if (!node) return;
      for (const [from, to] of Object.entries(PROP_MAP)) {
        const v = props[from];
        if (v === undefined) continue;      // 指定が無いものは core の既定に任せる
        if (node[to] !== v) node[to] = v;
      }
    }, { flush: "post" });

    onMounted(async () => {
      el.value?.addEventListener("change", onChange);
      // 定義前に入れたプロパティは、昇格のときに core の基底クラスが拾い直す
      if (!customElements.get(TAG)) await import("@ynetlabo/ui-core");
    });

    onBeforeUnmount(() => el.value?.removeEventListener("change", onChange));

    expose({
      /** 下地のカスタム要素。フォーム検証など core 側の API を直に触りたいとき */
      get element() { return el.value; },
    });

    // テンプレートを通さないので、利用側に isCustomElement の設定が要らない。
    // サーバでは空の要素になるだけで、DOM にも触れない
    return () => h(TAG, { ref: el });
  },
});
