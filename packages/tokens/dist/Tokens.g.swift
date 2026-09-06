// 生成物。手で編集しない。更新は npm run build（@ynetlabo/ui-tokens）
import SwiftUI

public struct YNTokens: Sendable {
    public let colorNeutral0: Color
    public let colorNeutral50: Color
    public let colorNeutral100: Color
    public let colorNeutral200: Color
    public let colorNeutral300: Color
    public let colorNeutral400: Color
    public let colorNeutral500: Color
    public let colorNeutral600: Color
    public let colorNeutral700: Color
    public let colorNeutral800: Color
    public let colorNeutral900: Color
    public let colorNeutral950: Color
    public let colorNeutral1000: Color
    public let colorAi100: Color
    public let colorAi400: Color
    public let colorAi500: Color
    public let colorAi600: Color
    public let colorAi700: Color
    public let colorShu100: Color
    public let colorShu500: Color
    public let colorShu600: Color
    public let colorMap1: Color
    public let colorMap2: Color
    public let colorMap3: Color
    public let colorMap4: Color
    public let colorMap5: Color
    public let colorMap6: Color
    public let colorMap7: Color
    public let colorMap8: Color
    public let colorMap9: Color
    public let colorMap10: Color
    public let colorMap11: Color
    public let colorBg: Color
    public let colorSurface: Color
    public let colorSurface2: Color
    public let colorSunken: Color
    public let colorInk: Color
    public let colorInk2: Color
    public let colorInk3: Color
    public let colorLine: Color
    public let colorLine2: Color
    public let colorAccent: Color
    public let colorAccentHover: Color
    public let colorAccentWash: Color
    public let colorOnAccent: Color
    public let colorDanger: Color
    public let colorDangerWash: Color
    public let colorSea: Color
    public let colorLandLine: Color
    public let colorArea1: Color
    public let colorArea2: Color
    public let colorArea3: Color
    public let colorArea4: Color
    public let colorArea5: Color
    public let colorArea6: Color
    public let colorArea7: Color
    public let colorArea8: Color
    public let colorArea9: Color
    public let colorArea10: Color
    public let colorArea11: Color
    public let space0: CGFloat
    public let space1: CGFloat
    public let space2: CGFloat
    public let space3: CGFloat
    public let space4: CGFloat
    public let space5: CGFloat
    public let space6: CGFloat
    public let space8: CGFloat
    public let space10: CGFloat
    public let space12: CGFloat
    public let radiusSm: CGFloat
    public let radiusMd: CGFloat
    public let radiusLg: CGFloat
    public let radiusXl: CGFloat
    public let radiusFull: CGFloat
    public let radiusControl: CGFloat
    public let radiusPanel: CGFloat
    public let radiusSheet: CGFloat
    public let radiusPill: CGFloat
    public let strokeHair: CGFloat
    public let strokeThin: CGFloat
    public let strokeMedium: CGFloat
    public let strokeThick: CGFloat
    public let sizeField: CGFloat
    public let sizeTouch: CGFloat
    public let sizePopMin: CGFloat
    public let sizePopMax: CGFloat
    public let sizeControlHeight: CGFloat
    public let sizeControlTouch: CGFloat
    public let sizePanelMin: CGFloat
    public let sizePanelMax: CGFloat
    public let durationPop: Double
    public let durationSheet: Double
    public let durationZoom: Double
    public let lineHair: CGFloat
    public let lineDilate: CGFloat
    public let lineEmphasis: CGFloat
    public let lineStrong: CGFloat
    public let motionQuick: Double
    public let motionSheet: Double
    public let motionZoom: Double
    public let prefecturePickerTriggerBg: Color
    public let prefecturePickerTriggerBorder: Color
    public let prefecturePickerTriggerBorderHover: Color
    public let prefecturePickerTriggerText: Color
    public let prefecturePickerTriggerPlaceholder: Color
    public let prefecturePickerTriggerHeight: CGFloat
    public let prefecturePickerTriggerRadius: CGFloat
    public let prefecturePickerPopoverBg: Color
    public let prefecturePickerPopoverBorder: Color
    public let prefecturePickerPopoverRadius: CGFloat
    public let prefecturePickerPopoverMinWidth: CGFloat
    public let prefecturePickerPopoverMaxWidth: CGFloat
    public let prefecturePickerPopoverDuration: Double
    public let prefecturePickerSheetRadius: CGFloat
    public let prefecturePickerSheetMinTarget: CGFloat
    public let prefecturePickerSheetDuration: Double
    public let prefecturePickerMapSea: Color
    public let prefecturePickerMapLandLine: Color
    public let prefecturePickerMapOutline: Color
    public let prefecturePickerMapOutlineHover: Color
    public let prefecturePickerMapLandLineWidth: CGFloat
    public let prefecturePickerMapFillDilate: CGFloat
    public let prefecturePickerMapOutlineWidth: CGFloat
    public let prefecturePickerMapOutlineHoverWidth: CGFloat
    public let prefecturePickerMapZoomDuration: Double
    public let prefecturePickerOptionBg: Color
    public let prefecturePickerOptionBgHover: Color
    public let prefecturePickerOptionBgSelected: Color
    public let prefecturePickerOptionTextSelected: Color

    public static let light = YNTokens(
        colorNeutral0: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
        colorNeutral50: Color(.sRGB, red: 0.975, green: 0.981, blue: 0.988, opacity: 1),
        colorNeutral100: Color(.sRGB, red: 0.945, green: 0.956, blue: 0.967, opacity: 1),
        colorNeutral200: Color(.sRGB, red: 0.887, green: 0.905, blue: 0.923, opacity: 1),
        colorNeutral300: Color(.sRGB, red: 0.803, green: 0.829, blue: 0.856, opacity: 1),
        colorNeutral400: Color(.sRGB, red: 0.617, green: 0.649, blue: 0.684, opacity: 1),
        colorNeutral500: Color(.sRGB, red: 0.472, green: 0.507, blue: 0.545, opacity: 1),
        colorNeutral600: Color(.sRGB, red: 0.327, green: 0.36, blue: 0.395, opacity: 1),
        colorNeutral700: Color(.sRGB, red: 0.195, green: 0.222, blue: 0.251, opacity: 1),
        colorNeutral800: Color(.sRGB, red: 0.117, green: 0.139, blue: 0.163, opacity: 1),
        colorNeutral900: Color(.sRGB, red: 0.075, green: 0.093, blue: 0.112, opacity: 1),
        colorNeutral950: Color(.sRGB, red: 0.044, green: 0.058, blue: 0.073, opacity: 1),
        colorNeutral1000: Color(.sRGB, red: 0.022, green: 0.033, blue: 0.047, opacity: 1),
        colorAi100: Color(.sRGB, red: 0.878, green: 0.936, blue: 1, opacity: 1),
        colorAi400: Color(.sRGB, red: 0.32, green: 0.533, blue: 0.767, opacity: 1),
        colorAi500: Color(.sRGB, red: 0.166, green: 0.425, blue: 0.691, opacity: 1),
        colorAi600: Color(.sRGB, red: 0.076, green: 0.326, blue: 0.566, opacity: 1),
        colorAi700: Color(.sRGB, red: 0.053, green: 0.256, blue: 0.451, opacity: 1),
        colorShu100: Color(.sRGB, red: 1, green: 0.902, blue: 0.883, opacity: 1),
        colorShu500: Color(.sRGB, red: 0.686, green: 0.305, blue: 0.252, opacity: 1),
        colorShu600: Color(.sRGB, red: 0.585, green: 0.22, blue: 0.173, opacity: 1),
        colorMap1: Color(.sRGB, red: 0.284, green: 0.451, blue: 0.635, opacity: 1),
        colorMap2: Color(.sRGB, red: 0.478, green: 0.773, blue: 0.771, opacity: 1),
        colorMap3: Color(.sRGB, red: 0.351, green: 0.567, blue: 0.398, opacity: 1),
        colorMap4: Color(.sRGB, red: 0.749, green: 0.826, blue: 0.573, opacity: 1),
        colorMap5: Color(.sRGB, red: 0.662, green: 0.554, blue: 0.281, opacity: 1),
        colorMap6: Color(.sRGB, red: 0.903, green: 0.688, blue: 0.5, opacity: 1),
        colorMap7: Color(.sRGB, red: 0.682, green: 0.375, blue: 0.316, opacity: 1),
        colorMap8: Color(.sRGB, red: 0.81, green: 0.607, blue: 0.706, opacity: 1),
        colorMap9: Color(.sRGB, red: 0.453, green: 0.399, blue: 0.614, opacity: 1),
        colorMap10: Color(.sRGB, red: 0.386, green: 0.612, blue: 0.73, opacity: 1),
        colorMap11: Color(.sRGB, red: 0.679, green: 0.809, blue: 0.61, opacity: 1),
        colorBg: Color(.sRGB, red: 0.945, green: 0.956, blue: 0.967, opacity: 1),
        colorSurface: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
        colorSurface2: Color(.sRGB, red: 0.975, green: 0.981, blue: 0.988, opacity: 1),
        colorSunken: Color(.sRGB, red: 0.887, green: 0.905, blue: 0.923, opacity: 1),
        colorInk: Color(.sRGB, red: 0.022, green: 0.033, blue: 0.047, opacity: 1),
        colorInk2: Color(.sRGB, red: 0.327, green: 0.36, blue: 0.395, opacity: 1),
        colorInk3: Color(.sRGB, red: 0.472, green: 0.507, blue: 0.545, opacity: 1),
        colorLine: Color(.sRGB, red: 0.887, green: 0.905, blue: 0.923, opacity: 1),
        colorLine2: Color(.sRGB, red: 0.803, green: 0.829, blue: 0.856, opacity: 1),
        colorAccent: Color(.sRGB, red: 0.076, green: 0.326, blue: 0.566, opacity: 1),
        colorAccentHover: Color(.sRGB, red: 0.166, green: 0.425, blue: 0.691, opacity: 1),
        colorAccentWash: Color(.sRGB, red: 0.878, green: 0.936, blue: 1, opacity: 1),
        colorOnAccent: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
        colorDanger: Color(.sRGB, red: 0.585, green: 0.22, blue: 0.173, opacity: 1),
        colorDangerWash: Color(.sRGB, red: 1, green: 0.902, blue: 0.883, opacity: 1),
        colorSea: Color(.sRGB, red: 0.887, green: 0.905, blue: 0.923, opacity: 1),
        colorLandLine: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
        colorArea1: Color(.sRGB, red: 0.284, green: 0.451, blue: 0.635, opacity: 1),
        colorArea2: Color(.sRGB, red: 0.478, green: 0.773, blue: 0.771, opacity: 1),
        colorArea3: Color(.sRGB, red: 0.351, green: 0.567, blue: 0.398, opacity: 1),
        colorArea4: Color(.sRGB, red: 0.749, green: 0.826, blue: 0.573, opacity: 1),
        colorArea5: Color(.sRGB, red: 0.662, green: 0.554, blue: 0.281, opacity: 1),
        colorArea6: Color(.sRGB, red: 0.903, green: 0.688, blue: 0.5, opacity: 1),
        colorArea7: Color(.sRGB, red: 0.682, green: 0.375, blue: 0.316, opacity: 1),
        colorArea8: Color(.sRGB, red: 0.81, green: 0.607, blue: 0.706, opacity: 1),
        colorArea9: Color(.sRGB, red: 0.453, green: 0.399, blue: 0.614, opacity: 1),
        colorArea10: Color(.sRGB, red: 0.386, green: 0.612, blue: 0.73, opacity: 1),
        colorArea11: Color(.sRGB, red: 0.679, green: 0.809, blue: 0.61, opacity: 1),
        space0: NaN,
        space1: NaN,
        space2: NaN,
        space3: NaN,
        space4: NaN,
        space5: NaN,
        space6: NaN,
        space8: NaN,
        space10: NaN,
        space12: NaN,
        radiusSm: NaN,
        radiusMd: NaN,
        radiusLg: NaN,
        radiusXl: NaN,
        radiusFull: NaN,
        radiusControl: NaN,
        radiusPanel: NaN,
        radiusSheet: NaN,
        radiusPill: NaN,
        strokeHair: NaN,
        strokeThin: NaN,
        strokeMedium: NaN,
        strokeThick: NaN,
        sizeField: NaN,
        sizeTouch: NaN,
        sizePopMin: NaN,
        sizePopMax: NaN,
        sizeControlHeight: NaN,
        sizeControlTouch: NaN,
        sizePanelMin: NaN,
        sizePanelMax: NaN,
        durationPop: 0.17,
        durationSheet: 0.3,
        durationZoom: 0.52,
        lineHair: NaN,
        lineDilate: NaN,
        lineEmphasis: NaN,
        lineStrong: NaN,
        motionQuick: 0.17,
        motionSheet: 0.3,
        motionZoom: 0.52,
        prefecturePickerTriggerBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
        prefecturePickerTriggerBorder: Color(.sRGB, red: 0.803, green: 0.829, blue: 0.856, opacity: 1),
        prefecturePickerTriggerBorderHover: Color(.sRGB, red: 0.076, green: 0.326, blue: 0.566, opacity: 1),
        prefecturePickerTriggerText: Color(.sRGB, red: 0.022, green: 0.033, blue: 0.047, opacity: 1),
        prefecturePickerTriggerPlaceholder: Color(.sRGB, red: 0.472, green: 0.507, blue: 0.545, opacity: 1),
        prefecturePickerTriggerHeight: NaN,
        prefecturePickerTriggerRadius: NaN,
        prefecturePickerPopoverBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
        prefecturePickerPopoverBorder: Color(.sRGB, red: 0.803, green: 0.829, blue: 0.856, opacity: 1),
        prefecturePickerPopoverRadius: NaN,
        prefecturePickerPopoverMinWidth: NaN,
        prefecturePickerPopoverMaxWidth: NaN,
        prefecturePickerPopoverDuration: 0.17,
        prefecturePickerSheetRadius: NaN,
        prefecturePickerSheetMinTarget: NaN,
        prefecturePickerSheetDuration: 0.3,
        prefecturePickerMapSea: Color(.sRGB, red: 0.887, green: 0.905, blue: 0.923, opacity: 1),
        prefecturePickerMapLandLine: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
        prefecturePickerMapOutline: Color(.sRGB, red: 0.022, green: 0.033, blue: 0.047, opacity: 1),
        prefecturePickerMapOutlineHover: Color(.sRGB, red: 0.327, green: 0.36, blue: 0.395, opacity: 1),
        prefecturePickerMapLandLineWidth: NaN,
        prefecturePickerMapFillDilate: NaN,
        prefecturePickerMapOutlineWidth: NaN,
        prefecturePickerMapOutlineHoverWidth: NaN,
        prefecturePickerMapZoomDuration: 0.52,
        prefecturePickerOptionBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
        prefecturePickerOptionBgHover: Color(.sRGB, red: 0.887, green: 0.905, blue: 0.923, opacity: 1),
        prefecturePickerOptionBgSelected: Color(.sRGB, red: 0.076, green: 0.326, blue: 0.566, opacity: 1),
        prefecturePickerOptionTextSelected: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1)
    )

    public static let dark = YNTokens(
        colorNeutral0: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
        colorNeutral50: Color(.sRGB, red: 0.975, green: 0.981, blue: 0.988, opacity: 1),
        colorNeutral100: Color(.sRGB, red: 0.945, green: 0.956, blue: 0.967, opacity: 1),
        colorNeutral200: Color(.sRGB, red: 0.887, green: 0.905, blue: 0.923, opacity: 1),
        colorNeutral300: Color(.sRGB, red: 0.803, green: 0.829, blue: 0.856, opacity: 1),
        colorNeutral400: Color(.sRGB, red: 0.617, green: 0.649, blue: 0.684, opacity: 1),
        colorNeutral500: Color(.sRGB, red: 0.472, green: 0.507, blue: 0.545, opacity: 1),
        colorNeutral600: Color(.sRGB, red: 0.327, green: 0.36, blue: 0.395, opacity: 1),
        colorNeutral700: Color(.sRGB, red: 0.195, green: 0.222, blue: 0.251, opacity: 1),
        colorNeutral800: Color(.sRGB, red: 0.117, green: 0.139, blue: 0.163, opacity: 1),
        colorNeutral900: Color(.sRGB, red: 0.075, green: 0.093, blue: 0.112, opacity: 1),
        colorNeutral950: Color(.sRGB, red: 0.044, green: 0.058, blue: 0.073, opacity: 1),
        colorNeutral1000: Color(.sRGB, red: 0.022, green: 0.033, blue: 0.047, opacity: 1),
        colorAi100: Color(.sRGB, red: 0.878, green: 0.936, blue: 1, opacity: 1),
        colorAi400: Color(.sRGB, red: 0.32, green: 0.533, blue: 0.767, opacity: 1),
        colorAi500: Color(.sRGB, red: 0.166, green: 0.425, blue: 0.691, opacity: 1),
        colorAi600: Color(.sRGB, red: 0.076, green: 0.326, blue: 0.566, opacity: 1),
        colorAi700: Color(.sRGB, red: 0.053, green: 0.256, blue: 0.451, opacity: 1),
        colorShu100: Color(.sRGB, red: 1, green: 0.902, blue: 0.883, opacity: 1),
        colorShu500: Color(.sRGB, red: 0.686, green: 0.305, blue: 0.252, opacity: 1),
        colorShu600: Color(.sRGB, red: 0.585, green: 0.22, blue: 0.173, opacity: 1),
        colorMap1: Color(.sRGB, red: 0.284, green: 0.451, blue: 0.635, opacity: 1),
        colorMap2: Color(.sRGB, red: 0.478, green: 0.773, blue: 0.771, opacity: 1),
        colorMap3: Color(.sRGB, red: 0.351, green: 0.567, blue: 0.398, opacity: 1),
        colorMap4: Color(.sRGB, red: 0.749, green: 0.826, blue: 0.573, opacity: 1),
        colorMap5: Color(.sRGB, red: 0.662, green: 0.554, blue: 0.281, opacity: 1),
        colorMap6: Color(.sRGB, red: 0.903, green: 0.688, blue: 0.5, opacity: 1),
        colorMap7: Color(.sRGB, red: 0.682, green: 0.375, blue: 0.316, opacity: 1),
        colorMap8: Color(.sRGB, red: 0.81, green: 0.607, blue: 0.706, opacity: 1),
        colorMap9: Color(.sRGB, red: 0.453, green: 0.399, blue: 0.614, opacity: 1),
        colorMap10: Color(.sRGB, red: 0.386, green: 0.612, blue: 0.73, opacity: 1),
        colorMap11: Color(.sRGB, red: 0.679, green: 0.809, blue: 0.61, opacity: 1),
        colorBg: Color(.sRGB, red: 0.022, green: 0.033, blue: 0.047, opacity: 1),
        colorSurface: Color(.sRGB, red: 0.075, green: 0.093, blue: 0.112, opacity: 1),
        colorSurface2: Color(.sRGB, red: 0.117, green: 0.139, blue: 0.163, opacity: 1),
        colorSunken: Color(.sRGB, red: 0.044, green: 0.058, blue: 0.073, opacity: 1),
        colorInk: Color(.sRGB, red: 0.975, green: 0.981, blue: 0.988, opacity: 1),
        colorInk2: Color(.sRGB, red: 0.617, green: 0.649, blue: 0.684, opacity: 1),
        colorInk3: Color(.sRGB, red: 0.472, green: 0.507, blue: 0.545, opacity: 1),
        colorLine: Color(.sRGB, red: 0.117, green: 0.139, blue: 0.163, opacity: 1),
        colorLine2: Color(.sRGB, red: 0.195, green: 0.222, blue: 0.251, opacity: 1),
        colorAccent: Color(.sRGB, red: 0.32, green: 0.533, blue: 0.767, opacity: 1),
        colorAccentHover: Color(.sRGB, red: 0.32, green: 0.533, blue: 0.767, opacity: 1),
        colorAccentWash: Color(.sRGB, red: 0.117, green: 0.139, blue: 0.163, opacity: 1),
        colorOnAccent: Color(.sRGB, red: 0.022, green: 0.033, blue: 0.047, opacity: 1),
        colorDanger: Color(.sRGB, red: 0.686, green: 0.305, blue: 0.252, opacity: 1),
        colorDangerWash: Color(.sRGB, red: 0.117, green: 0.139, blue: 0.163, opacity: 1),
        colorSea: Color(.sRGB, red: 0.044, green: 0.058, blue: 0.073, opacity: 1),
        colorLandLine: Color(.sRGB, red: 0.022, green: 0.033, blue: 0.047, opacity: 1),
        colorArea1: Color(.sRGB, red: 0.386, green: 0.557, blue: 0.748, opacity: 1),
        colorArea2: Color(.sRGB, red: 0.565, green: 0.863, blue: 0.86, opacity: 1),
        colorArea3: Color(.sRGB, red: 0.457, green: 0.677, blue: 0.501, opacity: 1),
        colorArea4: Color(.sRGB, red: 0.812, green: 0.89, blue: 0.634, opacity: 1),
        colorArea5: Color(.sRGB, red: 0.774, green: 0.663, blue: 0.39, opacity: 1),
        colorArea6: Color(.sRGB, red: 0.983, green: 0.763, blue: 0.573, opacity: 1),
        colorArea7: Color(.sRGB, red: 0.799, green: 0.481, blue: 0.418, opacity: 1),
        colorArea8: Color(.sRGB, red: 0.888, green: 0.68, blue: 0.781, opacity: 1),
        colorArea9: Color(.sRGB, red: 0.569, green: 0.515, blue: 0.738, opacity: 1),
        colorArea10: Color(.sRGB, red: 0.482, green: 0.711, blue: 0.831, opacity: 1),
        colorArea11: Color(.sRGB, red: 0.753, green: 0.886, blue: 0.684, opacity: 1),
        space0: NaN,
        space1: NaN,
        space2: NaN,
        space3: NaN,
        space4: NaN,
        space5: NaN,
        space6: NaN,
        space8: NaN,
        space10: NaN,
        space12: NaN,
        radiusSm: NaN,
        radiusMd: NaN,
        radiusLg: NaN,
        radiusXl: NaN,
        radiusFull: NaN,
        radiusControl: NaN,
        radiusPanel: NaN,
        radiusSheet: NaN,
        radiusPill: NaN,
        strokeHair: NaN,
        strokeThin: NaN,
        strokeMedium: NaN,
        strokeThick: NaN,
        sizeField: NaN,
        sizeTouch: NaN,
        sizePopMin: NaN,
        sizePopMax: NaN,
        sizeControlHeight: NaN,
        sizeControlTouch: NaN,
        sizePanelMin: NaN,
        sizePanelMax: NaN,
        durationPop: 0.17,
        durationSheet: 0.3,
        durationZoom: 0.52,
        lineHair: NaN,
        lineDilate: NaN,
        lineEmphasis: NaN,
        lineStrong: NaN,
        motionQuick: 0.17,
        motionSheet: 0.3,
        motionZoom: 0.52,
        prefecturePickerTriggerBg: Color(.sRGB, red: 0.075, green: 0.093, blue: 0.112, opacity: 1),
        prefecturePickerTriggerBorder: Color(.sRGB, red: 0.195, green: 0.222, blue: 0.251, opacity: 1),
        prefecturePickerTriggerBorderHover: Color(.sRGB, red: 0.32, green: 0.533, blue: 0.767, opacity: 1),
        prefecturePickerTriggerText: Color(.sRGB, red: 0.975, green: 0.981, blue: 0.988, opacity: 1),
        prefecturePickerTriggerPlaceholder: Color(.sRGB, red: 0.472, green: 0.507, blue: 0.545, opacity: 1),
        prefecturePickerTriggerHeight: NaN,
        prefecturePickerTriggerRadius: NaN,
        prefecturePickerPopoverBg: Color(.sRGB, red: 0.075, green: 0.093, blue: 0.112, opacity: 1),
        prefecturePickerPopoverBorder: Color(.sRGB, red: 0.195, green: 0.222, blue: 0.251, opacity: 1),
        prefecturePickerPopoverRadius: NaN,
        prefecturePickerPopoverMinWidth: NaN,
        prefecturePickerPopoverMaxWidth: NaN,
        prefecturePickerPopoverDuration: 0.17,
        prefecturePickerSheetRadius: NaN,
        prefecturePickerSheetMinTarget: NaN,
        prefecturePickerSheetDuration: 0.3,
        prefecturePickerMapSea: Color(.sRGB, red: 0.044, green: 0.058, blue: 0.073, opacity: 1),
        prefecturePickerMapLandLine: Color(.sRGB, red: 0.022, green: 0.033, blue: 0.047, opacity: 1),
        prefecturePickerMapOutline: Color(.sRGB, red: 0.975, green: 0.981, blue: 0.988, opacity: 1),
        prefecturePickerMapOutlineHover: Color(.sRGB, red: 0.617, green: 0.649, blue: 0.684, opacity: 1),
        prefecturePickerMapLandLineWidth: NaN,
        prefecturePickerMapFillDilate: NaN,
        prefecturePickerMapOutlineWidth: NaN,
        prefecturePickerMapOutlineHoverWidth: NaN,
        prefecturePickerMapZoomDuration: 0.52,
        prefecturePickerOptionBg: Color(.sRGB, red: 0.075, green: 0.093, blue: 0.112, opacity: 1),
        prefecturePickerOptionBgHover: Color(.sRGB, red: 0.044, green: 0.058, blue: 0.073, opacity: 1),
        prefecturePickerOptionBgSelected: Color(.sRGB, red: 0.32, green: 0.533, blue: 0.767, opacity: 1),
        prefecturePickerOptionTextSelected: Color(.sRGB, red: 0.022, green: 0.033, blue: 0.047, opacity: 1)
    )

    public static func of(_ scheme: ColorScheme) -> YNTokens { scheme == .dark ? .dark : .light }
}
