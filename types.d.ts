export type HBModule = {
  wasmExports: WebAssembly.Exports;
  wasmMemory: WebAssembly.Memory;
  HEAP8: Int8Array;
  HEAP16: Int16Array;
  HEAP32: Int32Array;
  HEAPU8: Uint8Array;
  HEAPU16: Uint16Array;
  HEAPU32: Uint32Array;
  HEAPF32: Float32Array;
  HEAPF64: Float64Array;
  addFunction: (fn: Function, signature: string) => number;
  removeFunction: (ptr: number) => void;
  stackSave: () => number;
  stackRestore: (ptr: number) => void;
  stackAlloc: (size: number) => number;
};

export type HBBlob = {
  ptr: number;
  destroy: () => void;
};

export type AxisInfo = {
  min: number;
  default: number;
  max: number;
};

export type NameEntry = {
  nameId: number;
  language: string;
};

export type FeatureNameIds = {
  uiLabelNameId: number | null;
  uiTooltipTextNameId: number | null;
  sampleTextNameId: number | null;
  paramUiLabelNameIds: number[];
} | null;

export type HBFace = {
  ptr: number;
  upem: number;
  reference_table: (table: string) => Uint8Array | undefined;
  getAxisInfos: () => Record<string, AxisInfo>;
  collectUnicodes: () => Uint32Array;
  getTableScriptTags: (table: string) => string[];
  getTableFeatureTags: (table: string) => string[];
  getScriptLanguageTags: (table: string, scriptIndex: number) => string[];
  getLanguageFeatureTags: (table: string, scriptIndex: number, languageIndex: number) => string[];
  listNames: () => NameEntry[];
  getName: (nameId: number, language: string) => string;
  getFeatureNameIds: (table: string, featureIndex: number) => FeatureNameIds;
  destroy: () => void;
};

export type SvgPathCommand =
  | { type: "M"; values: number[] }
  | { type: "L"; values: number[] }
  | { type: "Q"; values: number[] }
  | { type: "C"; values: number[] }
  | { type: "Z"; values: number[] };

export type HBVariations = Record<string, number>;

export type FontExtents = {
  ascender: number;
  descender: number;
  lineGap: number;
};

export type GlyphExtents = {
  xBearing: number;
  yBearing: number;
  width: number;
  height: number;
};

export type HBFont = {
  ptr: number;
  subFont: () => HBFont;
  hExtents: () => FontExtents;
  vExtents: () => FontExtents;
  glyphName: (glyphId: number) => string;
  glyphToPath: (glyphId: number) => string;
  glyphToJson: (glyphId: number) => SvgPathCommand[];
  glyphHAdvance: (glyphId: number) => number;
  glyphVAdvance: (glyphId: number) => number;
  glyphHOrigin: (glyphId: number) => [number, number] | null;
  glyphVOrigin: (glyphId: number) => [number, number] | null;
  glyphExtents: (glyphId: number) => GlyphExtents | null;
  glyphFromName: (name: string) => number | null;
  setScale: (xScale: number, yScale: number) => void;
  setVariations: (variations: HBVariations) => void;
  setFuncs: (fontFuncs: HBFontFuncs) => void;
  destroy: () => void;
};

export type HBFontFuncs = {
  ptr: number;
  setGlyphExtentsFunc: (func: (font: HBFont, glyph: number) => GlyphExtents | null) => void;
  setGlyphFromNameFunc: (func: (font: HBFont, name: string) => number | null) => void;
  setGlyphHAdvanceFunc: (func: (font: HBFont, glyph: number) => number) => void;
  setGlyphVAdvanceFunc: (func: (font: HBFont, glyph: number) => number) => void;
  setGlyphHOriginFunc: (func: (font: HBFont, glyph: number) => [number, number] | null) => void;
  setGlyphVOriginFunc: (func: (font: HBFont, glyph: number) => [number, number] | null) => void;
  setGlyphHKerningFunc: (func: (font: HBFont, firstGlyph: number, secondGlyph: number) => number) => void;
  setGlyphNameFunc: (func: (font: HBFont, glyph: number) => string | null) => void;
  setNominalGlyphFunc: (func: (font: HBFont, unicode: number) => number | null) => void;
  setVariationGlyphFunc: (func: (font: HBFont, unicode: number, variationSelector: number) => number | null) => void;
  setFontHExtentsFunc: (func: (font: HBFont) => FontExtents | null) => void;
  setFontVExtentsFunc: (func: (font: HBFont) => FontExtents | null) => void;
  destroy: () => void;
};

export type HBFlag =
  | "DEFAULT"
  | "BOT"
  | "EOT"
  | "PRESERVE_DEFAULT_IGNORABLES"
  | "REMOVE_DEFAULT_IGNORABLES"
  | "DO_NOT_INSERT_DOTTED_CIRCLE"
  | "VERIFY"
  | "PRODUCE_UNSAFE_TO_CONCAT"
  | "PRODUCE_SAFE_TO_INSERT_TATWEEL";

export type HBSerializeFlag =
  | "DEFAULT"
  | "NO_CLUSTERS"
  | "NO_POSITIONS"
  | "NO_GLYPH_NAMES"
  | "GLYPH_EXTENTS"
  | "GLYPH_FLAGS"
  | "NO_ADVANCES";

export type HBDir = "ltr" | "rtl" | "ttb" | "btt";

export type HBContentType = "INVALID" | "UNICODE" | "GLYPHS";

export type GlyphInfo = {
  codepoint: number;
  cluster: number;
};

export type GlyphPosition = {
  x_advance: number;
  y_advance: number;
  x_offset: number;
  y_offset: number;
};

export type HBJson = {
  g: number;
  cl: number;
  ax: number;
  ay: number;
  dx: number;
  dy: number;
  flags: number;
};

export type HBBuffer = {
  ptr: number;
  addText: (text: string, itemOffset?: number, itemLength?: number | null) => void;
  addCodePoints: (codePoints: number[], itemOffset?: number, itemLength?: number | null) => void;
  guessSegmentProperties: () => void;
  setDirection: (dir: HBDir) => void;
  setFlags: (flags: HBFlag[]) => void;
  setLanguage: (language: string) => void;
  setScript: (script: string) => void;
  setClusterLevel: (level: number) => void;
  reset: () => void;
  clearContents: () => void;
  setMessageFunc: (func: (buffer: HBBuffer, font: HBFont, message: string) => boolean) => void;
  getLength: () => number;
  getGlyphInfos: () => GlyphInfo[];
  getGlyphPositions: () => GlyphPosition[];
  updateGlyphPositions: (positions: GlyphPosition[]) => void;
  serialize: (font?: HBFont | null, start?: number, end?: number | null, format?: string, flags?: HBSerializeFlag[]) => string;
  getContentType: () => HBContentType;
  json: () => HBJson[];
  destroy: () => void;
};

export type TraceEntry = {
  m: string;
  t: object[];
  glyphs: boolean;
};

export type HBVersion = {
  major: number;
  minor: number;
  micro: number;
};

export type HBHandle = {
  createBlob: (blob: ArrayBuffer | Uint8Array) => HBBlob;
  createFace: (blob: HBBlob, index: number) => HBFace;
  createFont: (face: HBFace) => HBFont;
  createFontFuncs: () => HBFontFuncs;
  createBuffer: () => HBBuffer;
  shape: (font: HBFont, buffer: HBBuffer, features?: string) => void;
  shapeWithTrace: (font: HBFont, buffer: HBBuffer, features: string, stop_at: number, stop_phase: number) => TraceEntry[];
  version: () => HBVersion;
  version_string: () => string;
  otTagToScript: (tag: string) => string;
  otTagToLanguage: (tag: string) => string;
};
