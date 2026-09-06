// 生成物。手で編集しない。更新は npm run build（@ynetlabo/ui-data）
export interface Prefecture {
  /** JIS X 0401 の 2 桁ゼロ埋め */
  code: string;
  /** ynetlabo API の pref_code */
  ynetlaboCode: string;
  name: string; shortName: string;
  kana: string; kanaShort: string;
  romaji: string; areaCode: string;
  /** 正規化済みの照合キー。実装側は部分一致だけを行う */
  searchKeys: string[];
}
export interface Area { code: string; name: string; romaji: string }
export declare const PREFECTURES: readonly Prefecture[];
export declare const AREAS: readonly Area[];
