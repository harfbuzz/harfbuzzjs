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

interface StringPtr {
  ptr: number;
  length: number;
  free: () => void;
}

// Module-level WASM state (set once by init)
let Module: any;
let exports: any;
let freeFuncPtr: number;

const utf8Decoder = new TextDecoder("utf8");
const utf8Encoder = new TextEncoder();

const TRACE_PHASE_DONT_STOP = 0;
const TRACE_PHASE_GSUB = 1;
const TRACE_PHASE_GPOS = 2;

const STATIC_ARRAY_SIZE = 128;

const HB_MEMORY_MODE_WRITABLE = 2;
const HB_SET_VALUE_INVALID = -1;
const HB_OT_NAME_ID_INVALID = 0xFFFF;

export enum GlyphClass {
  UNCLASSIFIED = 0,
  BASE_GLYPH = 1,
  LIGATURE = 2,
  MARK = 3,
  COMPONENT = 4,
}

export enum GlyphFlag {
  UNSAFE_TO_BREAK = 0x00000001,
  UNSAFE_TO_CONCAT = 0x00000002,
  SAFE_TO_INSERT_TATWEEL = 0x00000004,
  DEFINED = 0x00000007,
}

export enum BufferContentType {
  INVALID = 0,
  UNICODE = 1,
  GLYPHS = 2,
}

export enum BufferSerializeFlag {
  DEFAULT = 0x00000000,
  NO_CLUSTERS = 0x00000001,
  NO_POSITIONS = 0x00000002,
  NO_GLYPH_NAMES = 0x00000004,
  GLYPH_EXTENTS = 0x00000008,
  GLYPH_FLAGS = 0x00000010,
  NO_ADVANCES = 0x00000020,
}

export enum BufferFlag {
  DEFAULT = 0x00000000,
  BOT = 0x00000001,
  EOT = 0x00000002,
  PRESERVE_DEFAULT_IGNORABLES = 0x00000004,
  REMOVE_DEFAULT_IGNORABLES = 0x00000008,
  DO_NOT_INSERT_DOTTED_CIRCLE = 0x00000010,
  VERIFY = 0x00000020,
  PRODUCE_UNSAFE_TO_CONCAT = 0x00000040,
  PRODUCE_SAFE_TO_INSERT_TATWEEL = 0x00000080,
}

export enum Direction {
  INVALID = 0,
  LTR = 4,
  RTL = 5,
  TTB = 6,
  BTT = 7,
}

export enum BufferSerializeFormat {
  TEXT = "TEXT",
  JSON = "JSON",
}

/**
 * Initialize the HarfBuzz module. Must be called (and awaited) before
 * using any other functions or classes.
 * @param module The Emscripten module instance.
 */
export function init(module: any) {
  Module = module;
  exports = module.wasmExports;
  freeFuncPtr = Module.addFunction((ptr: number) => { exports.free(ptr); }, 'vi');
}

// Private helpers

function _hb_tag(s: string): number {
  return (
    (s.charCodeAt(0) & 0xFF) << 24 |
    (s.charCodeAt(1) & 0xFF) << 16 |
    (s.charCodeAt(2) & 0xFF) << 8 |
    (s.charCodeAt(3) & 0xFF) << 0
  );
}

function _hb_untag(tag: number): string {
  return [
    String.fromCharCode((tag >> 24) & 0xFF),
    String.fromCharCode((tag >> 16) & 0xFF),
    String.fromCharCode((tag >> 8) & 0xFF),
    String.fromCharCode((tag >> 0) & 0xFF)
  ].join('');
}

function _utf8_ptr_to_string(ptr: number, length?: number): string {
  let end: number;
  if (length === undefined) end = Module.HEAPU8.indexOf(0, ptr);
  else end = ptr + length;
  return utf8Decoder.decode(Module.HEAPU8.subarray(ptr, end));
}

function _utf16_ptr_to_string(ptr: number, length: number): string {
  const end = ptr / 2 + length;
  return String.fromCharCode(...Module.HEAPU16.subarray(ptr / 2, end));
}

/**
 * Use when you know the input range should be ASCII.
 * Faster than encoding to UTF-8
 */
function _string_to_ascii_ptr(text: string): StringPtr {
  const ptr = exports.malloc(text.length + 1);
  for (let i = 0; i < text.length; ++i) {
    const char = text.charCodeAt(i);
    if (char > 127) throw new Error('Expected ASCII text');
    Module.HEAPU8[ptr + i] = char;
  }
  Module.HEAPU8[ptr + text.length] = 0;
  return {
    ptr,
    length: text.length,
    free: function () { exports.free(ptr); }
  };
}

function _string_to_utf8_ptr(text: string): StringPtr {
  const ptr = exports.malloc(text.length);
  utf8Encoder.encodeInto(text, Module.HEAPU8.subarray(ptr, ptr + text.length));
  return {
    ptr,
    length: text.length,
    free: function () { exports.free(ptr); }
  };
}

function _string_to_utf16_ptr(text: string): StringPtr {
  const ptr = exports.malloc(text.length * 2);
  const words = Module.HEAPU16.subarray(ptr / 2, ptr / 2 + text.length);
  for (let i = 0; i < words.length; ++i) words[i] = text.charCodeAt(i);
  return {
    ptr,
    length: words.length,
    free: function () { exports.free(ptr); }
  };
}

function _language_to_string(language: number): string {
  const ptr = exports.hb_language_to_string(language);
  return _utf8_ptr_to_string(ptr);
}

function _language_from_string(str: string): number {
  const languageStr = _string_to_ascii_ptr(str);
  const languagePtr = exports.hb_language_from_string(languageStr.ptr, -1);
  languageStr.free();
  return languagePtr;
}

/**
 * Return the typed array of HarfBuzz set contents.
 * @param setPtr Pointer of set
 * @returns Typed array instance
 */
function _typed_array_from_set(setPtr: number): Uint32Array {
  const setCount = exports.hb_set_get_population(setPtr);
  const arrayPtr = exports.malloc(setCount << 2);
  const arrayOffset = arrayPtr >> 2;
  const array = Module.HEAPU32.subarray(arrayOffset, arrayOffset + setCount);
  Module.HEAPU32.set(array, arrayOffset);
  exports.hb_set_next_many(setPtr, HB_SET_VALUE_INVALID, arrayPtr, setCount);
  return array;
}

// Classes

/**
 * An object representing a {@link https://harfbuzz.github.io/harfbuzz-hb-blob.html | HarfBuzz blob}.
 * A blob wraps a chunk of binary data, typically the contents of a font file.
 */
export class Blob {
  readonly ptr: number;

  /**
   * @param data Binary font data.
   */
  constructor(data: ArrayBuffer) {
    const blobPtr = exports.malloc(data.byteLength);
    Module.HEAPU8.set(new Uint8Array(data), blobPtr);
    this.ptr = exports.hb_blob_create(blobPtr, data.byteLength, HB_MEMORY_MODE_WRITABLE, blobPtr, freeFuncPtr);
  }

  /** Free the object. */
  destroy() { exports.hb_blob_destroy(this.ptr); }
}

/**
 * An object representing a {@link https://harfbuzz.github.io/harfbuzz-hb-face.html | HarfBuzz face}.
 * A face represents a single face in a binary font file and is the
 * foundation for creating Font objects used in text shaping.
 */
export class Face {
  readonly ptr: number;
  readonly upem: number;

  /**
   * @param blob A Blob containing font data.
   * @param index The index of the font in the blob. (0 for most files,
   *  or a 0-indexed font number if the `blob` came from a font collection file.)
   */
  constructor(blob: Blob, index: number = 0) {
    this.ptr = exports.hb_face_create(blob.ptr, index);
    this.upem = exports.hb_face_get_upem(this.ptr);
  }

  /**
   * Return the binary contents of an OpenType table.
   * @param table Table name
   * @returns A Uint8Array of the table data, or undefined if the table is not found.
   */
  reference_table(table: string): Uint8Array | undefined {
    const blob = exports.hb_face_reference_table(this.ptr, _hb_tag(table));
    const length = exports.hb_blob_get_length(blob);
    if (!length) { return; }
    const blobptr = exports.hb_blob_get_data(blob, 0);
    return Module.HEAPU8.subarray(blobptr, blobptr + length);
  }

  /**
   * Return variation axis infos.
   * @returns A dictionary mapping axis tags to {min, default, max} values.
   */
  getAxisInfos(): Record<string, AxisInfo> {
    const sp = Module.stackSave();
    const axis = Module.stackAlloc(64 * 32);
    const c = Module.stackAlloc(4);
    Module.HEAPU32[c / 4] = 64;
    exports.hb_ot_var_get_axis_infos(this.ptr, 0, c, axis);
    const result: Record<string, AxisInfo> = {};
    Array.from({ length: Module.HEAPU32[c / 4] }).forEach((_, i) => {
      result[_hb_untag(Module.HEAPU32[axis / 4 + i * 8 + 1])] = {
        min: Module.HEAPF32[axis / 4 + i * 8 + 4],
        default: Module.HEAPF32[axis / 4 + i * 8 + 5],
        max: Module.HEAPF32[axis / 4 + i * 8 + 6]
      };
    });
    Module.stackRestore(sp);
    return result;
  }

  /**
   * Return unicodes the face supports.
   * @returns A Uint32Array of supported Unicode code points.
   */
  collectUnicodes(): Uint32Array {
    const unicodeSetPtr = exports.hb_set_create();
    exports.hb_face_collect_unicodes(this.ptr, unicodeSetPtr);
    const result = _typed_array_from_set(unicodeSetPtr);
    exports.hb_set_destroy(unicodeSetPtr);
    return result;
  }

  /**
   * Return all scripts enumerated in the specified face's
   * GSUB table or GPOS table.
   * @param table The table to query, either "GSUB" or "GPOS".
   * @returns An array of 4-character script tag strings.
   */
  getTableScriptTags(table: string): string[] {
    const sp = Module.stackSave();
    const tableTag = _hb_tag(table);
    let startOffset = 0;
    let scriptCount = STATIC_ARRAY_SIZE;
    const scriptCountPtr = Module.stackAlloc(4);
    const scriptTagsPtr = Module.stackAlloc(STATIC_ARRAY_SIZE * 4);
    const tags: string[] = [];
    while (scriptCount == STATIC_ARRAY_SIZE) {
      Module.HEAPU32[scriptCountPtr / 4] = scriptCount;
      exports.hb_ot_layout_table_get_script_tags(this.ptr, tableTag, startOffset,
        scriptCountPtr, scriptTagsPtr);
      scriptCount = Module.HEAPU32[scriptCountPtr / 4];
      const scriptTags = Module.HEAPU32.subarray(scriptTagsPtr / 4,
        scriptTagsPtr / 4 + scriptCount);
      tags.push(...Array.from(scriptTags as Uint32Array).map(_hb_untag));
      startOffset += scriptCount;
    }
    Module.stackRestore(sp);
    return tags;
  }

  /**
   * Return all features enumerated in the specified face's
   * GSUB table or GPOS table.
   * @param table The table to query, either "GSUB" or "GPOS".
   * @returns An array of 4-character feature tag strings.
   */
  getTableFeatureTags(table: string): string[] {
    const sp = Module.stackSave();
    const tableTag = _hb_tag(table);
    let startOffset = 0;
    let featureCount = STATIC_ARRAY_SIZE;
    const featureCountPtr = Module.stackAlloc(4);
    const featureTagsPtr = Module.stackAlloc(STATIC_ARRAY_SIZE * 4);
    const tags: string[] = [];
    while (featureCount == STATIC_ARRAY_SIZE) {
      Module.HEAPU32[featureCountPtr / 4] = featureCount;
      exports.hb_ot_layout_table_get_feature_tags(this.ptr, tableTag, startOffset,
        featureCountPtr, featureTagsPtr);
      featureCount = Module.HEAPU32[featureCountPtr / 4];
      const scriptTags = Module.HEAPU32.subarray(featureTagsPtr / 4,
        featureTagsPtr / 4 + featureCount);
      tags.push(...Array.from(scriptTags as Uint32Array).map(_hb_untag));
      startOffset += featureCount;
    }
    Module.stackRestore(sp);
    return tags;
  }

  /**
   * Return language tags in the given face's GSUB or GPOS table, underneath
   * the specified script index.
   * @param table The table to query, either "GSUB" or "GPOS".
   * @param scriptIndex The index of the script to query.
   * @returns An array of 4-character language tag strings.
   */
  getScriptLanguageTags(table: string, scriptIndex: number): string[] {
    const sp = Module.stackSave();
    const tableTag = _hb_tag(table);
    let startOffset = 0;
    let languageCount = STATIC_ARRAY_SIZE;
    const languageCountPtr = Module.stackAlloc(4);
    const languageTagsPtr = Module.stackAlloc(STATIC_ARRAY_SIZE * 4);
    const tags: string[] = [];
    while (languageCount == STATIC_ARRAY_SIZE) {
      Module.HEAPU32[languageCountPtr / 4] = languageCount;
      exports.hb_ot_layout_script_get_language_tags(this.ptr, tableTag, scriptIndex, startOffset,
        languageCountPtr, languageTagsPtr);
      languageCount = Module.HEAPU32[languageCountPtr / 4];
      const languageTags = Module.HEAPU32.subarray(languageTagsPtr / 4,
        languageTagsPtr / 4 + languageCount);
      tags.push(...Array.from(languageTags as Uint32Array).map(_hb_untag));
      startOffset += languageCount;
    }
    Module.stackRestore(sp);
    return tags;
  }

  /**
   * Return all features in the specified face's GSUB table or GPOS table,
   * underneath the specified script and language.
   * @param table The table to query, either "GSUB" or "GPOS".
   * @param scriptIndex The index of the script to query.
   * @param languageIndex The index of the language to query.
   * @returns An array of 4-character feature tag strings.
   */
  getLanguageFeatureTags(table: string, scriptIndex: number, languageIndex: number): string[] {
    const sp = Module.stackSave();
    const tableTag = _hb_tag(table);
    let startOffset = 0;
    let featureCount = STATIC_ARRAY_SIZE;
    const featureCountPtr = Module.stackAlloc(4);
    const featureTagsPtr = Module.stackAlloc(STATIC_ARRAY_SIZE * 4);
    const tags: string[] = [];
    while (featureCount == STATIC_ARRAY_SIZE) {
      Module.HEAPU32[featureCountPtr / 4] = featureCount;
      exports.hb_ot_layout_language_get_feature_tags(this.ptr, tableTag, scriptIndex, languageIndex, startOffset,
        featureCountPtr, featureTagsPtr);
      featureCount = Module.HEAPU32[featureCountPtr / 4];
      const featureTags = Module.HEAPU32.subarray(featureTagsPtr / 4,
        featureTagsPtr / 4 + featureCount);
      tags.push(...Array.from(featureTags as Uint32Array).map(_hb_untag));
      startOffset += featureCount;
    }
    Module.stackRestore(sp);
    return tags;
  }

  /**
   * Get the GDEF class of the requested glyph.
   * @param glyph The glyph to get the class of.
   * @returns The {@link GlyphClass} of the glyph.
   */
  getGlyphClass(glyph: number): GlyphClass {
    return exports.hb_ot_layout_get_glyph_class(this.ptr, glyph) as GlyphClass;
  }

  /**
   * Return all names in the specified face's name table.
   * @returns An array of {nameId, language} entries.
   */
  listNames(): NameEntry[] {
    const sp = Module.stackSave();
    const numEntriesPtr = Module.stackAlloc(4);
    const entriesPtr = exports.hb_ot_name_list_names(this.ptr, numEntriesPtr);
    const numEntries = Module.HEAPU32[numEntriesPtr / 4];
    const entries: NameEntry[] = [];
    for (let i = 0; i < numEntries; i++) {
      entries.push({
        nameId: Module.HEAPU32[(entriesPtr / 4) + (i * 3)],
        language: _language_to_string(Module.HEAPU32[(entriesPtr / 4) + (i * 3) + 2])
      });
    }
    Module.stackRestore(sp);
    return entries;
  }

  /**
   * Get the name of the specified face.
   * @param nameId The ID of the name to get.
   * @param language The language of the name to get.
   * @returns The name string.
   */
  getName(nameId: number, language: string): string {
    const sp = Module.stackSave();
    const languagePtr = _language_from_string(language);
    const nameLen = exports.hb_ot_name_get_utf16(this.ptr, nameId, languagePtr, 0, 0) + 1;
    const textSizePtr = Module.stackAlloc(4);
    const textPtr = exports.malloc(nameLen * 2);
    Module.HEAPU32[textSizePtr / 4] = nameLen;
    exports.hb_ot_name_get_utf16(this.ptr, nameId, languagePtr, textSizePtr, textPtr);
    const name = _utf16_ptr_to_string(textPtr, nameLen - 1);
    exports.free(textPtr);
    Module.stackRestore(sp);
    return name;
  }

  /**
   * Get the name IDs of the specified feature.
   * @param table The table to query, either "GSUB" or "GPOS".
   * @param featureIndex The index of the feature to query.
   * @returns An object with name IDs, or null if not found.
   */
  getFeatureNameIds(table: string, featureIndex: number): FeatureNameIds | null {
    const sp = Module.stackSave();
    const tableTag = _hb_tag(table);
    const labelIdPtr = Module.stackAlloc(4);
    const tooltipIdPtr = Module.stackAlloc(4);
    const sampleIdPtr = Module.stackAlloc(4);
    const numNamedParametersPtr = Module.stackAlloc(4);
    const firstParameterIdPtr = Module.stackAlloc(4);

    const found = exports.hb_ot_layout_feature_get_name_ids(this.ptr, tableTag, featureIndex,
      labelIdPtr, tooltipIdPtr, sampleIdPtr, numNamedParametersPtr, firstParameterIdPtr);

    let names: FeatureNameIds | null = null;
    if (found) {
      const uiLabelNameId = Module.HEAPU32[labelIdPtr / 4];
      const uiTooltipTextNameId = Module.HEAPU32[tooltipIdPtr / 4];
      const sampleTextNameId = Module.HEAPU32[sampleIdPtr / 4];
      const numNamedParameters = Module.HEAPU32[numNamedParametersPtr / 4];
      const firstParameterId = Module.HEAPU32[firstParameterIdPtr / 4];
      const paramUiLabelNameIds = Array.from({ length: numNamedParameters }, (_: number, i: number) => firstParameterId + i);
      names = {
        uiLabelNameId: uiLabelNameId == HB_OT_NAME_ID_INVALID ? null : uiLabelNameId,
        uiTooltipTextNameId: uiTooltipTextNameId == HB_OT_NAME_ID_INVALID ? null : uiTooltipTextNameId,
        sampleTextNameId: sampleTextNameId == HB_OT_NAME_ID_INVALID ? null : sampleTextNameId,
        paramUiLabelNameIds: paramUiLabelNameIds
      };
    }

    Module.stackRestore(sp);
    return names;
  }

  /** Free the object. */
  destroy() {
    exports.hb_face_destroy(this.ptr);
  }
}

/**
 * An object representing a {@link https://harfbuzz.github.io/harfbuzz-hb-font.html | HarfBuzz font}.
 * A font represents a face at a specific size and with certain other
 * parameters (pixels-per-em, variation settings) specified. Fonts are the
 * primary input to the shaping process.
 */
export class Font {
  readonly ptr: number;
  private drawFuncsPtr: number | null = null;
  private moveToPtr: number | null = null;
  private lineToPtr: number | null = null;
  private cubicToPtr: number | null = null;
  private quadToPtr: number | null = null;
  private closePathPtr: number | null = null;
  private pathBuffer = "";

  /**
   * @param face A Face to create the font from.
   */
  constructor(face: Face);
  /** @internal Wrap an existing font pointer. */
  constructor(existingPtr: number);
  constructor(arg: Face | number) {
    if (typeof arg === 'number') {
      this.ptr = exports.hb_font_reference(arg);
    } else {
      this.ptr = exports.hb_font_create(arg.ptr);
    }
  }

  /**
   * Create a sub font that inherits this font's properties.
   * @returns A new Font object representing the sub font.
   */
  subFont(): Font {
    return new Font(exports.hb_font_create_sub_font(this.ptr));
  }

  /**
   * Return font horizontal extents.
   * @returns Object with ascender, descender, and lineGap properties.
   */
  hExtents(): FontExtents {
    const sp = Module.stackSave();
    const extentsPtr = Module.stackAlloc(48);
    exports.hb_font_get_h_extents(this.ptr, extentsPtr);
    const extents = {
      ascender: Module.HEAP32[extentsPtr / 4],
      descender: Module.HEAP32[extentsPtr / 4 + 1],
      lineGap: Module.HEAP32[extentsPtr / 4 + 2],
    };
    Module.stackRestore(sp);
    return extents;
  }

  /**
   * Return font vertical extents.
   * @returns Object with ascender, descender, and lineGap properties.
   */
  vExtents(): FontExtents {
    const sp = Module.stackSave();
    const extentsPtr = Module.stackAlloc(48);
    exports.hb_font_get_v_extents(this.ptr, extentsPtr);
    const extents = {
      ascender: Module.HEAP32[extentsPtr / 4],
      descender: Module.HEAP32[extentsPtr / 4 + 1],
      lineGap: Module.HEAP32[extentsPtr / 4 + 2],
    };
    Module.stackRestore(sp);
    return extents;
  }

  /**
   * Return glyph name.
   * @param glyphId ID of the requested glyph in the font.
   * @returns The glyph name string.
   */
  glyphName(glyphId: number): string {
    const sp = Module.stackSave();
    const strSize = 256;
    const strPtr = Module.stackAlloc(strSize);
    exports.hb_font_glyph_to_string(this.ptr, glyphId, strPtr, strSize);
    const name = _utf8_ptr_to_string(strPtr);
    Module.stackRestore(sp);
    return name;
  }

  /**
   * Return a glyph as an SVG path string.
   * @param glyphId ID of the requested glyph in the font.
   * @returns SVG path data string.
   */
  glyphToPath(glyphId: number): string {
    if (!this.drawFuncsPtr) {
      const moveTo = (dfuncs: number, draw_data: number, draw_state: number, to_x: number, to_y: number, user_data: number) => {
        this.pathBuffer += `M${to_x},${to_y}`;
      }
      const lineTo = (dfuncs: number, draw_data: number, draw_state: number, to_x: number, to_y: number, user_data: number) => {
        this.pathBuffer += `L${to_x},${to_y}`;
      }
      const cubicTo = (dfuncs: number, draw_data: number, draw_state: number, c1_x: number, c1_y: number, c2_x: number, c2_y: number, to_x: number, to_y: number, user_data: number) => {
        this.pathBuffer += `C${c1_x},${c1_y} ${c2_x},${c2_y} ${to_x},${to_y}`;
      }
      const quadTo = (dfuncs: number, draw_data: number, draw_state: number, c_x: number, c_y: number, to_x: number, to_y: number, user_data: number) => {
        this.pathBuffer += `Q${c_x},${c_y} ${to_x},${to_y}`;
      }
      const closePath = (dfuncs: number, draw_data: number, draw_state: number, user_data: number) => {
        this.pathBuffer += 'Z';
      }

      this.moveToPtr = Module.addFunction(moveTo, 'viiiffi');
      this.lineToPtr = Module.addFunction(lineTo, 'viiiffi');
      this.cubicToPtr = Module.addFunction(cubicTo, 'viiiffffffi');
      this.quadToPtr = Module.addFunction(quadTo, 'viiiffffi');
      this.closePathPtr = Module.addFunction(closePath, 'viiii');
      this.drawFuncsPtr = exports.hb_draw_funcs_create();
      exports.hb_draw_funcs_set_move_to_func(this.drawFuncsPtr, this.moveToPtr, 0, 0);
      exports.hb_draw_funcs_set_line_to_func(this.drawFuncsPtr, this.lineToPtr, 0, 0);
      exports.hb_draw_funcs_set_cubic_to_func(this.drawFuncsPtr, this.cubicToPtr, 0, 0);
      exports.hb_draw_funcs_set_quadratic_to_func(this.drawFuncsPtr, this.quadToPtr, 0, 0);
      exports.hb_draw_funcs_set_close_path_func(this.drawFuncsPtr, this.closePathPtr, 0, 0);
    }

    this.pathBuffer = "";
    exports.hb_font_draw_glyph(this.ptr, glyphId, this.drawFuncsPtr, 0);
    return this.pathBuffer;
  }

  /**
   * Return glyph horizontal advance.
   * @param glyphId ID of the requested glyph in the font.
   * @returns The horizontal advance width.
   */
  glyphHAdvance(glyphId: number): number {
    return exports.hb_font_get_glyph_h_advance(this.ptr, glyphId);
  }

  /**
   * Return glyph vertical advance.
   * @param glyphId ID of the requested glyph in the font.
   * @returns The vertical advance height.
   */
  glyphVAdvance(glyphId: number): number {
    return exports.hb_font_get_glyph_v_advance(this.ptr, glyphId);
  }

  /**
   * Return glyph horizontal origin.
   * @param glyphId ID of the requested glyph in the font.
   * @returns [x, y] origin coordinates, or null if not available.
   */
  glyphHOrigin(glyphId: number): [number, number] | null {
    const sp = Module.stackSave();
    const xPtr = Module.stackAlloc(4);
    const yPtr = Module.stackAlloc(4);
    let origin: [number, number] | null = null;
    if (exports.hb_font_get_glyph_h_origin(this.ptr, glyphId, xPtr, yPtr)) {
      origin = [Module.HEAP32[xPtr / 4], Module.HEAP32[yPtr / 4]];
    }
    Module.stackRestore(sp);
    return origin;
  }

  /**
   * Return glyph vertical origin.
   * @param glyphId ID of the requested glyph in the font.
   * @returns [x, y] origin coordinates, or null if not available.
   */
  glyphVOrigin(glyphId: number): [number, number] | null {
    const sp = Module.stackSave();
    const xPtr = Module.stackAlloc(4);
    const yPtr = Module.stackAlloc(4);
    let origin: [number, number] | null = null;
    if (exports.hb_font_get_glyph_v_origin(this.ptr, glyphId, xPtr, yPtr)) {
      origin = [Module.HEAP32[xPtr / 4], Module.HEAP32[yPtr / 4]];
    }
    Module.stackRestore(sp);
    return origin;
  }

  /**
   * Return glyph extents.
   * @param glyphId ID of the requested glyph in the font.
   * @returns An object with xBearing, yBearing, width, and height, or null.
   */
  glyphExtents(glyphId: number): GlyphExtents | null {
    const sp = Module.stackSave();
    const extentsPtr = Module.stackAlloc(16);
    let extents: GlyphExtents | null = null;
    if (exports.hb_font_get_glyph_extents(this.ptr, glyphId, extentsPtr)) {
      extents = {
        xBearing: Module.HEAP32[extentsPtr / 4],
        yBearing: Module.HEAP32[extentsPtr / 4 + 1],
        width: Module.HEAP32[extentsPtr / 4 + 2],
        height: Module.HEAP32[extentsPtr / 4 + 3]
      };
    }
    Module.stackRestore(sp);
    return extents;
  }

  /**
   * Return glyph ID from name.
   * @param name Name of the requested glyph in the font.
   * @returns The glyph ID, or null if not found.
   */
  glyphFromName(name: string): number | null {
    const sp = Module.stackSave();
    const glyphIdPtr = Module.stackAlloc(4);
    const namePtr = _string_to_utf8_ptr(name);
    let glyphId: number | null = null;
    if (exports.hb_font_get_glyph_from_name(this.ptr, namePtr.ptr, namePtr.length, glyphIdPtr)) {
      glyphId = Module.HEAPU32[glyphIdPtr / 4];
    }
    namePtr.free();
    Module.stackRestore(sp);
    return glyphId;
  }

  /**
   * Return a glyph as a JSON path string
   * based on format described on https://svgwg.org/specs/paths/#InterfaceSVGPathSegment
   * @param glyphId ID of the requested glyph in the font.
   * @returns An array of path segment objects with type and values.
   */
  glyphToJson(glyphId: number): SvgPathCommand[] {
    const path = this.glyphToPath(glyphId);
    return path
      .replace(/([MLQCZ])/g, '|$1 ')
      .split('|')
      .filter(x => x.length)
      .map(x => {
        const [type, ...values] = x.split(/[ ,]/g).filter(s => s.length);
        return { type, values: values.map(Number) };
      });
  }

  /**
   * Set the font's scale factor, affecting the position values returned from
   * shaping.
   * @param xScale Units to scale in the X dimension.
   * @param yScale Units to scale in the Y dimension.
   */
  setScale(xScale: number, yScale: number): void {
    exports.hb_font_set_scale(this.ptr, xScale, yScale);
  }

  /**
   * Set the font's variations.
   * @param variations Dictionary of variations to set.
   */
  setVariations(variations: Record<string, number>): void {
    const entries = Object.entries(variations);
    const vars = exports.malloc(8 * entries.length);
    entries.forEach(([tag, value], i) => {
      Module.HEAPU32[vars / 4 + i * 2 + 0] = _hb_tag(tag);
      Module.HEAPF32[vars / 4 + i * 2 + 1] = value;
    });
    exports.hb_font_set_variations(this.ptr, vars, entries.length);
    exports.free(vars);
  }

  /** Set the font's font functions. */
  setFuncs(fontFuncs: FontFuncs): void {
    exports.hb_font_set_funcs(this.ptr, fontFuncs.ptr);
  }

  /** Free the object. */
  destroy(): void {
    exports.hb_font_destroy(this.ptr);
    if (this.drawFuncsPtr) {
      exports.hb_draw_funcs_destroy(this.drawFuncsPtr);
      this.drawFuncsPtr = null;
      Module.removeFunction(this.moveToPtr!);
      Module.removeFunction(this.lineToPtr!);
      Module.removeFunction(this.cubicToPtr!);
      Module.removeFunction(this.quadToPtr!);
      Module.removeFunction(this.closePathPtr!);
    }
  }
}

/**
 * An object representing {@link https://harfbuzz.github.io/harfbuzz-hb-font.html | HarfBuzz font functions}.
 * Font functions define the methods used by a Font for lower-level queries
 * like glyph advances and extents. HarfBuzz provides built-in default
 * implementations which can be selectively overridden.
 */
export class FontFuncs {
  readonly ptr: number;

  constructor() {
    this.ptr = exports.hb_font_funcs_create();
  }

  /**
   * Set the font's glyph extents function.
   * @param func The callback receives a Font and glyph ID. It should return
   * an object with xBearing, yBearing, width, and height, or null on failure.
   */
  setGlyphExtentsFunc(func: (font: Font, glyph: number) => GlyphExtents | null): void {
    const funcPtr = Module.addFunction((fontPtr: number, font_data: number, glyph: number, extentsPtr: number, user_data: number) => {
      const font = new Font(fontPtr);
      const extents = func(font, glyph);
      font.destroy();
      if (extents) {
        Module.HEAP32[extentsPtr / 4] = extents.xBearing;
        Module.HEAP32[extentsPtr / 4 + 1] = extents.yBearing;
        Module.HEAP32[extentsPtr / 4 + 2] = extents.width;
        Module.HEAP32[extentsPtr / 4 + 3] = extents.height;
        return 1;
      }
      return 0;
    }, 'ippipp');
    exports.hb_font_funcs_set_glyph_extents_func(this.ptr, funcPtr, 0, 0);
  }

  /**
   * Set the font's glyph from name function.
   * @param func The callback receives a Font and glyph name. It should return
   * the glyph ID, or null on failure.
   */
  setGlyphFromNameFunc(func: (font: Font, name: string) => number | null): void {
    const funcPtr = Module.addFunction((fontPtr: number, font_data: number, namePtr: number, len: number, glyphPtr: number, user_data: number) => {
      const font = new Font(fontPtr);
      const name = _utf8_ptr_to_string(namePtr, len);
      const glyph = func(font, name);
      font.destroy();
      if (glyph) {
        Module.HEAPU32[glyphPtr / 4] = glyph;
        return 1;
      }
      return 0;
    }, 'ipppipp');
    exports.hb_font_funcs_set_glyph_from_name_func(this.ptr, funcPtr, 0, 0);
  }

  /**
   * Set the font's glyph horizontal advance function.
   * @param func The callback receives a Font and glyph ID. It should return
   * the horizontal advance of the glyph.
   */
  setGlyphHAdvanceFunc(func: (font: Font, glyph: number) => number): void {
    const funcPtr = Module.addFunction((fontPtr: number, font_data: number, glyph: number, user_data: number) => {
      const font = new Font(fontPtr);
      const advance = func(font, glyph);
      font.destroy();
      return advance;
    }, 'ippip');
    exports.hb_font_funcs_set_glyph_h_advance_func(this.ptr, funcPtr, 0, 0);
  }

  /**
   * Set the font's glyph vertical advance function.
   * @param func The callback receives a Font and glyph ID. It should return
   * the vertical advance of the glyph.
   */
  setGlyphVAdvanceFunc(func: (font: Font, glyph: number) => number): void {
    const funcPtr = Module.addFunction((fontPtr: number, font_data: number, glyph: number, user_data: number) => {
      const font = new Font(fontPtr);
      const advance = func(font, glyph);
      font.destroy();
      return advance;
    }, 'ippip');
    exports.hb_font_funcs_set_glyph_v_advance_func(this.ptr, funcPtr, 0, 0);
  }

  /**
   * Set the font's glyph horizontal origin function.
   * @param func The callback receives a Font and glyph ID. It should return
   * the [x, y] horizontal origin of the glyph, or null on failure.
   */
  setGlyphHOriginFunc(func: (font: Font, glyph: number) => [number, number] | null): void {
    const funcPtr = Module.addFunction((fontPtr: number, font_data: number, glyph: number, xPtr: number, yPtr: number, user_data: number) => {
      const font = new Font(fontPtr);
      const origin = func(font, glyph);
      font.destroy();
      if (origin) {
        Module.HEAP32[xPtr / 4] = origin[0];
        Module.HEAP32[yPtr / 4] = origin[1];
        return 1;
      }
      return 0;
    }, 'ippippp');
    exports.hb_font_funcs_set_glyph_h_origin_func(this.ptr, funcPtr, 0, 0);
  }

  /**
   * Set the font's glyph vertical origin function.
   * @param func The callback receives a Font and glyph ID. It should return
   * the [x, y] vertical origin of the glyph, or null on failure.
   */
  setGlyphVOriginFunc(func: (font: Font, glyph: number) => [number, number] | null): void {
    const funcPtr = Module.addFunction((fontPtr: number, font_data: number, glyph: number, xPtr: number, yPtr: number, user_data: number) => {
      const font = new Font(fontPtr);
      const origin = func(font, glyph);
      font.destroy();
      if (origin) {
        Module.HEAP32[xPtr / 4] = origin[0];
        Module.HEAP32[yPtr / 4] = origin[1];
        return 1;
      }
      return 0;
    }, 'ippippp');
    exports.hb_font_funcs_set_glyph_v_origin_func(this.ptr, funcPtr, 0, 0);
  }

  /**
   * Set the font's glyph horizontal kerning function.
   * @param func The callback receives a Font, first glyph ID, and second glyph ID.
   * It should return the horizontal kerning of the glyphs.
   */
  setGlyphHKerningFunc(func: (font: Font, firstGlyph: number, secondGlyph: number) => number): void {
    const funcPtr = Module.addFunction((fontPtr: number, font_data: number, firstGlyph: number, secondGlyph: number, user_data: number) => {
      const font = new Font(fontPtr);
      const kerning = func(font, firstGlyph, secondGlyph);
      font.destroy();
      return kerning;
    }, 'ippiip');
    exports.hb_font_funcs_set_glyph_h_kerning_func(this.ptr, funcPtr, 0, 0);
  }

  /**
   * Set the font's glyph name function.
   * @param func The callback receives a Font and glyph ID. It should return
   * the name of the glyph, or null on failure.
   */
  setGlyphNameFunc(func: (font: Font, glyph: number) => string | null): void {
    const funcPtr = Module.addFunction((fontPtr: number, font_data: number, glyph: number, namePtr: number, size: number, user_data: number) => {
      const font = new Font(fontPtr);
      const name = func(font, glyph);
      font.destroy();
      if (name) {
        utf8Encoder.encodeInto(name, Module.HEAPU8.subarray(namePtr, namePtr + size));
        return 1;
      }
      return 0;
    }, 'ippipip');
    exports.hb_font_funcs_set_glyph_name_func(this.ptr, funcPtr, 0, 0);
  }

  /**
   * Set the font's nominal glyph function.
   * @param func The callback receives a Font and unicode code point. It should
   * return the nominal glyph of the unicode, or null on failure.
   */
  setNominalGlyphFunc(func: (font: Font, unicode: number) => number | null): void {
    const funcPtr = Module.addFunction((fontPtr: number, font_data: number, unicode: number, glyphPtr: number, user_data: number) => {
      const font = new Font(fontPtr);
      const glyph = func(font, unicode);
      font.destroy();
      if (glyph) {
        Module.HEAPU32[glyphPtr / 4] = glyph;
        return 1;
      }
      return 0;
    }, 'ippipp');
    exports.hb_font_funcs_set_nominal_glyph_func(this.ptr, funcPtr, 0, 0);
  }

  /**
   * Set the font's variation glyph function.
   * @param func The callback receives a Font, unicode code point, and variation
   * selector. It should return the variation glyph, or null on failure.
   */
  setVariationGlyphFunc(func: (font: Font, unicode: number, variationSelector: number) => number | null): void {
    const funcPtr = Module.addFunction((fontPtr: number, font_data: number, unicode: number, variationSelector: number, glyphPtr: number, user_data: number) => {
      const font = new Font(fontPtr);
      const glyph = func(font, unicode, variationSelector);
      font.destroy();
      if (glyph) {
        Module.HEAPU32[glyphPtr / 4] = glyph;
        return 1;
      }
      return 0;
    }, 'ippiipp');
    exports.hb_font_funcs_set_variation_glyph_func(this.ptr, funcPtr, 0, 0);
  }

  /**
   * Set the font's horizontal extents function.
   * @param func The callback receives a Font. It should return an object with
   * ascender, descender, and lineGap, or null on failure.
   */
  setFontHExtentsFunc(func: (font: Font) => FontExtents | null): void {
    const funcPtr = Module.addFunction((fontPtr: number, font_data: number, extentsPtr: number, user_data: number) => {
      const font = new Font(fontPtr);
      const extents = func(font);
      font.destroy();
      if (extents) {
        Module.HEAP32[extentsPtr / 4] = extents.ascender;
        Module.HEAP32[extentsPtr / 4 + 1] = extents.descender;
        Module.HEAP32[extentsPtr / 4 + 2] = extents.lineGap;
        return 1;
      }
      return 0;
    }, 'ipppp');
    exports.hb_font_funcs_set_font_h_extents_func(this.ptr, funcPtr, 0, 0);
  }

  /**
   * Set the font's vertical extents function.
   * @param func The callback receives a Font. It should return an object with
   * ascender, descender, and lineGap, or null on failure.
   */
  setFontVExtentsFunc(func: (font: Font) => FontExtents | null): void {
    const funcPtr = Module.addFunction((fontPtr: number, font_data: number, extentsPtr: number, user_data: number) => {
      const font = new Font(fontPtr);
      const extents = func(font);
      font.destroy();
      if (extents) {
        Module.HEAP32[extentsPtr / 4] = extents.ascender;
        Module.HEAP32[extentsPtr / 4 + 1] = extents.descender;
        Module.HEAP32[extentsPtr / 4 + 2] = extents.lineGap;
        return 1;
      }
      return 0;
    }, 'ipppp');
    exports.hb_font_funcs_set_font_v_extents_func(this.ptr, funcPtr, 0, 0);
  }

  /** Free the object. */
  destroy(): void {
    exports.hb_font_funcs_destroy(this.ptr);
  }
}

/**
 * An object representing a {@link https://harfbuzz.github.io/harfbuzz-hb-buffer.html | HarfBuzz buffer}.
 * A buffer holds the input text and its properties before shaping, and the
 * output glyphs and their information after shaping.
 */
export class Buffer {
  readonly ptr: number;

  constructor();
  /** @internal Wrap an existing buffer pointer. */
  constructor(existingPtr: number);
  constructor(existingPtr?: number) {
    if (existingPtr !== undefined) {
      this.ptr = exports.hb_buffer_reference(existingPtr);
    } else {
      this.ptr = exports.hb_buffer_create();
    }
  }

  /**
   * Add text to the buffer.
   * @param text Text to be added to the buffer.
   * @param itemOffset The offset of the first character to add to the buffer.
   * @param itemLength The number of characters to add to the buffer, or null for the end of text.
   */
  addText(text: string, itemOffset: number = 0, itemLength: number | null = null): void {
    const str = _string_to_utf16_ptr(text);
    if (itemLength == null) itemLength = str.length;
    exports.hb_buffer_add_utf16(this.ptr, str.ptr, str.length, itemOffset, itemLength);
    str.free();
  }

  /**
   * Add code points to the buffer.
   * @param codePoints Array of code points to be added to the buffer.
   * @param itemOffset The offset of the first code point to add to the buffer.
   * @param itemLength The number of code points to add to the buffer, or null for the end of the array.
   */
  addCodePoints(codePoints: number[], itemOffset: number = 0, itemLength: number | null = null): void {
    const codePointsPtr = exports.malloc(codePoints.length * 4);
    const codePointsArray = Module.HEAPU32.subarray(codePointsPtr / 4, codePointsPtr / 4 + codePoints.length);
    codePointsArray.set(codePoints);
    if (itemLength == null) itemLength = codePoints.length;
    exports.hb_buffer_add_codepoints(this.ptr, codePointsPtr, codePoints.length, itemOffset, itemLength);
    exports.free(codePointsPtr);
  }

  /**
   * Set buffer script, language and direction.
   *
   * This needs to be done before shaping.
   */
  guessSegmentProperties(): void {
    exports.hb_buffer_guess_segment_properties(this.ptr);
  }

  /**
   * Set buffer direction explicitly.
   * @param dir A {@link Direction} value.
   */
  setDirection(dir: Direction): void {
    exports.hb_buffer_set_direction(this.ptr, dir);
  }

  /**
   * Set buffer flags explicitly.
   * @param flags A combination of {@link BufferFlag} values (OR them together).
   */
  setFlags(flags: number): void {
    exports.hb_buffer_set_flags(this.ptr, flags);
  }

  /**
   * Set buffer language explicitly.
   * @param language The buffer language
   */
  setLanguage(language: string): void {
    const str = _string_to_ascii_ptr(language);
    exports.hb_buffer_set_language(this.ptr, exports.hb_language_from_string(str.ptr, -1));
    str.free();
  }

  /**
   * Set buffer script explicitly.
   * @param script The buffer script
   */
  setScript(script: string): void {
    const str = _string_to_ascii_ptr(script);
    exports.hb_buffer_set_script(this.ptr, exports.hb_script_from_string(str.ptr, -1));
    str.free();
  }

  /**
   * Set the HarfBuzz clustering level.
   *
   * Affects the cluster values returned from shaping.
   * @param level Clustering level. See the HarfBuzz manual chapter on Clusters.
   */
  setClusterLevel(level: number): void {
    exports.hb_buffer_set_cluster_level(this.ptr, level);
  }

  /** Reset the buffer to its initial status. */
  reset(): void {
    exports.hb_buffer_reset(this.ptr);
  }

  /**
   * Similar to reset(), but does not clear the Unicode functions and the
   * replacement code point.
   */
  clearContents(): void {
    exports.hb_buffer_clear_contents(this.ptr);
  }

  /**
   * Set message func.
   * @param func The function to set. It receives the buffer, font, and message
   * string as arguments. Returning false will skip this shaping step and move
   * to the next one.
   */
  setMessageFunc(func: (buffer: Buffer, font: Font, message: string) => boolean): void {
    const traceFunc = (bufferPtr: number, fontPtr: number, messagePtr: number, user_data: number) => {
      const message = _utf8_ptr_to_string(messagePtr);
      const buffer = new Buffer(bufferPtr);
      const font = new Font(fontPtr);
      const result = func(buffer, font, message);
      buffer.destroy();
      font.destroy();
      return result ? 1 : 0;
    }
    const traceFuncPtr = Module.addFunction(traceFunc, 'iiiii');
    exports.hb_buffer_set_message_func(this.ptr, traceFuncPtr, 0, 0);
  }

  /**
   * Get the the number of items in the buffer.
   * @returns The buffer length.
   */
  getLength(): number {
    return exports.hb_buffer_get_length(this.ptr);
  }

  /**
   * Get the glyph information from the buffer.
   * @returns An array of {@link GlyphInfo} objects.
   */
  getGlyphInfos(): GlyphInfo[] {
    const infosPtr32 = exports.hb_buffer_get_glyph_infos(this.ptr, 0) / 4;
    const infosArray = Module.HEAPU32.subarray(infosPtr32, infosPtr32 + this.getLength() * 5);
    const infos: GlyphInfo[] = [];
    for (let i = 0; i < infosArray.length; i += 5) {
      infos.push({
        codepoint: infosArray[i],
        cluster: infosArray[i + 2],
      });
    }
    return infos;
  }

  /**
   * Get the glyph positions from the buffer.
   * @returns An array of {@link GlyphPosition} objects.
   */
  getGlyphPositions(): GlyphPosition[] {
    const positionsPtr32 = exports.hb_buffer_get_glyph_positions(this.ptr, 0) / 4;
    if (positionsPtr32 == 0) {
      return [];
    }
    const positionsArray = Module.HEAP32.subarray(positionsPtr32, positionsPtr32 + this.getLength() * 5);
    const positions: GlyphPosition[] = [];
    for (let i = 0; i < positionsArray.length; i += 5) {
      positions.push({
        x_advance: positionsArray[i],
        y_advance: positionsArray[i + 1],
        x_offset: positionsArray[i + 2],
        y_offset: positionsArray[i + 3],
      });
    }
    return positions;
  }

  /**
   * Get the glyph information and positions from the buffer.
   * @returns The glyph information and positions.
   *
   * The glyph information is returned as an array of objects with the
   * properties from getGlyphInfos and getGlyphPositions combined.
   */
  getGlyphInfosAndPositions(): (GlyphInfo & Partial<GlyphPosition>)[] {
    const infosPtr32 = exports.hb_buffer_get_glyph_infos(this.ptr, 0) / 4;
    const infosArray = Module.HEAPU32.subarray(infosPtr32, infosPtr32 + this.getLength() * 5);

    const positionsPtr32 = exports.hb_buffer_get_glyph_positions(this.ptr, 0) / 4;
    const positionsArray = positionsPtr32 ? Module.HEAP32.subarray(positionsPtr32, positionsPtr32 + this.getLength() * 5) : null;

    const out: (GlyphInfo & Partial<GlyphPosition>)[] = [];
    for (let i = 0; i < infosArray.length; i += 5) {
      const info: any = {
        codepoint: infosArray[i],
        cluster: infosArray[i + 2],
      };
      for (const [name, idx] of [['mask', 1], ['var1', 3], ['var2', 4]] as [string, number][]) {
        Object.defineProperty(info, name, {
          value: infosArray[i + idx],
          enumerable: false
        });
      }
      if (positionsArray) {
        info.x_advance = positionsArray[i];
        info.y_advance = positionsArray[i + 1];
        info.x_offset = positionsArray[i + 2];
        info.y_offset = positionsArray[i + 3];
        Object.defineProperty(info, 'var', {
          value: positionsArray[i + 4],
          enumerable: false
        });
      }
      out.push(info);
    }
    return out;
  }

  /**
   * Update the glyph positions in the buffer.
   * WARNING: Do not use unless you know what you are doing.
   */
  updateGlyphPositions(positions: GlyphPosition[]): void {
    const positionsPtr32 = exports.hb_buffer_get_glyph_positions(this.ptr, 0) / 4;
    if (positionsPtr32 == 0) {
      return;
    }
    const len = Math.min(positions.length, this.getLength());
    const positionsArray = Module.HEAP32.subarray(positionsPtr32, positionsPtr32 + len * 5);
    for (let i = 0; i < len; i++) {
      positionsArray[i * 5] = positions[i].x_advance;
      positionsArray[i * 5 + 1] = positions[i].y_advance;
      positionsArray[i * 5 + 2] = positions[i].x_offset;
      positionsArray[i * 5 + 3] = positions[i].y_offset;
    }
  }

  /**
   * Serialize the buffer contents to a string.
   * @param font The font to use for serialization.
   * @param start The starting index of the glyphs to serialize.
   * @param end The ending index of the glyphs to serialize.
   * @param format The {@link BufferSerializeFormat} to serialize the buffer contents to.
   * @param flags A combination of {@link BufferSerializeFlag} values (OR them together).
   *
   * @returns The serialized buffer contents.
   */
  serialize(font?: Font | null, start: number = 0, end?: number | null, format: BufferSerializeFormat = BufferSerializeFormat.TEXT, flags: number = 0): string {
    const sp = Module.stackSave();
    const endPos = end ?? this.getLength();
    const bufLen = 32 * 1024;
    const bufPtr = exports.malloc(bufLen);
    const bufConsumedPtr = Module.stackAlloc(4);
    let result = "";
    while (start < endPos) {
      start += exports.hb_buffer_serialize(this.ptr, start, endPos,
        bufPtr, bufLen, bufConsumedPtr,
        font ? font.ptr : 0, _hb_tag(format), flags);
      const bufConsumed = Module.HEAPU32[bufConsumedPtr / 4];
      if (bufConsumed == 0) break;
      result += _utf8_ptr_to_string(bufPtr, bufConsumed);
    }
    exports.free(bufPtr);
    Module.stackRestore(sp);
    return result;
  }

  /**
   * Return the buffer content type.
   *
   * @returns The buffer content type as a {@link BufferContentType} value.
   */
  getContentType(): BufferContentType {
    return exports.hb_buffer_get_content_type(this.ptr) as BufferContentType;
  }

  /**
   * Return the buffer contents as a JSON object.
   * @returns An array of {@link JsonGlyph} objects.
   */
  json(): JsonGlyph[] {
    const buf = this.serialize(null, 0, null, BufferSerializeFormat.JSON, BufferSerializeFlag.NO_GLYPH_NAMES | BufferSerializeFlag.GLYPH_FLAGS);
    return JSON.parse(buf);
  }

  /** Free the object. */
  destroy(): void { exports.hb_buffer_destroy(this.ptr); }
}

// Free functions

/**
 * Shape a buffer with a given font.
 *
 * Converts the Unicode text in the buffer into positioned glyphs.
 * The buffer is modified in place.
 *
 * @param font The Font to shape with.
 * @param buffer The Buffer containing text to shape, suitably prepared
 *   (text added, segment properties set).
 * @param features A string of comma-separated OpenType features to apply.
 */
export function shape(font: Font, buffer: Buffer, features?: string): void {
  let featuresPtr = 0;
  let featuresLen = 0;
  if (features) {
    const featureList = features.split(",");
    featuresPtr = exports.malloc(16 * featureList.length);
    featureList.forEach(feature => {
      const str = _string_to_ascii_ptr(feature);
      if (exports.hb_feature_from_string(str.ptr, -1, featuresPtr + featuresLen * 16))
        featuresLen++;
      str.free();
    });
  }

  exports.hb_shape(font.ptr, buffer.ptr, featuresPtr, featuresLen);
  if (featuresPtr)
    exports.free(featuresPtr);
}

/**
 * Shape a buffer with a given font, returning a JSON trace of the shaping process.
 *
 * This function supports "partial shaping", where the shaping process is
 * terminated after a given lookup ID is reached.
 *
 * @param font The Font to shape with.
 * @param buffer The Buffer containing text to shape, suitably prepared.
 * @param features A string of comma-separated OpenType features to apply.
 * @param stop_at A lookup ID at which to terminate shaping.
 * @param stop_phase Either 0 (don't terminate shaping), 1 (stop_at refers to
 *   GSUB table), 2 (stop_at refers to GPOS table).
 * @returns An array of trace entries, each with a message, serialized glyphs, and phase info.
 */
export function shapeWithTrace(font: Font, buffer: Buffer, features: string, stop_at: number, stop_phase: number): TraceEntry[] {
  const trace: TraceEntry[] = [];
  let currentPhase = TRACE_PHASE_DONT_STOP;
  let stopping = false;

  buffer.setMessageFunc((buffer, font, message) => {
    if (message.startsWith("start table GSUB"))
      currentPhase = TRACE_PHASE_GSUB;
    else if (message.startsWith("start table GPOS"))
      currentPhase = TRACE_PHASE_GPOS;

    if (currentPhase != stop_phase)
      stopping = false;

    if (stop_phase != TRACE_PHASE_DONT_STOP && currentPhase == stop_phase && message.startsWith("end lookup " + stop_at))
      stopping = true;

    if (stopping)
      return false;

    const traceBuf = buffer.serialize(font, 0, null, BufferSerializeFormat.JSON, BufferSerializeFlag.NO_GLYPH_NAMES);

    trace.push({
      m: message,
      t: JSON.parse(traceBuf),
      glyphs: buffer.getContentType() == BufferContentType.GLYPHS,
    });

    return true;
  });

  shape(font, buffer, features);
  return trace;
}

/**
 * Return the HarfBuzz version.
 * @returns An object with major, minor, and micro version numbers.
 */
export function version(): { major: number; minor: number; micro: number } {
  const sp = Module.stackSave();
  const versionPtr = Module.stackAlloc(12);
  exports.hb_version(versionPtr, versionPtr + 4, versionPtr + 8);
  const ver = {
    major: Module.HEAPU32[versionPtr / 4],
    minor: Module.HEAPU32[(versionPtr + 4) / 4],
    micro: Module.HEAPU32[(versionPtr + 8) / 4],
  };
  Module.stackRestore(sp);
  return ver;
}

/**
 * Return the HarfBuzz version as a string.
 * @returns A version string in the form "major.minor.micro".
 */
export function version_string(): string {
  const versionPtr = exports.hb_version_string();
  return _utf8_ptr_to_string(versionPtr);
}

/**
 * Convert an OpenType script tag to HarfBuzz script.
 * @param tag The tag to convert.
 * @returns The script.
 */
export function otTagToScript(tag: string): string {
  const hbTag = _hb_tag(tag);
  const script = exports.hb_ot_tag_to_script(hbTag);
  return _hb_untag(script);
}

/**
 * Convert an OpenType language tag to HarfBuzz language.
 * @param tag The tag to convert.
 * @returns The language.
 */
export function otTagToLanguage(tag: string): string {
  const hbTag = _hb_tag(tag);
  const language = exports.hb_ot_tag_to_language(hbTag);
  return _language_to_string(language);
}
