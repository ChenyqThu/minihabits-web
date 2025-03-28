/**
 * Enum for habit colors
 */
export enum HabitColor {
  RED = "#e57373",
  BLUE = "#64b5f6",
  GREEN = "#81c784",
  YELLOW = "#ffd54f",
  PURPLE = "#ba68c8",
  ORANGE = "#ffb74d",
  PINK = "#f06292",
  TEAL = "#4db6ac",
}

/**
 * CalHeatmap color schemes from d3-scale-chromatic
 */
export enum ColorScheme {
  // Sequential (Single-Hue)
  BLUES = "Blues",
  GREENS = "Greens",
  GREYS = "Greys",
  ORANGES = "Oranges",
  PURPLES = "Purples",
  REDS = "Reds",
  
  // Sequential (Multi-Hue)
  BUGN = "BuGn",
  BUPU = "BuPu",
  GNBU = "GnBu",
  ORRD = "OrRd",
  PUBU = "PuBu",
  PUBUGN = "PuBuGn",
  PURD = "PuRd",
  RDPU = "RdPu",
  YLGNBU = "YlGnBu",
  YLGN = "YlGn",
  YLORBR = "YlOrBr",
  YLORRD = "YlOrRd",
  CIVIDIS = "Cividis",
  VIRIDIS = "Viridis",
  INFERNO = "Inferno",
  MAGMA = "Magma",
  PLASMA = "Plasma",
  WARM = "Warm",
  COOL = "Cool",
  CUBEHELIXDEFAULT = "Cubehelix",
  TURBO = "Turbo",
  
  // Diverging
  BRBG = "BrBG",
  PRGN = "PRGn",
  PIYG = "PiYG",
  PUOR = "PuOr",
  RDBU = "RdBu",
  RDGY = "RdGy",
  RDYLBU = "RdYlBu",
  RDYLGN = "RdYlGn",
  SPECTRAL = "Spectral",
  
  // Cyclical
  RAINBOW = "Rainbow",
  SINEBOW = "Sinebow"
}

/**
 * 表示颜色选择类型
 */
export interface ColorOption {
  type: 'singleColor' | 'scheme';
  value: HabitColor | ColorScheme;
}

/**
 * Enum for habit types
 */
export enum HabitType {
  BOOLEAN = "boolean",
  COUNTER = "counter",
}

import { Habit } from "@/api/generated";

/**
 * Extended Habit type with additional properties used in the frontend
 */
export interface ExtendedHabit extends Habit {
  completionRate7Days?: number;
  completionRateMonth?: number;
  completionRateYear?: number;
  colorScheme?: ColorScheme;
  metric?: string;
  weekStart?: "Monday" | "Sunday";
}

/**
 * Color range for each habit color for cal-heatmap in @StatsPage.tsx
 */
export const getColorRange = {
  [HabitColor.RED]: [
    "rgba(229, 115, 115, 0.25)",
    "rgba(229, 115, 115, 0.5)",
    "rgba(229, 115, 115, 0.75)",
    "rgba(229, 115, 115, 1)",
  ],
  [HabitColor.BLUE]: [
    "rgba(100, 181, 246, 0.25)",
    "rgba(100, 181, 246, 0.5)",
    "rgba(100, 181, 246, 0.75)",
    "rgba(100, 181, 246, 1)",
  ],
  [HabitColor.GREEN]: [
    "rgba(129, 199, 132, 0.25)",
    "rgba(129, 199, 132, 0.5)",
    "rgba(129, 199, 132, 0.75)",
    "rgba(129, 199, 132, 1)",
  ],
  [HabitColor.YELLOW]: [
    "rgba(255, 213, 79, 0.25)",
    "rgba(255, 213, 79, 0.5)",
    "rgba(255, 213, 79, 0.75)",
    "rgba(255, 213, 79, 1)",
  ],
  [HabitColor.PURPLE]: [
    "rgba(186, 104, 200, 0.25)",
    "rgba(186, 104, 200, 0.5)",
    "rgba(186, 104, 200, 0.75)",
    "rgba(186, 104, 200, 1)",
  ],
  [HabitColor.ORANGE]: [
    "rgba(255, 183, 77, 0.25)",
    "rgba(255, 183, 77, 0.5)",
    "rgba(255, 183, 77, 0.75)",
    "rgba(255, 183, 77, 1)",
  ],
  [HabitColor.PINK]: [
    "rgba(240, 98, 146, 0.25)",
    "rgba(240, 98, 146, 0.5)",
    "rgba(240, 98, 146, 0.75)",
    "rgba(240, 98, 146, 1)",
  ],
  [HabitColor.TEAL]: [
    "rgba(77, 182, 172, 0.25)",
    "rgba(77, 182, 172, 0.5)",
    "rgba(77, 182, 172, 0.75)",
    "rgba(77, 182, 172, 1)",
  ],
};

/**
 * 获取颜色方案预览的渐变样式
 */
export const getSchemeGradient = (scheme: ColorScheme): string => {
  switch (scheme) {
    // 单色系列
    case ColorScheme.BLUES:
      return 'linear-gradient(to right, #f7fbff, #deebf7, #c6dbef, #9ecae1, #6baed6, #4292c6, #2171b5, #084594)';
    case ColorScheme.GREENS:
      return 'linear-gradient(to right, #f7fcf5, #e5f5e0, #c7e9c0, #a1d99b, #74c476, #41ab5d, #238b45, #005a32)';
    case ColorScheme.GREYS:
      return 'linear-gradient(to right, #ffffff, #f0f0f0, #d9d9d9, #bdbdbd, #969696, #737373, #525252, #252525)';
    case ColorScheme.ORANGES:
      return 'linear-gradient(to right, #fff5eb, #fee6ce, #fdd0a2, #fdae6b, #fd8d3c, #f16913, #d94801, #8c2d04)';
    case ColorScheme.PURPLES:
      return 'linear-gradient(to right, #fcfbfd, #efedf5, #dadaeb, #bcbddc, #9e9ac8, #807dba, #6a51a3, #4a1486)';
    case ColorScheme.REDS:
      return 'linear-gradient(to right, #fff5f0, #fee0d2, #fcbba1, #fc9272, #fb6a4a, #ef3b2c, #cb181d, #99000d)';
    
    // 多色系列
    case ColorScheme.BUGN:
      return 'linear-gradient(to right, #f7fcfd, #e5f5f9, #ccece6, #99d8c9, #66c2a4, #41ae76, #238b45, #005824)';
    case ColorScheme.BUPU:
      return 'linear-gradient(to right, #f7fcfd, #e0ecf4, #bfd3e6, #9ebcda, #8c96c6, #8c6bb1, #88419d, #6e016b)';
    case ColorScheme.GNBU:
      return 'linear-gradient(to right, #f7fcf0, #e0f3db, #ccebc5, #a8ddb5, #7bccc4, #4eb3d3, #2b8cbe, #08589e)';
    case ColorScheme.ORRD:
      return 'linear-gradient(to right, #fff7ec, #fee8c8, #fdd49e, #fdbb84, #fc8d59, #ef6548, #d7301f, #990000)';
    case ColorScheme.PUBU:
      return 'linear-gradient(to right, #fff7fb, #ece7f2, #d0d1e6, #a6bddb, #74a9cf, #3690c0, #0570b0, #034e7b)';
    case ColorScheme.PUBUGN:
      return 'linear-gradient(to right, #fff7fb, #ece2f0, #d0d1e6, #a6bddb, #67a9cf, #3690c0, #02818a, #016c59)';
    case ColorScheme.PURD:
      return 'linear-gradient(to right, #f7f4f9, #e7e1ef, #d4b9da, #c994c7, #df65b0, #e7298a, #ce1256, #91003f)';
    case ColorScheme.RDPU:
      return 'linear-gradient(to right, #fff7f3, #fde0dd, #fcc5c0, #fa9fb5, #f768a1, #dd3497, #ae017e, #7a0177)';
    case ColorScheme.YLGNBU:
      return 'linear-gradient(to right, #ffffd9, #edf8b1, #c7e9b4, #7fcdbb, #41b6c4, #1d91c0, #225ea8, #0c2c84)';
    case ColorScheme.YLGN:
      return 'linear-gradient(to right, #ffffe5, #f7fcb9, #d9f0a3, #addd8e, #78c679, #41ab5d, #238443, #005a32)';
    case ColorScheme.YLORBR:
      return 'linear-gradient(to right, #ffffe5, #fff7bc, #fee391, #fec44f, #fe9929, #ec7014, #cc4c02, #8c2d04)';
    case ColorScheme.YLORRD:
      return 'linear-gradient(to right, #ffffcc, #ffeda0, #fed976, #feb24c, #fd8d3c, #fc4e2a, #e31a1c, #b10026)';
    
    // 发散系列
    case ColorScheme.BRBG:
      return 'linear-gradient(to right, #543005, #8c510a, #bf812d, #dfc27d, #f6e8c3, #f5f5f5, #c7eae5, #80cdc1, #35978f, #01665e, #003c30)';
    case ColorScheme.PRGN:
      return 'linear-gradient(to right, #40004b, #762a83, #9970ab, #c2a5cf, #e7d4e8, #f7f7f7, #d9f0d3, #a6dba0, #5aae61, #1b7837, #00441b)';
    case ColorScheme.PIYG:
      return 'linear-gradient(to right, #8e0152, #c51b7d, #de77ae, #f1b6da, #fde0ef, #f7f7f7, #e6f5d0, #b8e186, #7fbc41, #4d9221, #276419)';
    case ColorScheme.PUOR:
      return 'linear-gradient(to right, #7f3b08, #b35806, #e08214, #fdb863, #fee0b6, #f7f7f7, #d8daeb, #b2abd2, #8073ac, #542788, #2d004b)';
    case ColorScheme.RDBU:
      return 'linear-gradient(to right, #67001f, #b2182b, #d6604d, #f4a582, #fddbc7, #f7f7f7, #d1e5f0, #92c5de, #4393c3, #2166ac, #053061)';
    case ColorScheme.RDGY:
      return 'linear-gradient(to right, #67001f, #b2182b, #d6604d, #f4a582, #fddbc7, #ffffff, #e0e0e0, #bababa, #878787, #4d4d4d, #1a1a1a)';
    case ColorScheme.RDYLBU:
      return 'linear-gradient(to right, #a50026, #d73027, #f46d43, #fdae61, #fee090, #ffffbf, #e0f3f8, #abd9e9, #74add1, #4575b4, #313695)';
    case ColorScheme.RDYLGN:
      return 'linear-gradient(to right, #a50026, #d73027, #f46d43, #fdae61, #fee08b, #ffffbf, #d9ef8b, #a6d96a, #66bd63, #1a9850, #006837)';
    case ColorScheme.SPECTRAL:
      return 'linear-gradient(to right, #9e0142, #d53e4f, #f46d43, #fdae61, #fee08b, #ffffbf, #e6f598, #abdda4, #66c2a5, #3288bd, #5e4fa2)';
      
    // 循环系列
    case ColorScheme.RAINBOW:
      return 'linear-gradient(to right, #6e40aa, #be3caf, #fe4b83, #ff7847, #e2b72f, #aff05b, #52f667, #1ddfa3, #23abd8, #4c6edb, #6e40aa)';
    case ColorScheme.SINEBOW:
      return 'linear-gradient(to right, #ff4040, #ff4820, #ff6c00, #ffa000, #ffd200, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080, #ff4040)';
      
    // 特殊系列
    case ColorScheme.CIVIDIS:
      return 'linear-gradient(to right, #00204c, #00306f, #39486b, #585271, #716c7a, #8a8682, #a5a186, #bebe7a)';
    case ColorScheme.VIRIDIS:
      return 'linear-gradient(to right, #440154, #482878, #3e4989, #31688e, #26828e, #1f9e89, #35b779, #6ece58, #b5de2b, #fde725)';
    case ColorScheme.INFERNO:
      return 'linear-gradient(to right, #000004, #160b39, #420a68, #6a176e, #932667, #bc3754, #dd513a, #f37819, #fca50a, #f6d746)';
    case ColorScheme.MAGMA:
      return 'linear-gradient(to right, #000004, #140e36, #3b0f70, #641a80, #8c2981, #b5367a, #de4968, #f66e5c, #fe9f6d, #fecf92)';
    case ColorScheme.PLASMA:
      return 'linear-gradient(to right, #0d0887, #41049d, #6a00a8, #8f0da4, #b12a90, #cc4778, #e16462, #f2844b, #fca636, #f0f921)';
    case ColorScheme.WARM:
      return 'linear-gradient(to right, #6e40aa, #963db3, #bf3caf, #e4419d, #fe4b83, #ff5e63, #ff7847, #fb9633, #e2b72f, #c6d63c)';
    case ColorScheme.COOL:
      return 'linear-gradient(to right, #6e40aa, #6054c8, #4c6edb, #368ce1, #23abd8, #1ac7c2, #1ddfa3, #52f667, #90fd5a, #d8f239)';
    case ColorScheme.CUBEHELIXDEFAULT:
      return 'linear-gradient(to right, #000000, #182a8e, #2a518a, #416780, #5c7e79, #769c77, #91b77a, #acca8a, #c7d5a9, #e1dfcf, #f7f7f7)';
    case ColorScheme.TURBO:
      return 'linear-gradient(to right, #23171b, #4a0c6b, #781c6d, #a52c60, #cf4446, #ed6925, #fb9b06, #f2cb3c, #d9f9a3, #85fccb, #30123b)';
    
    default:
      return 'linear-gradient(to right, #ffffff, #000000)';
  }
};
