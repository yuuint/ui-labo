import type { DefineComponent, Plugin } from "vue";

/** codeFormat に応じた値の表現。詳細は spec `prefecture-picker` */
export type PrefectureValue = string | number;

export interface YnPrefecturePickerProps {
  /** 選択中の値。multiple のときは配列 */
  modelValue?: PrefectureValue | PrefectureValue[] | null;
  /** 選ぶ単位 */
  selectionLevel?: "prefecture" | "area";
  multiple?: boolean;
  /** value と change の表現 */
  codeFormat?: "jis" | "jisNumber" | "ynetlabo" | "iso" | "name" | "shortName";
  /** 区切り。カスタム定義はオブジェクトで渡す */
  grouping?: "region9" | "region8" | "region11" | "kana" | "none" | object;
  layout?: "list" | "map";
  /** トリガへ表示する表記 */
  display?: "name" | "shortName";
  searchable?: boolean;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  /** フォーム送信時のフィールド名 */
  name?: string;
  transition?: "auto" | "fade" | "slide" | "none";
  /** dropdown は押して開く、inline は常に表示 */
  mode?: "dropdown" | "inline";
  /** フッタに出す部品。"auto" | "none" か count / clear / done の並び */
  footer?: string;
  /** 都道府県データの差し替え */
  items?: unknown[];
}

export interface YnPrefecturePickerEmits {
  (e: "update:modelValue", value: PrefectureValue | PrefectureValue[] | null): void;
  (e: "change", event: CustomEvent): void;
}

export interface YnPrefecturePickerExposed {
  /** 下地のカスタム要素 */
  readonly element: HTMLElement | null;
}

export declare const YnPrefecturePicker: DefineComponent<
  YnPrefecturePickerProps,
  YnPrefecturePickerExposed,
  {},
  {},
  {},
  {},
  {},
  YnPrefecturePickerEmits
>;

export declare const TAG: "yn-prefecture-picker";
export declare const PROP_MAP: Record<keyof YnPrefecturePickerProps, string>;

declare const plugin: Plugin;
export default plugin;
