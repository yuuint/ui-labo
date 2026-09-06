/**
 * Shadow DOM 内のスタイル。値は @ynetlabo/ui-tokens の CSS カスタムプロパティを参照する。
 * カスタムプロパティは shadow 境界を越えて継承されるので、テーマの切り替えはそのまま効く。
 * tokens.css を読み込んでいない場合でも壊れないよう、すべてにフォールバックを置く。
 */
export const css = /* css */ `
:host {
  display: block;
  position: relative;
  --_ink:      var(--color-ink, #14171d);
  --_ink2:     var(--color-ink2, #4c5666);
  --_ink3:     var(--color-ink3, #818c9d);
  --_surface:  var(--prefecture-picker-trigger-bg, #fff);
  --_line:     var(--color-line, #dce2ea);
  --_line2:    var(--prefecture-picker-trigger-border, #c5cdd9);
  --_accent:   var(--prefecture-picker-trigger-border-hover, #1b4d89);
  --_wash:     var(--color-accent-wash, #e6eef8);
  --_sunken:   var(--prefecture-picker-option-bg-hover, #edf1f6);
  --_danger:   var(--color-danger, #a8443a);
  --_sea:      var(--prefecture-picker-map-sea, #e7eef5);
  --_landline: var(--prefecture-picker-map-land-line, #fff);
  --_outline:  var(--prefecture-picker-map-outline, #14171d);
  --_outlineHover: var(--prefecture-picker-map-outline-hover, #4c5666);
  --_h:        var(--prefecture-picker-trigger-height, 38px);
  --_r:        var(--prefecture-picker-trigger-radius, 6px);
  --_panelR:   var(--prefecture-picker-popover-radius, 14px);
  --_sheetR:   var(--prefecture-picker-sheet-radius, 18px);
  --_touch:    var(--prefecture-picker-sheet-min-target, 44px);
  --_dur:      var(--prefecture-picker-popover-duration, 170ms);
  --_sheetDur: var(--prefecture-picker-sheet-duration, 300ms);
  --_zoomDur:  var(--prefecture-picker-map-zoom-duration, 520ms);
  --_dilate:   var(--prefecture-picker-map-fill-dilate, 4.5px);
  --_olW:      var(--prefecture-picker-map-outline-width, 8.5px);
  --_olHoverW: var(--prefecture-picker-map-outline-hover-width, 3.4px);
  --_hairline: var(--prefecture-picker-map-land-line-width, 1px);
  --_popMin:   var(--prefecture-picker-popover-min-width, 272px);
  --_popMax:   var(--prefecture-picker-popover-max-width, 420px);
  font: inherit;
  color: var(--_ink);
}
:host([hidden]) { display: none }
* { box-sizing: border-box }
button, input { font: inherit; color: inherit; touch-action: manipulation }
:focus-visible { outline: 2px solid var(--_accent); outline-offset: 2px; border-radius: 5px }

/* ---- トリガ ---- */
.trigger {
  display: flex; align-items: center; gap: 8px; width: 100%;
  height: var(--_h); padding: 0 11px;
  border: 1px solid var(--_line2); border-radius: var(--_r);
  background: var(--_surface); cursor: pointer; text-align: left;
  transition: border-color .12s, box-shadow .12s;
}
.trigger:hover:not(:disabled) { border-color: var(--_accent) }
.trigger[aria-expanded="true"] { border-color: var(--_accent); box-shadow: 0 0 0 3px var(--_wash) }
.trigger:disabled { background: var(--_sunken); color: var(--_ink3); cursor: default }
:host([invalid]) .trigger, .trigger[aria-invalid="true"] { border-color: var(--_danger) }
.ph { color: var(--_ink3) }
.more { color: var(--_ink3); font-size: .86em }
.emit { margin-left: auto; font-size: .78em; color: var(--_ink3);
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace }
.caret { color: var(--_ink3); font-size: .7em }

/* ---- ポップオーバー ---- */
.scrim { display: none }
.panel {
  position: absolute; z-index: 40; top: calc(100% + 5px); left: 0;
  width: 100%; min-width: var(--_popMin);
  max-width: min(var(--_popMax), calc(100vw - 24px));
  background: var(--_surface); border: 1px solid var(--_line2);
  border-radius: var(--_panelR); box-shadow: 0 4px 6px -2px rgba(20,23,29,.06), 0 14px 34px -12px rgba(20,23,29,.28);
  overflow: hidden;
  --_cy: -6px; --_cs: .985; --_co: 0; --_d: var(--_dur);
  --_ease: cubic-bezier(.22,.7,.3,1);
  transform-origin: top center;
  opacity: var(--_co); transform: translateY(var(--_cy)) scale(var(--_cs)); visibility: hidden;
  transition: opacity var(--_d) var(--_ease), transform var(--_d) var(--_ease),
              height var(--_d) var(--_ease), visibility 0s linear var(--_d);
}
.panel.open { opacity: 1; transform: none; visibility: visible;
  transition: opacity var(--_d) var(--_ease), transform var(--_d) var(--_ease),
              height var(--_d) var(--_ease), visibility 0s }
:host([transition="fade"])  .panel { --_cy: 0; --_cs: 1 }
:host([transition="slide"]) .panel { --_cy: 10px; --_cs: 1; --_d: 240ms }
:host([transition="none"])  .panel, :host([transition="none"]) .scrim { --_d: 0s }

.head { display: flex; align-items: center; gap: 7px; padding: 8px 9px; border-bottom: 1px solid var(--_line) }
.back { display: inline-flex; align-items: center; height: 28px; padding: 0 9px;
  border: 1px solid var(--_line2); background: var(--_surface); border-radius: 6px;
  cursor: pointer; font-size: 12px; white-space: nowrap }
.back:hover { border-color: var(--_accent); color: var(--_accent) }
.here { font-size: 12px; font-weight: 700; white-space: nowrap; overflow: hidden;
  text-overflow: ellipsis; min-width: 0; padding: 0 2px }
.modes { display: inline-flex; gap: 2px; margin-left: auto; background: var(--_sunken);
  padding: 2px; border-radius: 8px; flex: 0 0 auto }
.modes button { height: 26px; padding: 0 10px; border: 0; background: transparent;
  border-radius: 6px; cursor: pointer; font-size: 11.5px; color: var(--_ink2) }
.modes button[aria-pressed="true"] { background: var(--_surface); color: var(--_ink);
  font-weight: 700; box-shadow: 0 1px 2px rgba(0,0,0,.12) }
.modes button:disabled { opacity: .4; cursor: default }
.close { display: none }
.search-row { padding: 8px 9px 0 }
.search { width: 100%; height: 30px; padding: 0 9px; border: 1px solid var(--_line2);
  border-radius: 6px; background: var(--_surface); font-size: 12.5px }

/* ---- 地図 ---- */
.mapbox { background: var(--_sea); display: flex; justify-content: center; overflow: hidden }
svg { display: block; width: 100%; height: auto; max-height: min(56vh, 500px) }
.zoom { transform-box: view-box; transform-origin: 0 0;
  transition: transform var(--_zoomDur) cubic-bezier(.3,.8,.25,1) }
.pref { fill: var(--tc); fill-opacity: .5; stroke: var(--_landline); stroke-width: var(--_hairline);
  stroke-linejoin: round; cursor: pointer; transition: fill-opacity .16s, opacity .18s }
.pref.dim { opacity: .2; pointer-events: none }
.pref.hot { fill-opacity: .94 }
.pref.sel { fill-opacity: 1 }
/* エリアは 1 面として描く。半透明にすると重なった帯だけ濃くなるので不透明色で薄さを作る */
.area-fill { --pale: color-mix(in oklab, var(--tc) 48%, var(--_sea));
  fill: var(--pale); stroke: var(--pale); stroke-width: var(--_dilate);
  stroke-linejoin: round; stroke-linecap: round; cursor: pointer;
  transition: fill .16s, stroke .16s }
.area-fill.hot { --pale: color-mix(in oklab, var(--tc) 90%, var(--_sea)) }
.area-fill.sel { --pale: var(--tc) }
/* 塗りの下に敷く縁取り。上の塗りで覆われ、外周だけが残る */
.area-edge { fill: var(--_landline); stroke: var(--_landline); stroke-width: 9;
  stroke-linejoin: round; stroke-linecap: round; pointer-events: none }
.area-edge.sel { --ol: color-mix(in oklab, var(--_outline) 74%, var(--_sea));
  fill: var(--ol); stroke: var(--ol); stroke-width: var(--_olW) }
.ring { stroke-linejoin: round; stroke-linecap: round; pointer-events: none }
.ring.sel { fill: var(--_outline); stroke: var(--_outline); stroke-width: 5 }
.ring.hot { fill: var(--_outlineHover); stroke: var(--_outlineHover);
  stroke-width: var(--_olHoverW); opacity: .8 }
.label { font-weight: 700; fill: #fff; paint-order: stroke; stroke: rgba(0,0,0,.5);
  stroke-width: 5; stroke-linejoin: round; text-anchor: middle;
  dominant-baseline: central; pointer-events: none }
.check { pointer-events: none }
.check circle { fill: var(--_outline); stroke: var(--_surface) }
.check path { fill: none; stroke: var(--_surface); stroke-linecap: round; stroke-linejoin: round }
.inset { fill: none; stroke: var(--_line2); stroke-dasharray: 7 6; stroke-width: 2; pointer-events: none }
.inset-hit { fill: transparent; cursor: pointer }
.inset-hit.hot { fill: var(--_ink); fill-opacity: .07 }

/* ---- 一覧 ---- */
.list { max-height: 236px; overflow: auto; padding: 6px }
.group-head { font-size: 10.5px; letter-spacing: .08em; color: var(--_ink3); padding: 6px 8px 3px }
.opt { display: flex; align-items: baseline; gap: 8px; width: 100%; padding: 6px 8px;
  border: 0; background: transparent; border-radius: 5px; cursor: pointer; text-align: left }
.opt:hover { background: var(--_sunken); box-shadow: inset 0 0 0 1.5px var(--_ink) }
.opt[aria-selected="true"] { background: var(--prefecture-picker-option-bg-selected, #1b4d89);
  color: var(--prefecture-picker-option-text-selected, #fff); font-weight: 700 }
.opt .code { font-family: ui-monospace, Menlo, monospace; font-size: 10.5px;
  color: var(--_ink3); min-width: 20px }
.opt[aria-selected="true"] .code { color: rgba(255,255,255,.75) }
.opt[aria-selected="true"] .code::before { content: "✓"; margin-right: 3px }
.opt .kana { font-size: 10.5px; color: var(--_ink3); margin-left: auto }
.opt[aria-selected="true"] .kana { color: rgba(255,255,255,.75) }
.empty { padding: 22px 10px; text-align: center; color: var(--_ink3); font-size: 12.5px }

/* ---- 複数選択のフッタ ---- */
.foot { display: flex; align-items: center; gap: 7px; padding: 8px 9px;
  border-top: 1px solid var(--_line); background: var(--_sunken) }
.count { font-size: 11.5px; color: var(--_ink2); margin-right: auto;
  font-variant-numeric: tabular-nums }
.fbtn { height: 28px; padding: 0 11px; border: 1px solid var(--_line2); border-radius: 6px;
  background: var(--_surface); cursor: pointer; font-size: 12px }
.fbtn:disabled { opacity: .45; cursor: default }
.fbtn.primary { background: var(--_accent); border-color: var(--_accent); color: #fff; font-weight: 700 }

/* ---- 狭い画面: 下からのシート ---- */
@media (max-width: 599px) {
  .scrim { display: block; position: fixed; inset: 0; background: rgba(10,14,20,.42); z-index: 39;
    opacity: 0; visibility: hidden;
    transition: opacity var(--_sheetDur) ease, visibility 0s linear var(--_sheetDur) }
  .scrim.open { opacity: 1; visibility: visible; transition: opacity var(--_sheetDur) ease, visibility 0s }
  .panel { position: fixed; left: 0; right: 0; bottom: var(--_kb, 0px); top: auto;
    width: 100%; min-width: 0; max-width: none;
    border-radius: var(--_sheetR) var(--_sheetR) 0 0; border-bottom: 0;
    max-height: 88vh; overflow: auto; overscroll-behavior: contain;
    padding-bottom: env(safe-area-inset-bottom);
    --_cy: 100%; --_cs: 1; --_co: 1; --_d: var(--_sheetDur);
    --_ease: cubic-bezier(.32,.72,0,1); transform-origin: bottom center }
  :host([transition="fade"]) .panel { --_cy: 0; --_co: 0 }
  .head { position: sticky; top: 0; z-index: 2; background: var(--_surface); padding: 14px 12px 10px }
  .head::before { content: ""; position: absolute; top: 5px; left: 50%; transform: translateX(-50%);
    width: 36px; height: 4px; border-radius: 2px; background: var(--_line2) }
  .search-row { position: sticky; top: 66px; z-index: 2; background: var(--_surface); padding: 0 12px 10px }
  .close { display: inline-flex; align-items: center; justify-content: center;
    width: 40px; height: 40px; flex: 0 0 auto; border: 1px solid var(--_line2);
    border-radius: 10px; background: var(--_surface); cursor: pointer; font-size: 16px }
  .search, .back { height: var(--_touch) }
  .modes { padding: 3px }
  .modes button { height: 34px; padding: 0 15px; font-size: 13px }
  .fbtn { height: var(--_touch); padding: 0 16px; font-size: 13.5px }
  .opt { padding: 11px 10px; font-size: 14px }
  .list { max-height: none }
  svg { max-height: 44vh }
}

@media (prefers-reduced-motion: reduce) {
  .panel, .scrim, .zoom, .pref, .area-fill { transition: none !important }
}
`;
