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
