import type { ValueOf } from "./helpers";

// Data shape types
export interface FontExtents {
  ascender: number;
  descender: number;
  lineGap: number;
}

export interface GlyphExtents {
  xBearing: number;
  yBearing: number;
  width: number;
  height: number;
}

export interface GlyphInfo {
  /** Either a Unicode code point (before shaping) or a glyph index (after shaping). */
  codepoint: number;
  /** The cluster index of the glyph. */
  cluster: number;
  /** Glyph flags, a combination of {@link GlyphFlag} values. */
  flags: number;
}

export interface GlyphPosition {
  /** The x advance of the glyph. */
  xAdvance: number;
  /** The y advance of the glyph. */
  yAdvance: number;
  /** The x offset of the glyph. */
  xOffset: number;
  /** The y offset of the glyph. */
  yOffset: number;
}

export interface SvgPathCommand {
  type: string;
  values: number[];
}

/** A color value, eight bits per channel RGB plus alpha transparency. */
export interface Color {
  /** Red channel value. */
  red: number;
  /** Green channel value. */
  green: number;
  /** Blue channel value. */
  blue: number;
  /** Alpha channel value. */
  alpha: number;
}

/**
 * Information about a color stop on a {@link ColorLine}.
 *
 * Color lines typically have offsets ranging between 0 and 1, but that is not
 * required.
 *
 * The `isForeground` and `color` fields have the same semantics as in
 * {@link PaintFuncs.setColorFunc}.
 *
 * Note: despite `color` being unpremultiplied here, interpolation in gradients
 * shall happen in premultiplied space. See the OpenType spec
 * [COLR](https://learn.microsoft.com/en-us/typography/opentype/spec/colr)
 * section for details.
 */
export interface ColorStop {
  /** The offset of the color stop. */
  offset: number;
  /** Whether the color is the foreground. */
  isForeground: boolean;
  /** The color, unpremultiplied. */
  color: Color;
}

/** Color information for a gradient. */
export interface ColorLine {
  /** The extend mode of the color line. */
  extend: PaintExtend;
  /**
   * The color stops.
   *
   * Note that due to variations being applied, the color stops may be out of
   * order; it is the caller's responsibility to ensure they are sorted by their
   * offset before they are used.
   */
  colorStops: ColorStop[];
}

/** Flags that describe the properties of a color palette. */
export const ColorPaletteFlags = {
  /**
   * Default indicating that there is nothing special to note about a color
   * palette.
   */
  DEFAULT: 0x00000000,
  /**
   * Flag indicating that the color palette is appropriate to use when displaying
   * the font on a light background such as white.
   */
  USABLE_WITH_LIGHT_BACKGROUND: 0x00000001,
  /**
   * Flag indicating that the color palette is appropriate to use when displaying
   * the font on a dark background such as black.
   */
  USABLE_WITH_DARK_BACKGROUND: 0x00000002,
} as const;
export type ColorPaletteFlags = ValueOf<typeof ColorPaletteFlags>;

/** A {@link Color} from a font's color palette, together with its name ID. */
export interface PaletteColor extends Color {
  /**
   * The `name` table Name ID that provides display names for the color, or
   * `undefined` if the color has no name.
   *
   * Display names can be generic (e.g., "Background") or specific (e.g., "Eye
   * color").
   */
  nameId?: number;
}

/** A color palette from a font's `CPAL` table. */
export interface ColorPalette {
  /**
   * The colors that make up the palette. The RGBA values are unpremultiplied;
   * see the OpenType spec
   * [CPAL](https://learn.microsoft.com/en-us/typography/opentype/spec/cpal)
   * section for details.
   */
  colors: PaletteColor[];
  /**
   * The `name` table Name ID that provides display names for the palette, or
   * `undefined` if the palette has no name.
   *
   * Palette display names can be generic (e.g., "Default") or provide specific,
   * themed names (e.g., "Spring", "Summer", "Fall", and "Winter").
   */
  nameId?: number;
  /**
   * The flags defined for the palette, a combination of
   * {@link ColorPaletteFlags} values.
   */
  flags: number;
}

/**
 * The values of this enumeration determine how color values outside the minimum
 * and maximum defined offset on a {@link ColorLine} are determined.
 *
 * See the OpenType spec
 * [COLR](https://learn.microsoft.com/en-us/typography/opentype/spec/colr) section
 * for details.
 */
export const PaintExtend = {
  /** Outside the defined interval, the color of the closest color stop is used. */
  PAD: 0,
  /** The color line is repeated over repeated multiples of the defined interval */
  REPEAT: 1,
  /**
   * The color line is repeated over repeated intervals, as for the repeat mode.
   * However, in each repeated interval, the ordering of color stops is the
   * reverse of the adjacent interval.
   */
  REFLECT: 2,
} as const;
export type PaintExtend = ValueOf<typeof PaintExtend>;

/**
 * The values of this enumeration describe the compositing modes that can be used
 * when combining temporary redirected drawing with the backdrop.
 *
 * See the OpenType spec
 * [COLR](https://learn.microsoft.com/en-us/typography/opentype/spec/colr) section
 * for details.
 */
export const PaintCompositeMode = {
  /** clear destination layer (bounded) */
  CLEAR: 0,
  /** replace destination layer (bounded) */
  SRC: 1,
  /** ignore the source */
  DEST: 2,
  /** draw source layer on top of destination layer (bounded) */
  SRC_OVER: 3,
  /** draw destination on top of source */
  DEST_OVER: 4,
  /** draw source where there was destination content (unbounded) */
  SRC_IN: 5,
  /** leave destination only where there was source content (unbounded) */
  DEST_IN: 6,
  /** draw source where there was no destination content (unbounded) */
  SRC_OUT: 7,
  /** leave destination only where there was no source content */
  DEST_OUT: 8,
  /** draw source on top of destination content and only there */
  SRC_ATOP: 9,
  /** leave destination on top of source content and only there (unbounded) */
  DEST_ATOP: 10,
  /** source and destination are shown where there is only one of them */
  XOR: 11,
  /** source and destination layers are accumulated */
  PLUS: 12,
  /**
   * source and destination are complemented and multiplied. This causes the
   * result to be at least as light as the lighter inputs.
   */
  SCREEN: 13,
  /** multiplies or screens, depending on the lightness of the destination color. */
  OVERLAY: 14,
  /**
   * replaces the destination with the source if it is darker, otherwise keeps the
   * source.
   */
  DARKEN: 15,
  /**
   * replaces the destination with the source if it is lighter, otherwise keeps the
   * source.
   */
  LIGHTEN: 16,
  /** brightens the destination color to reflect the source color. */
  COLOR_DODGE: 17,
  /** darkens the destination color to reflect the source color. */
  COLOR_BURN: 18,
  /** Multiplies or screens, dependent on source color. */
  HARD_LIGHT: 19,
  /** Darkens or lightens, dependent on source color. */
  SOFT_LIGHT: 20,
  /** Takes the difference of the source and destination color. */
  DIFFERENCE: 21,
  /** Produces an effect similar to difference, but with lower contrast. */
  EXCLUSION: 22,
  /**
   * source and destination layers are multiplied. This causes the result to be at
   * least as dark as the darker inputs.
   */
  MULTIPLY: 23,
  /**
   * Creates a color with the hue of the source and the saturation and luminosity
   * of the target.
   */
  HSL_HUE: 24,
  /**
   * Creates a color with the saturation of the source and the hue and luminosity
   * of the target. Painting with this mode onto a gray area produces no change.
   */
  HSL_SATURATION: 25,
  /**
   * Creates a color with the hue and saturation of the source and the luminosity
   * of the target. This preserves the gray levels of the target and is useful for
   * coloring monochrome images or tinting color images.
   */
  HSL_COLOR: 26,
  /**
   * Creates a color with the luminosity of the source and the hue and saturation
   * of the target. This produces an inverse effect to
   * {@link PaintCompositeMode.HSL_COLOR}.
   */
  HSL_LUMINOSITY: 27,
} as const;
export type PaintCompositeMode = ValueOf<typeof PaintCompositeMode>;

export interface AxisInfo {
  min: number;
  default: number;
  max: number;
}

export interface NameEntry {
  nameId: number;
  language: string;
}

export interface FeatureNameIds {
  uiLabelNameId?: number;
  uiTooltipTextNameId?: number;
  sampleTextNameId?: number;
  paramUiLabelNameIds: number[];
}

export interface TraceEntry {
  m: string;
  t: unknown[];
  glyphs: boolean;
}

/** EmscriptenModule extended with MODULARIZE runtime methods. */
export interface HarfBuzzModule extends EmscriptenModule {
  wasmExports: Record<string, (...args: any[]) => any>;
  addFunction(func: (...args: any[]) => any, signature: string): number;
  removeFunction(funcPtr: number): void;
  stackSave(): number;
  stackAlloc(size: number): number;
  stackRestore(ptr: number): void;
}

export const GlyphFlag = {
  UNSAFE_TO_BREAK: 0x00000001,
  UNSAFE_TO_CONCAT: 0x00000002,
  SAFE_TO_INSERT_TATWEEL: 0x00000004,
  DEFINED: 0x00000007,
} as const;
export type GlyphFlag = ValueOf<typeof GlyphFlag>;
