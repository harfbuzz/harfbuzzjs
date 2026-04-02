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
}

export interface GlyphPosition {
  /** The x advance of the glyph. */
  x_advance: number;
  /** The y advance of the glyph. */
  y_advance: number;
  /** The x offset of the glyph. */
  x_offset: number;
  /** The y offset of the glyph. */
  y_offset: number;
}

export interface JsonGlyph {
  /** The glyph ID. */
  g: number;
  /** The cluster ID. */
  cl: number;
  /** Advance width (width to advance after this glyph is painted). */
  ax: number;
  /** Advance height (height to advance after this glyph is painted). */
  ay: number;
  /** X displacement (adjustment in X dimension when painting this glyph). */
  dx: number;
  /** Y displacement (adjustment in Y dimension when painting this glyph). */
  dy: number;
  /** Glyph flags, a combination of {@link GlyphFlag} values. */
  fl: number;
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
  uiLabelNameId: number | null;
  uiTooltipTextNameId: number | null;
  sampleTextNameId: number | null;
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

export enum GlyphFlag {
  UNSAFE_TO_BREAK = 0x00000001,
  UNSAFE_TO_CONCAT = 0x00000002,
  SAFE_TO_INSERT_TATWEEL = 0x00000004,
  DEFINED = 0x00000007,
}
