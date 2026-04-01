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
  codepoint: number;
  cluster: number;
}

export interface GlyphPosition {
  x_advance: number;
  y_advance: number;
  x_offset: number;
  y_offset: number;
}

export interface JsonGlyph {
  g: number;
  cl: number;
  ax: number;
  ay: number;
  dx: number;
  dy: number;
  flags: number;
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

export interface Blob {
  ptr: number;
  destroy(): void;
}

export interface Face {
  ptr: number;
  upem: number;
  reference_table(table: string): Uint8Array | undefined;
  getAxisInfos(): Record<string, AxisInfo>;
  collectUnicodes(): Uint32Array;
  getTableScriptTags(table: string): string[];
  getTableFeatureTags(table: string): string[];
  getScriptLanguageTags(table: string, scriptIndex: number): string[];
  getLanguageFeatureTags(table: string, scriptIndex: number, languageIndex: number): string[];
  getGlyphClass(glyph: number): string | undefined;
  listNames(): NameEntry[];
  getName(nameId: number, language: string): string;
  getFeatureNameIds(table: string, featureIndex: number): FeatureNameIds | null;
  destroy(): void;
}

export interface Font {
  ptr: number;
  subFont(): Font;
  hExtents(): FontExtents;
  vExtents(): FontExtents;
  glyphName(glyphId: number): string;
  glyphToPath(glyphId: number): string;
  glyphHAdvance(glyphId: number): number;
  glyphVAdvance(glyphId: number): number;
  glyphHOrigin(glyphId: number): [number, number] | null;
  glyphVOrigin(glyphId: number): [number, number] | null;
  glyphExtents(glyphId: number): GlyphExtents | null;
  glyphFromName(name: string): number | null;
  glyphToJson(glyphId: number): SvgPathCommand[];
  setScale(xScale: number, yScale: number): void;
  setVariations(variations: Record<string, number>): void;
  setFuncs(fontFuncs: FontFuncs): void;
  destroy(): void;
}

export interface FontFuncs {
  ptr: number;
  setGlyphExtentsFunc(func: (font: Font, glyph: number) => GlyphExtents | null): void;
  setGlyphFromNameFunc(func: (font: Font, name: string) => number | null): void;
  setGlyphHAdvanceFunc(func: (font: Font, glyph: number) => number): void;
  setGlyphVAdvanceFunc(func: (font: Font, glyph: number) => number): void;
  setGlyphHOriginFunc(func: (font: Font, glyph: number) => [number, number] | null): void;
  setGlyphVOriginFunc(func: (font: Font, glyph: number) => [number, number] | null): void;
  setGlyphHKerningFunc(func: (font: Font, firstGlyph: number, secondGlyph: number) => number): void;
  setGlyphNameFunc(func: (font: Font, glyph: number) => string | null): void;
  setNominalGlyphFunc(func: (font: Font, unicode: number) => number | null): void;
  setVariationGlyphFunc(func: (font: Font, unicode: number, variationSelector: number) => number | null): void;
  setFontHExtentsFunc(func: (font: Font) => FontExtents | null): void;
  setFontVExtentsFunc(func: (font: Font) => FontExtents | null): void;
  destroy(): void;
}

export interface Buffer {
  ptr: number;
  addText(text: string, itemOffset?: number, itemLength?: number | null): void;
  addCodePoints(codePoints: number[], itemOffset?: number, itemLength?: number | null): void;
  guessSegmentProperties(): void;
  setDirection(dir: string): void;
  setFlags(flags: string[]): void;
  setLanguage(language: string): void;
  setScript(script: string): void;
  setClusterLevel(level: number): void;
  reset(): void;
  clearContents(): void;
  setMessageFunc(func: (buffer: Buffer, font: Font, message: string) => boolean): void;
  getLength(): number;
  getGlyphInfos(): GlyphInfo[];
  getGlyphPositions(): GlyphPosition[];
  getGlyphInfosAndPositions(): Record<string, unknown>[];
  updateGlyphPositions(positions: GlyphPosition[]): void;
  serialize(font?: Font | null, start?: number, end?: number | null, format?: string, flags?: string[]): string;
  getContentType(): string;
  json(): JsonGlyph[];
  destroy(): void;
}

export interface HarfBuzzJS {
  createBlob(blob: ArrayBuffer): Blob;
  createFace(blob: Blob, index: number): Face;
  createFont(face: Face | null, existingPtr?: number): Font;
  createFontFuncs(): FontFuncs;
  createBuffer(existingPtr?: number): Buffer;
  shape(font: Font, buffer: Buffer, features?: string): void;
  shapeWithTrace(font: Font, buffer: Buffer, features: string, stop_at: number, stop_phase: number): TraceEntry[];
  version(): { major: number; minor: number; micro: number };
  version_string(): string;
  otTagToScript(tag: string): string;
  otTagToLanguage(tag: string): string;
}

export default function hbjs(Module: any): HarfBuzzJS {
  'use strict';

  var exports = Module.wasmExports;
  var utf8Decoder = new TextDecoder("utf8");
  var utf8Encoder = new TextEncoder();

  var freeFuncPtr = Module.addFunction(function (ptr: number) { exports.free(ptr); }, 'vi');

  const TRACE_PHASE_DONT_STOP = 0;
  const TRACE_PHASE_GSUB = 1;
  const TRACE_PHASE_GPOS = 2;

  const STATIC_ARRAY_SIZE = 128

  const HB_MEMORY_MODE_WRITABLE = 2;
  const HB_SET_VALUE_INVALID = -1;
  const HB_OT_NAME_ID_INVALID = 0xFFFF;

  const bufferContentType: Record<number, string> = {
    0: "INVALID",
    1: "UNICODE",
    2: "GLYPHS",
  };

  const bufferSerializeFlags: Record<string, number> = {
    "DEFAULT": 0x00000000,
    "NO_CLUSTERS": 0x00000001,
    "NO_POSITIONS": 0x00000002,
    "NO_GLYPH_NAMES": 0x00000004,
    "GLYPH_EXTENTS": 0x00000008,
    "GLYPH_FLAGS": 0x00000010,
    "NO_ADVANCES": 0x00000020,
  };

  const bufferFlags: Record<string, number> = {
    "DEFAULT": 0x00000000,
    "BOT": 0x00000001,
    "EOT": 0x00000002,
    "PRESERVE_DEFAULT_IGNORABLES": 0x00000004,
    "REMOVE_DEFAULT_IGNORABLES": 0x00000008,
    "DO_NOT_INSERT_DOTTED_CIRCLE": 0x00000010,
    "VERIFY": 0x00000020,
    "PRODUCE_UNSAFE_TO_CONCAT": 0x00000040,
    "PRODUCE_SAFE_TO_INSERT_TATWEEL": 0x00000080,
  };

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
    let end = ptr / 2 + length;
    return String.fromCharCode.apply(null, Array.from(Module.HEAPU16.subarray(ptr / 2, end)));
  }

  /**
  * Use when you know the input range should be ASCII.
  * Faster than encoding to UTF-8
  **/
  function _string_to_ascii_ptr(text: string): StringPtr {
    const ptr = exports.malloc(text.length + 1);
    for (let i = 0; i < text.length; ++i) {
      const char = text.charCodeAt(i);
      if (char > 127) throw new Error('Expected ASCII text');
      Module.HEAPU8[ptr + i] = char;
    }
    Module.HEAPU8[ptr + text.length] = 0;
    return {
      ptr: ptr,
      length: text.length,
      free: function () { exports.free(ptr); }
    };
  }

  function _string_to_utf8_ptr(text: string): StringPtr {
    const ptr = exports.malloc(text.length);
    utf8Encoder.encodeInto(text, Module.HEAPU8.subarray(ptr, ptr + text.length));
    return {
      ptr: ptr,
      length: text.length,
      free: function () { exports.free(ptr); }
    };
  }

  function _string_to_utf16_ptr(text: string): StringPtr {
    const ptr = exports.malloc(text.length * 2);
    const words = Module.HEAPU16.subarray(ptr / 2, ptr / 2 + text.length);
    for (let i = 0; i < words.length; ++i) words[i] = text.charCodeAt(i);
    return {
      ptr: ptr,
      length: words.length,
      free: function () { exports.free(ptr); }
    };
  }

  function _language_to_string(language: number): string {
    var ptr = exports.hb_language_to_string(language);
    return _utf8_ptr_to_string(ptr);
  }

  function _language_from_string(str: string): number {
    var languageStr = _string_to_ascii_ptr(str);
    var languagePtr = exports.hb_language_from_string(languageStr.ptr, -1);
    languageStr.free();
    return languagePtr;
  }

  /**
  * Create an object representing a Harfbuzz blob.
  * @param {string} blob A blob of binary data (usually the contents of a font file).
  **/
  function createBlob(blob: ArrayBuffer): Blob {
    var blobPtr = exports.malloc(blob.byteLength);
    Module.HEAPU8.set(new Uint8Array(blob), blobPtr);
    var ptr = exports.hb_blob_create(blobPtr, blob.byteLength, HB_MEMORY_MODE_WRITABLE, blobPtr, freeFuncPtr);
    return {
      ptr: ptr,
      /**
      * Free the object.
      */
      destroy: function () { exports.hb_blob_destroy(ptr); }
    };
  }

  /**
   * Return the typed array of HarfBuzz set contents.
   * @param {number} setPtr Pointer of set
   * @returns {Uint32Array} Typed array instance
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

  /**
  * Create an object representing a Harfbuzz face.
  * @param {object} blob An object returned from `createBlob`.
  * @param {number} index The index of the font in the blob. (0 for most files,
  *  or a 0-indexed font number if the `blob` came form a TTC/OTC file.)
  **/
  function createFace(blob: Blob, index: number): Face {
    var ptr = exports.hb_face_create(blob.ptr, index);
    const upem = exports.hb_face_get_upem(ptr);
    return {
      ptr: ptr,
      upem,
      /**
       * Return the binary contents of an OpenType table.
       * @param {string} table Table name
       */
      reference_table: function (table: string): Uint8Array | undefined {
        var blob = exports.hb_face_reference_table(ptr, _hb_tag(table));
        var length = exports.hb_blob_get_length(blob);
        if (!length) { return; }
        var blobptr = exports.hb_blob_get_data(blob, 0);
        var table_string = Module.HEAPU8.subarray(blobptr, blobptr + length);
        return table_string;
      },
      /**
       * Return variation axis infos
       */
      getAxisInfos: function (): Record<string, AxisInfo> {
        var sp = Module.stackSave();
        var axis = Module.stackAlloc(64 * 32);
        var c = Module.stackAlloc(4);
        Module.HEAPU32[c / 4] = 64;
        exports.hb_ot_var_get_axis_infos(ptr, 0, c, axis);
        var result: Record<string, AxisInfo> = {};
        Array.from({ length: Module.HEAPU32[c / 4] }).forEach(function (_, i) {
          result[_hb_untag(Module.HEAPU32[axis / 4 + i * 8 + 1])] = {
            min: Module.HEAPF32[axis / 4 + i * 8 + 4],
            default: Module.HEAPF32[axis / 4 + i * 8 + 5],
            max: Module.HEAPF32[axis / 4 + i * 8 + 6]
          };
        });
        Module.stackRestore(sp);
        return result;
      },
      /**
       * Return unicodes the face supports
       */
      collectUnicodes: function (): Uint32Array {
        var unicodeSetPtr = exports.hb_set_create();
        exports.hb_face_collect_unicodes(ptr, unicodeSetPtr);
        var result = _typed_array_from_set(unicodeSetPtr);
        exports.hb_set_destroy(unicodeSetPtr);
        return result;
      },
      /**
       * Return all scripts enumerated in the specified face's
       * GSUB table or GPOS table.
       * @param {string} table: The table to query, either "GSUB" or "GPOS".
       **/
      getTableScriptTags: function (table: string): string[] {
        var sp = Module.stackSave();
        var tableTag = _hb_tag(table);
        var startOffset = 0;
        var scriptCount = STATIC_ARRAY_SIZE;
        var scriptCountPtr = Module.stackAlloc(4);
        var scriptTagsPtr = Module.stackAlloc(STATIC_ARRAY_SIZE * 4);
        var tags: string[] = [];
        while (scriptCount == STATIC_ARRAY_SIZE) {
          Module.HEAPU32[scriptCountPtr / 4] = scriptCount;
          exports.hb_ot_layout_table_get_script_tags(ptr, tableTag, startOffset,
            scriptCountPtr, scriptTagsPtr);
          scriptCount = Module.HEAPU32[scriptCountPtr / 4];
          var scriptTags = Module.HEAPU32.subarray(scriptTagsPtr / 4,
            scriptTagsPtr / 4 + scriptCount);
          tags.push(...Array.from(scriptTags as Uint32Array).map(_hb_untag));
          startOffset += scriptCount;
        }
        Module.stackRestore(sp);
        return tags;
      },
      /**
       * Return all features enumerated in the specified face's
       * GSUB table or GPOS table.
       * @param {string} table: The table to query, either "GSUB" or "GPOS".
       **/
      getTableFeatureTags: function (table: string): string[] {
        var sp = Module.stackSave();
        var tableTag = _hb_tag(table);
        var startOffset = 0;
        var featureCount = STATIC_ARRAY_SIZE;
        var featureCountPtr = Module.stackAlloc(4);
        var featureTagsPtr = Module.stackAlloc(STATIC_ARRAY_SIZE * 4);
        var tags: string[] = [];
        while (featureCount == STATIC_ARRAY_SIZE) {
          Module.HEAPU32[featureCountPtr / 4] = featureCount;
          exports.hb_ot_layout_table_get_feature_tags(ptr, tableTag, startOffset,
            featureCountPtr, featureTagsPtr);
          featureCount = Module.HEAPU32[featureCountPtr / 4];
          var scriptTags = Module.HEAPU32.subarray(featureTagsPtr / 4,
            featureTagsPtr / 4 + featureCount);
          tags.push(...Array.from(scriptTags as Uint32Array).map(_hb_untag));
          startOffset += featureCount;
        }
        Module.stackRestore(sp);
        return tags;

      },
      /**
       * Return language tags in the given face's GSUB or GPOS table, underneath
       * the specified script index.
       * @param {string} table: The table to query, either "GSUB" or "GPOS".
       * @param {number} scriptIndex: The index of the script to query.
       **/
      getScriptLanguageTags: function (table: string, scriptIndex: number): string[] {
        var sp = Module.stackSave();
        var tableTag = _hb_tag(table);
        var startOffset = 0;
        var languageCount = STATIC_ARRAY_SIZE;
        var languageCountPtr = Module.stackAlloc(4);
        var languageTagsPtr = Module.stackAlloc(STATIC_ARRAY_SIZE * 4);
        var tags: string[] = [];
        while (languageCount == STATIC_ARRAY_SIZE) {
          Module.HEAPU32[languageCountPtr / 4] = languageCount;
          exports.hb_ot_layout_script_get_language_tags(ptr, tableTag, scriptIndex, startOffset,
            languageCountPtr, languageTagsPtr);
          languageCount = Module.HEAPU32[languageCountPtr / 4];
          var languageTags = Module.HEAPU32.subarray(languageTagsPtr / 4,
            languageTagsPtr / 4 + languageCount);
          tags.push(...Array.from(languageTags as Uint32Array).map(_hb_untag));
          startOffset += languageCount;
        }
        Module.stackRestore(sp);
        return tags;
      },
      /**
       * Return all features in the specified face's GSUB table or GPOS table,
       * underneath the specified script and language.
       * @param {string} table: The table to query, either "GSUB" or "GPOS".
       * @param {number} scriptIndex: The index of the script to query.
       * @param {number} languageIndex: The index of the language to query.
       **/
      getLanguageFeatureTags: function (table: string, scriptIndex: number, languageIndex: number): string[] {
        var sp = Module.stackSave();
        var tableTag = _hb_tag(table);
        var startOffset = 0;
        var featureCount = STATIC_ARRAY_SIZE;
        var featureCountPtr = Module.stackAlloc(4);
        var featureTagsPtr = Module.stackAlloc(STATIC_ARRAY_SIZE * 4);
        var tags: string[] = [];
        while (featureCount == STATIC_ARRAY_SIZE) {
          Module.HEAPU32[featureCountPtr / 4] = featureCount;
          exports.hb_ot_layout_language_get_feature_tags(ptr, tableTag, scriptIndex, languageIndex, startOffset,
            featureCountPtr, featureTagsPtr);
          featureCount = Module.HEAPU32[featureCountPtr / 4];
          var featureTags = Module.HEAPU32.subarray(featureTagsPtr / 4,
            featureTagsPtr / 4 + featureCount);
          tags.push(...Array.from(featureTags as Uint32Array).map(_hb_untag));
          startOffset += featureCount;
        }
        Module.stackRestore(sp);
        return tags;
      },
      /**
       * Get the GDEF class of the requested glyph.
       * @param {number} glyph The glyph to get the class of.
       * @returns {string} The class of the glyph. Which can be either
       *   UNCLASSIFIED, BASE_GLYPH, LIGATURE, MARK, or COMPONENT.
       **/
      getGlyphClass: function (glyph: number): string | undefined {
        const gclass = exports.hb_ot_layout_get_glyph_class(ptr, glyph);
        switch (gclass) {
          case 0:
            return 'UNCLASSIFIED';
          case 1:
            return 'BASE_GLYPH';
          case 2:
            return 'LIGATURE';
          case 3:
            return 'MARK';
          case 4:
            return 'COMPONENT';
        }
      },
      /**
       * Return all names in the specified face's name table.
       **/
      listNames: function (): NameEntry[] {
        var sp = Module.stackSave();
        var numEntriesPtr = Module.stackAlloc(4);
        var entriesPtr = exports.hb_ot_name_list_names(ptr, numEntriesPtr);
        var numEntries = Module.HEAPU32[numEntriesPtr / 4];
        var entries: NameEntry[] = [];
        for (var i = 0; i < numEntries; i++) {
          // FIXME: this depends on the struct memory layout.
          // A more robust way would involve ading helper C functions to access
          // the struct and use them here.
          entries.push({
            nameId: Module.HEAPU32[(entriesPtr / 4) + (i * 3)],
            language: _language_to_string(Module.HEAPU32[(entriesPtr / 4) + (i * 3) + 2])
          });
        }
        Module.stackRestore(sp);
        return entries;
      },
      /**
       * Get the name of the specified face.
       * @param {number} nameId The ID of the name to get.
       * @param {string} language The language of the name to get.
       **/
      getName: function (nameId: number, language: string): string {
        var sp = Module.stackSave();
        var languagePtr = _language_from_string(language);
        var nameLen = exports.hb_ot_name_get_utf16(ptr, nameId, languagePtr, 0, 0) + 1;
        var textSizePtr = Module.stackAlloc(4);
        var textPtr = exports.malloc(nameLen * 2);
        Module.HEAPU32[textSizePtr / 4] = nameLen;
        exports.hb_ot_name_get_utf16(ptr, nameId, languagePtr, textSizePtr, textPtr);
        var name = _utf16_ptr_to_string(textPtr, nameLen - 1);
        exports.free(textPtr);
        Module.stackRestore(sp);
        return name;
      },
      /**
       * Get the name IDs of the specified feature.
       * @param {string} table The table to query, either "GSUB" or "GPOS".
       * @param {number} featureIndex The index of the feature to query.
       **/
      getFeatureNameIds: function (table: string, featureIndex: number): FeatureNameIds | null {
        var sp = Module.stackSave();
        var tableTag = _hb_tag(table);
        var labelIdPtr = Module.stackAlloc(4);
        var tooltipIdPtr = Module.stackAlloc(4);
        var sampleIdPtr = Module.stackAlloc(4);
        var numNamedParametersPtr = Module.stackAlloc(4);
        var firstParameterIdPtr = Module.stackAlloc(4);

        var found = exports.hb_ot_layout_feature_get_name_ids(ptr, tableTag, featureIndex,
          labelIdPtr, tooltipIdPtr, sampleIdPtr, numNamedParametersPtr, firstParameterIdPtr);

        var names: FeatureNameIds | null = null;
        if (found) {
          let uiLabelNameId = Module.HEAPU32[labelIdPtr / 4];
          let uiTooltipTextNameId = Module.HEAPU32[tooltipIdPtr / 4];
          let sampleTextNameId = Module.HEAPU32[sampleIdPtr / 4];
          let numNamedParameters = Module.HEAPU32[numNamedParametersPtr / 4];
          let firstParameterId = Module.HEAPU32[firstParameterIdPtr / 4];
          let paramUiLabelNameIds = Array(numNamedParameters).fill(0).map((_: number, i: number) => firstParameterId + i);
          names = {
            uiLabelNameId: uiLabelNameId == HB_OT_NAME_ID_INVALID ? null : uiLabelNameId,
            uiTooltipTextNameId: uiTooltipTextNameId == HB_OT_NAME_ID_INVALID ? null : uiTooltipTextNameId,
            sampleTextNameId: sampleTextNameId == HB_OT_NAME_ID_INVALID ? null : sampleTextNameId,
            paramUiLabelNameIds: paramUiLabelNameIds
          };
        }

        Module.stackRestore(sp);
        return names;
      },
      /**
       * Free the object.
       */
      destroy: function () {
        exports.hb_face_destroy(ptr);
      },
    };
  }

  var pathBuffer = "";

  /**
  * Create an object representing a Harfbuzz font.
  * @param {object} blob An object returned from `createFace`.
  * @param {number} ptr Optional pointer to an existing font.
  **/
  function createFont(face: Face | null, existingPtr?: number): Font {
    var ptr = existingPtr ? exports.hb_font_reference(existingPtr) : exports.hb_font_create(face!.ptr);
    var drawFuncsPtr: number | null = null;
    var moveToPtr: number | null = null;
    var lineToPtr: number | null = null;
    var cubicToPtr: number | null = null;
    var quadToPtr: number | null = null;
    var closePathPtr: number | null = null;

    /**
    * Return a glyph as an SVG path string.
    * @param {number} glyphId ID of the requested glyph in the font.
    **/
    function glyphToPath(glyphId: number): string {
      if (!drawFuncsPtr) {
        var moveTo = function (dfuncs: number, draw_data: number, draw_state: number, to_x: number, to_y: number, user_data: number) {
          pathBuffer += `M${to_x},${to_y}`;
        }
        var lineTo = function (dfuncs: number, draw_data: number, draw_state: number, to_x: number, to_y: number, user_data: number) {
          pathBuffer += `L${to_x},${to_y}`;
        }
        var cubicTo = function (dfuncs: number, draw_data: number, draw_state: number, c1_x: number, c1_y: number, c2_x: number, c2_y: number, to_x: number, to_y: number, user_data: number) {
          pathBuffer += `C${c1_x},${c1_y} ${c2_x},${c2_y} ${to_x},${to_y}`;
        }
        var quadTo = function (dfuncs: number, draw_data: number, draw_state: number, c_x: number, c_y: number, to_x: number, to_y: number, user_data: number) {
          pathBuffer += `Q${c_x},${c_y} ${to_x},${to_y}`;
        }
        var closePath = function (dfuncs: number, draw_data: number, draw_state: number, user_data: number) {
          pathBuffer += 'Z';
        }

        moveToPtr = Module.addFunction(moveTo, 'viiiffi');
        lineToPtr = Module.addFunction(lineTo, 'viiiffi');
        cubicToPtr = Module.addFunction(cubicTo, 'viiiffffffi');
        quadToPtr = Module.addFunction(quadTo, 'viiiffffi');
        closePathPtr = Module.addFunction(closePath, 'viiii');
        drawFuncsPtr = exports.hb_draw_funcs_create();
        exports.hb_draw_funcs_set_move_to_func(drawFuncsPtr, moveToPtr, 0, 0);
        exports.hb_draw_funcs_set_line_to_func(drawFuncsPtr, lineToPtr, 0, 0);
        exports.hb_draw_funcs_set_cubic_to_func(drawFuncsPtr, cubicToPtr, 0, 0);
        exports.hb_draw_funcs_set_quadratic_to_func(drawFuncsPtr, quadToPtr, 0, 0);
        exports.hb_draw_funcs_set_close_path_func(drawFuncsPtr, closePathPtr, 0, 0);
      }

      pathBuffer = "";
      exports.hb_font_draw_glyph(ptr, glyphId, drawFuncsPtr, 0);
      return pathBuffer;
    }

    /**
     * Return glyph name.
     * @param {number} glyphId ID of the requested glyph in the font.
     **/
    function glyphName(glyphId: number): string {
      var sp = Module.stackSave();
      var strSize = 256;
      var strPtr = Module.stackAlloc(strSize);
      exports.hb_font_glyph_to_string(ptr, glyphId, strPtr, strSize);
      var name = _utf8_ptr_to_string(strPtr);
      Module.stackRestore(sp);
      return name;
    }

    return {
      ptr: ptr,
      /**
       * Create a sub font.
       * @returns {object} Object representing the sub font.
       **/
      subFont: function (): Font {
        return createFont(null, exports.hb_font_create_sub_font(ptr));
      },
      /**
       * Return font horizontal extents.
       * @returns {object} Object with ascender, descender, and lineGap properties.
       **/
      hExtents: function (): FontExtents {
        var sp = Module.stackSave();
        var extentsPtr = Module.stackAlloc(48);
        exports.hb_font_get_h_extents(ptr, extentsPtr);
        var extents = {
          ascender: Module.HEAP32[extentsPtr / 4],
          descender: Module.HEAP32[extentsPtr / 4 + 1],
          lineGap: Module.HEAP32[extentsPtr / 4 + 2],
        };
        Module.stackRestore(sp);
        return extents;
      },
      /**
       * Return font vertical extents.
       * @returns {object} Object with ascender, descender, and lineGap properties.
       **/
      vExtents: function (): FontExtents {
        var sp = Module.stackSave();
        var extentsPtr = Module.stackAlloc(48);
        exports.hb_font_get_v_extents(ptr, extentsPtr);
        var extents = {
          ascender: Module.HEAP32[extentsPtr / 4],
          descender: Module.HEAP32[extentsPtr / 4 + 1],
          lineGap: Module.HEAP32[extentsPtr / 4 + 2],
        };
        Module.stackRestore(sp);
        return extents;
      },
      glyphName: glyphName,
      glyphToPath: glyphToPath,
      /**
       * Return glyph horizontal advance.
       * @param {number} glyphId ID of the requested glyph in the font.
       **/
      glyphHAdvance: function (glyphId: number): number {
        return exports.hb_font_get_glyph_h_advance(ptr, glyphId);
      },
      /**
       * Return glyph vertical advance.
       * @param {number} glyphId ID of the requested glyph in the font.
       **/
      glyphVAdvance: function (glyphId: number): number {
        return exports.hb_font_get_glyph_v_advance(ptr, glyphId);
      },
      /**
       * Return glyph horizontal origin.
       * @param {number} glyphId ID of the requested glyph in the font.
       **/
      glyphHOrigin: function (glyphId: number): [number, number] | null {
        var sp = Module.stackSave();
        let xPtr = Module.stackAlloc(4);
        let yPtr = Module.stackAlloc(4);
        let origin: [number, number] | null = null;
        if (exports.hb_font_get_glyph_h_origin(ptr, glyphId, xPtr, yPtr)) {
          origin = [Module.HEAP32[xPtr / 4], Module.HEAP32[yPtr / 4]];
        }
        Module.stackRestore(sp);
        return origin;
      },
      /**
       * Return glyph vertical origin.
       * @param {number} glyphId ID of the requested glyph in the font.
       **/
      glyphVOrigin: function (glyphId: number): [number, number] | null {
        var sp = Module.stackSave();
        let xPtr = Module.stackAlloc(4);
        let yPtr = Module.stackAlloc(4);
        let origin: [number, number] | null = null;
        if (exports.hb_font_get_glyph_v_origin(ptr, glyphId, xPtr, yPtr)) {
          origin = [Module.HEAP32[xPtr / 4], Module.HEAP32[yPtr / 4]];
        }
        Module.stackRestore(sp);
        return origin;
      },
      /**
       * Return glyph extents.
       * @param {number} glyphId ID of the requested glyph in the font.
       **/
      glyphExtents: function (glyphId: number): GlyphExtents | null {
        var sp = Module.stackSave();
        var extentsPtr = Module.stackAlloc(16);
        var extents: GlyphExtents | null = null;
        if (exports.hb_font_get_glyph_extents(ptr, glyphId, extentsPtr)) {
          extents = {
            xBearing: Module.HEAP32[extentsPtr / 4],
            yBearing: Module.HEAP32[extentsPtr / 4 + 1],
            width: Module.HEAP32[extentsPtr / 4 + 2],
            height: Module.HEAP32[extentsPtr / 4 + 3]
          };
        }
        Module.stackRestore(sp);
        return extents;
      },
      /**
       * Return glyph ID from name.
       * @param {string} name Name of the requested glyph in the font.
       **/
      glyphFromName: function (name: string): number | null {
        var sp = Module.stackSave();
        var glyphIdPtr = Module.stackAlloc(4);
        var namePtr = _string_to_utf8_ptr(name);
        var glyphId: number | null = null;
        if (exports.hb_font_get_glyph_from_name(ptr, namePtr.ptr, namePtr.length, glyphIdPtr)) {
          glyphId = Module.HEAPU32[glyphIdPtr / 4];
        }
        namePtr.free();
        Module.stackRestore(sp);
        return glyphId;
      },
      /**
      * Return a glyph as a JSON path string
      * based on format described on https://svgwg.org/specs/paths/#InterfaceSVGPathSegment
      * @param {number} glyphId ID of the requested glyph in the font.
      **/
      glyphToJson: function (glyphId: number): SvgPathCommand[] {
        var path = glyphToPath(glyphId);
        return path.replace(/([MLQCZ])/g, '|$1 ').split('|').filter(function (x) { return x.length; }).map(function (x) {
          var row = x.split(/[ ,]/g);
          return { type: row[0], values: row.slice(1).filter(function (x) { return x.length; }).map(function (x) { return +x; }) };
        });
      },
      /**
      * Set the font's scale factor, affecting the position values returned from
      * shaping.
      * @param {number} xScale Units to scale in the X dimension.
      * @param {number} yScale Units to scale in the Y dimension.
      **/
      setScale: function (xScale: number, yScale: number): void {
        exports.hb_font_set_scale(ptr, xScale, yScale);
      },
      /**
       * Set the font's variations.
       * @param {object} variations Dictionary of variations to set
       **/
      setVariations: function (variations: Record<string, number>): void {
        var entries = Object.entries(variations);
        var vars = exports.malloc(8 * entries.length);
        entries.forEach(function (entry, i) {
          Module.HEAPU32[vars / 4 + i * 2 + 0] = _hb_tag(entry[0]);
          Module.HEAPF32[vars / 4 + i * 2 + 1] = entry[1];
        });
        exports.hb_font_set_variations(ptr, vars, entries.length);
        exports.free(vars);
      },
      /**
      * Set the font's font functions.
      * @param {object} fontFuncs The font functions.
      **/
      setFuncs: function (fontFuncs: FontFuncs): void {
        exports.hb_font_set_funcs(ptr, fontFuncs.ptr);
      },
      /**
      * Free the object.
      */
      destroy: function (): void {
        exports.hb_font_destroy(ptr);
        if (drawFuncsPtr) {
          exports.hb_draw_funcs_destroy(drawFuncsPtr);
          drawFuncsPtr = null;
          Module.removeFunction(moveToPtr!);
          Module.removeFunction(lineToPtr!);
          Module.removeFunction(cubicToPtr!);
          Module.removeFunction(quadToPtr!);
          Module.removeFunction(closePathPtr!);
        }
      }
    };
  }

  /**
  * Create a object representing a HarfBuzz font functions.
  **/
  function createFontFuncs(): FontFuncs {
    var ptr = exports.hb_font_funcs_create();
    return {
      ptr: ptr,
      /**
      * Set the font's glyph extents function.
      * @param {function} func The function to set.
      *
      * The function takes the following arguments:
      * @param {object} font The font.
      * @param {number} glyph The glyph ID.
      *
      * The function should return an object with the following properties, or null on failure:
      * @param {number} xBearing The x bearing of the glyph.
      * @param {number} yBearing The y bearing of the glyph.
      * @param {number} width The width of the glyph.
      * @param {number} height The height of the glyph.
      **/
      setGlyphExtentsFunc: function (func: (font: Font, glyph: number) => GlyphExtents | null): void {
        let funcPtr = Module.addFunction(function (fontPtr: number, font_data: number, glyph: number, extentsPtr: number, user_data: number) {
          let font = createFont(null, fontPtr);
          let extents = func(font, glyph);
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
        exports.hb_font_funcs_set_glyph_extents_func(ptr, funcPtr, 0, 0);
      },
      /**
      * Set the font's glyph from name function.
      * @param {function} func The function to set.
      *
      * The function takes the following arguments:
      * @param {object} font The font.
      * @param {string} name The glyph name.
      *
      * The function should return an object with the following properties, or null on failure:
      * @param {number} glyph The glyph ID.
      **/
      setGlyphFromNameFunc: function (func: (font: Font, name: string) => number | null): void {
        let funcPtr = Module.addFunction(function (fontPtr: number, font_data: number, namePtr: number, len: number, glyphPtr: number, user_data: number) {
          let font = createFont(null, fontPtr);
          let name = _utf8_ptr_to_string(namePtr, len);
          let glyph = func(font, name);
          font.destroy();
          if (glyph) {
            Module.HEAPU32[glyphPtr / 4] = glyph;
            return 1;
          }
          return 0;
        }, 'ipppipp');
        exports.hb_font_funcs_set_glyph_from_name_func(ptr, funcPtr, 0, 0);
      },
      /**
      * Set the font's glyph horizontal advance function.
      * @param {function} func The function to set.
      *
      * The function takes the following arguments:
      * @param {object} font The font.
      * @param {number} glyph The glyph ID.
      *
      * The function should return the horizontal advance of the glyph.
      **/
      setGlyphHAdvanceFunc: function (func: (font: Font, glyph: number) => number): void {
        let funcPtr = Module.addFunction(function (fontPtr: number, font_data: number, glyph: number, user_data: number) {
          let font = createFont(null, fontPtr);
          let advance = func(font, glyph);
          font.destroy();
          return advance;
        }, 'ippip');
        exports.hb_font_funcs_set_glyph_h_advance_func(ptr, funcPtr, 0, 0);
      },
      /**
      * Set the font's glyph vertical advance function.
      * @param {function} func The function to set.
      *
      * The function takes the following arguments:
      * @param {object} font The font.
      * @param {number} glyph The glyph ID.
      *
      * The function should return the vertical advance of the glyph.
      **/
      setGlyphVAdvanceFunc: function (func: (font: Font, glyph: number) => number): void {
        let funcPtr = Module.addFunction(function (fontPtr: number, font_data: number, glyph: number, user_data: number) {
          let font = createFont(null, fontPtr);
          let advance = func(font, glyph);
          font.destroy();
          return advance;
        }, 'ippip');
        exports.hb_font_funcs_set_glyph_v_advance_func(ptr, funcPtr, 0, 0);
      },
      /**
      * Set the font's glyph horizontal origin function.
      * @param {function} func The function to set.
      *
      * The function takes the following arguments:
      * @param {object} font The font.
      * @param {number} glyph The glyph ID.
      *
      * The function should return the x and y horizontal origin of the glyph, or null on failure.
      **/
      setGlyphHOriginFunc: function (func: (font: Font, glyph: number) => [number, number] | null): void {
        let funcPtr = Module.addFunction(function (fontPtr: number, font_data: number, glyph: number, xPtr: number, yPtr: number, user_data: number) {
          let font = createFont(null, fontPtr);
          let origin = func(font, glyph);
          font.destroy();
          if (origin) {
            Module.HEAP32[xPtr / 4] = origin[0];
            Module.HEAP32[yPtr / 4] = origin[1];
            return 1;
          }
          return 0;
        }, 'ippippp');
        exports.hb_font_funcs_set_glyph_h_origin_func(ptr, funcPtr, 0, 0);
      },
      /**
      * Set the font's glyph vertical origin function.
      * @param {function} func The function to set.
      *
      * The function takes the following arguments:
      * @param {object} font The font.
      * @param {number} glyph The glyph ID.
      *
      * The function should return the x and y vertical origin of the glyph, or null on failure.
      **/
      setGlyphVOriginFunc: function (func: (font: Font, glyph: number) => [number, number] | null): void {
        let funcPtr = Module.addFunction(function (fontPtr: number, font_data: number, glyph: number, xPtr: number, yPtr: number, user_data: number) {
          let font = createFont(null, fontPtr);
          let origin = func(font, glyph);
          font.destroy();
          if (origin) {
            Module.HEAP32[xPtr / 4] = origin[0];
            Module.HEAP32[yPtr / 4] = origin[1];
            return 1;
          }
          return 0;
        }, 'ippippp');
        exports.hb_font_funcs_set_glyph_v_origin_func(ptr, funcPtr, 0, 0);
      },
      /**
      * Set the font's glyph horizontal kerning function.
      * @param {function} func The function to set.
      *
      * The function takes the following arguments:
      * @param {object} font The font.
      * @param {number} firstGlyph The first glyph ID.
      * @param {number} secondGlyph The second glyph ID.
      *
      * The function should return the horizontal kerning of the glyphs.
      **/
      setGlyphHKerningFunc: function (func: (font: Font, firstGlyph: number, secondGlyph: number) => number): void {
        let funcPtr = Module.addFunction(function (fontPtr: number, font_data: number, firstGlyph: number, secondGlyph: number, user_data: number) {
          let font = createFont(null, fontPtr);
          let kerning = func(font, firstGlyph, secondGlyph);
          font.destroy();
          return kerning;
        }, 'ippiip');
        exports.hb_font_funcs_set_glyph_h_kerning_func(ptr, funcPtr, 0, 0);
      },
      /**
      * Set the font's glyph name function.
      * @param {function} func The function to set.
      *
      * The function takes the following arguments:
      * @param {object} font The font.
      * @param {number} glyph The glyph ID.
      *
      * The function should return the name of the glyph, or null on failure.
      **/
      setGlyphNameFunc: function (func: (font: Font, glyph: number) => string | null): void {
        let funcPtr = Module.addFunction(function (fontPtr: number, font_data: number, glyph: number, namePtr: number, size: number, user_data: number) {
          let font = createFont(null, fontPtr);
          let name = func(font, glyph);
          font.destroy();
          if (name) {
            utf8Encoder.encodeInto(name, Module.HEAPU8.subarray(namePtr, namePtr + size));
            return 1;
          }
          return 0;
        }, 'ippipip');
        exports.hb_font_funcs_set_glyph_name_func(ptr, funcPtr, 0, 0);
      },
      /**
      * Set the font's nominal glyph function.
      * @param {function} func The function to set.
      *
      * The function takes the following arguments:
      * @param {object} font The font.
      * @param {number} unicode The unicode.
      *
      * The function should return the nominal glyph of the unicode, or null on failure.
      **/
      setNominalGlyphFunc: function (func: (font: Font, unicode: number) => number | null): void {
        let funcPtr = Module.addFunction(function (fontPtr: number, font_data: number, unicode: number, glyphPtr: number, user_data: number) {
          let font = createFont(null, fontPtr);
          let glyph = func(font, unicode);
          font.destroy();
          if (glyph) {
            Module.HEAPU32[glyphPtr / 4] = glyph;
            return 1;
          }
          return 0;
        }, 'ippipp');
        exports.hb_font_funcs_set_nominal_glyph_func(ptr, funcPtr, 0, 0);
      },
      /**
      * Set the font's variation glyph function.
      * @param {function} func The function to set.
      *
      * The function takes the following arguments:
      * @param {object} font The font.
      * @param {number} unicode The unicode.
      * @param {number} variationSelector The variation selector.
      *
      * The function should return the variation glyph of the unicode, or null on failure.
      **/
      setVariationGlyphFunc: function (func: (font: Font, unicode: number, variationSelector: number) => number | null): void {
        let funcPtr = Module.addFunction(function (fontPtr: number, font_data: number, unicode: number, variationSelector: number, glyphPtr: number, user_data: number) {
          let font = createFont(null, fontPtr);
          let glyph = func(font, unicode, variationSelector);
          font.destroy();
          if (glyph) {
            Module.HEAPU32[glyphPtr / 4] = glyph;
            return 1;
          }
          return 0;
        }, 'ippiipp');
        exports.hb_font_funcs_set_variation_glyph_func(ptr, funcPtr, 0, 0);
      },
      /**
      * Set the font's horizontal extents function.
      * @param {function} func The function to set.
      *
      * The function takes the following arguments:
      * @param {object} font The font.
      *
      * The function should return an object with the following properties, or null on failure:
      * @param {number} ascender The ascender of the font.
      * @param {number} descender The descender of the font.
      * @param {number} lineGap The line gap of the font.
      **/
      setFontHExtentsFunc: function (func: (font: Font) => FontExtents | null): void {
        let funcPtr = Module.addFunction(function (fontPtr: number, font_data: number, extentsPtr: number, user_data: number) {
          let font = createFont(null, fontPtr);
          let extents = func(font);
          font.destroy();
          if (extents) {
            Module.HEAP32[extentsPtr / 4] = extents.ascender;
            Module.HEAP32[extentsPtr / 4 + 1] = extents.descender;
            Module.HEAP32[extentsPtr / 4 + 2] = extents.lineGap;
            return 1;
          }
          return 0;
        }, 'ipppp');
        exports.hb_font_funcs_set_font_h_extents_func(ptr, funcPtr, 0, 0);
      },
      /**
      * Set the font's vertical extents function.
      * @param {function} func The function to set.
      *
      * The function takes the following arguments:
      * @param {object} font The font.
      *
      * The function should return an object with the following properties, or null on failure:
      * @param {number} ascender The ascender of the font.
      * @param {number} descender The descender of the font.
      * @param {number} lineGap The line gap of the font.
      **/
      setFontVExtentsFunc: function (func: (font: Font) => FontExtents | null): void {
        let funcPtr = Module.addFunction(function (fontPtr: number, font_data: number, extentsPtr: number, user_data: number) {
          let font = createFont(null, fontPtr);
          let extents = func(font);
          font.destroy();
          if (extents) {
            Module.HEAP32[extentsPtr / 4] = extents.ascender;
            Module.HEAP32[extentsPtr / 4 + 1] = extents.descender;
            Module.HEAP32[extentsPtr / 4 + 2] = extents.lineGap;
            return 1;
          }
          return 0;
        }, 'ipppp');
        exports.hb_font_funcs_set_font_v_extents_func(ptr, funcPtr, 0, 0);
      },
      destroy: function (): void {
        exports.hb_font_funcs_destroy(ptr);
      }
    };
  }

  /**
  * Create an object representing a Harfbuzz buffer.
  * @param {number} ptr Optional. The pointer to the buffer.
  **/
  function createBuffer(existingPtr?: number): Buffer {
    var ptr = existingPtr ? exports.hb_buffer_reference(existingPtr) : exports.hb_buffer_create();
    return {
      ptr: ptr,
      /**
      * Add text to the buffer.
      * @param {string} text Text to be added to the buffer.
      * @param {number} itemOffset Optional. The offset of the first character to add to the buffer.
      * @param {number} itemLength Optional. The number of characters to add to the buffer, or null for the end of text.
      **/
      addText: function (text: string, itemOffset: number = 0, itemLength: number | null = null): void {
        const str = _string_to_utf16_ptr(text);
        if (itemLength == null) itemLength = str.length;
        exports.hb_buffer_add_utf16(ptr, str.ptr, str.length, itemOffset, itemLength);
        str.free();
      },
      /**
      * Add code points to the buffer.
      * @param {number[]} codePoints Array of code points to be added to the buffer.
      * @param {number} itemOffset Optional. The offset of the first code point to add to the buffer.
      * @param {number} itemLength Optional. The number of code points to add to the buffer, or null for the end of the array.
      */
      addCodePoints: function (codePoints: number[], itemOffset: number = 0, itemLength: number | null = null): void {
        let codePointsPtr = exports.malloc(codePoints.length * 4);
        let codePointsArray = Module.HEAPU32.subarray(codePointsPtr / 4, codePointsPtr / 4 + codePoints.length);
        codePointsArray.set(codePoints);
        if (itemLength == null) itemLength = codePoints.length;
        exports.hb_buffer_add_codepoints(ptr, codePointsPtr, codePoints.length, itemOffset, itemLength);
        exports.free(codePointsPtr);
      },
      /**
      * Set buffer script, language and direction.
      *
      * This needs to be done before shaping.
      **/
      guessSegmentProperties: function (): void {
        exports.hb_buffer_guess_segment_properties(ptr);
      },
      /**
      * Set buffer direction explicitly.
      * @param {string} direction: One of "ltr", "rtl", "ttb" or "btt"
      */
      setDirection: function (dir: string): void {
        exports.hb_buffer_set_direction(ptr, ({
          ltr: 4,
          rtl: 5,
          ttb: 6,
          btt: 7
        } as Record<string, number>)[dir] || 0);
      },
      /**
      * Set buffer flags explicitly.
      * @param {string[]} flags: A list of strings which may be either:
      * "DEFAULT"
      * "BOT"
      * "EOT"
      * "PRESERVE_DEFAULT_IGNORABLES"
      * "REMOVE_DEFAULT_IGNORABLES"
      * "DO_NOT_INSERT_DOTTED_CIRCLE"
      * "VERIFY"
      * "PRODUCE_UNSAFE_TO_CONCAT"
      * "PRODUCE_SAFE_TO_INSERT_TATWEEL"
      */
      setFlags: function (flags: string[]): void {
        var flagsValue = 0
        flags.forEach(s => flagsValue |= bufferFlags[s] || 0);
        exports.hb_buffer_set_flags(ptr, flagsValue);
      },
      /**
      * Set buffer language explicitly.
      * @param {string} language: The buffer language
      */
      setLanguage: function (language: string): void {
        var str = _string_to_ascii_ptr(language);
        exports.hb_buffer_set_language(ptr, exports.hb_language_from_string(str.ptr, -1));
        str.free();
      },
      /**
      * Set buffer script explicitly.
      * @param {string} script: The buffer script
      */
      setScript: function (script: string): void {
        var str = _string_to_ascii_ptr(script);
        exports.hb_buffer_set_script(ptr, exports.hb_script_from_string(str.ptr, -1));
        str.free();
      },
      /**
      * Set the Harfbuzz clustering level.
      *
      * Affects the cluster values returned from shaping.
      * @param {number} level: Clustering level. See the Harfbuzz manual chapter
      * on Clusters.
      **/
      setClusterLevel: function (level: number): void {
        exports.hb_buffer_set_cluster_level(ptr, level)
      },
      /**
      * Reset the buffer to its initial status.
      **/
      reset: function (): void {
        exports.hb_buffer_reset(ptr);
      },
      /**
      * Similar to reset(), but does not clear the Unicode functions and the
      * replacement code point.
      **/
      clearContents: function (): void {
        exports.hb_buffer_clear_contents(ptr);
      },
      /**
      * Set message func.
      * @param {function} func The function to set.
      *
      * The function should accept three arguments:
      * @param {object} buffer The buffer
      * @param {object} font The font
      * @param {string} message The message
      *
      * Returning false from this function will skip this shaping step and move to the next one.
      */
      setMessageFunc: function (func: (buffer: Buffer, font: Font, message: string) => boolean): void {
        var traceFunc = function (bufferPtr: number, fontPtr: number, messagePtr: number, user_data: number) {
          var message = _utf8_ptr_to_string(messagePtr);
          var buffer = createBuffer(bufferPtr);
          var font = createFont(null, fontPtr);
          var result = func(buffer, font, message);
          buffer.destroy();
          font.destroy();
          return result ? 1 : 0;
        }
        var traceFuncPtr = Module.addFunction(traceFunc, 'iiiii');
        exports.hb_buffer_set_message_func(ptr, traceFuncPtr, 0, 0);
      },
      /**
      * Get the the number of items in the buffer.
      * @returns {number} The buffer length.
      */
      getLength: function (): number {
        return exports.hb_buffer_get_length(ptr);
      },
      /**
      * Get the glyph information from the buffer.
      * @returns {object[]} The glyph information.
      *
      * The glyph information is returned as an array of objects with the
      * following properties:
      * @param {number} codepoint either a Unicode code point (before shaping) or a glyph index (after shaping).
      * @param {number} cluster The cluster index of the glyph.
      */
      getGlyphInfos: function (): GlyphInfo[] {
        var infosPtr32 = exports.hb_buffer_get_glyph_infos(ptr, 0) / 4;
        // hb_glyph_info_t struct: { codepoint, mask, cluster, var1, var2 } (5 uint32s)
        var infosArray = Module.HEAPU32.subarray(infosPtr32, infosPtr32 + this.getLength() * 5);
        var infos: GlyphInfo[] = [];
        for (var i = 0; i < infosArray.length; i += 5) {
          infos.push({
            codepoint: infosArray[i],
            cluster: infosArray[i + 2],
          });
        }
        return infos;
      },
      /**
      * Get the glyph positions from the buffer.
      * @returns {object[]} The glyph positions.
      *
      * The glyph positions are returned as an array of objects with the
      * following properties:
      * @param {number} x_advance The x advance of the glyph.
      * @param {number} y_advance The y advance of the glyph.
      * @param {number} x_offset The x offset of the glyph.
      * @param {number} y_offset The y offset of the glyph.
      *
      */
      getGlyphPositions: function (): GlyphPosition[] {
        var positionsPtr32 = exports.hb_buffer_get_glyph_positions(ptr, 0) / 4;
        if (positionsPtr32 == 0) {
          return [];
        }
        // hb_glyph_position_t struct: { x_advance, y_advance, x_offset, y_offset, var } (5 int32s)
        var positionsArray = Module.HEAP32.subarray(positionsPtr32, positionsPtr32 + this.getLength() * 5);
        var positions: GlyphPosition[] = [];
        for (var i = 0; i < positionsArray.length; i += 5) {
          positions.push({
            x_advance: positionsArray[i],
            y_advance: positionsArray[i + 1],
            x_offset: positionsArray[i + 2],
            y_offset: positionsArray[i + 3],
          });
        }
        return positions;
      },
      /**
      * Get the glyph information and positions from the buffer.
      * @returns {object[]} The glyph information and positions.
      *
      * The glyph information is returned as an array of objects with the
      * properties from getGlyphInfos and getGlyphPositions combined.
      */
      getGlyphInfosAndPositions: function (): Record<string, unknown>[] {
        var infosPtr32 = exports.hb_buffer_get_glyph_infos(ptr, 0) / 4;
        var infosArray = Module.HEAPU32.subarray(infosPtr32, infosPtr32 + this.getLength() * 5);

        var positionsPtr32 = exports.hb_buffer_get_glyph_positions(ptr, 0) / 4;
        var positionsArray = positionsPtr32 ? Module.HEAP32.subarray(positionsPtr32, positionsPtr32 + this.getLength() * 5) : null;

        var out: Record<string, unknown>[] = [];
        for (var i = 0; i < infosArray.length; i += 5) {
          var info: Record<string, unknown> = {
            codepoint: infosArray[i],
            cluster: infosArray[i + 2],
          };
          for (var [name, idx] of [['mask', 1], ['var1', 3], ['var2', 4]] as [string, number][]) {
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
      },
      /**
      * Update the glyph positions in the buffer.
      * @param {object[]} positions The new glyph positions.
      *
      * WARNING: Do not use unless you know what you are doing.
      */
      updateGlyphPositions: function (positions: GlyphPosition[]): void {
        var positionsPtr32 = exports.hb_buffer_get_glyph_positions(ptr, 0) / 4;
        if (positionsPtr32 == 0) {
          return;
        }
        var len = Math.min(positions.length, this.getLength());
        var positionsArray = Module.HEAP32.subarray(positionsPtr32, positionsPtr32 + len * 5);
        for (var i = 0; i < len; i++) {
          positionsArray[i * 5] = positions[i].x_advance;
          positionsArray[i * 5 + 1] = positions[i].y_advance;
          positionsArray[i * 5 + 2] = positions[i].x_offset;
          positionsArray[i * 5 + 3] = positions[i].y_offset;
        }
      },
      /**
      * Serialize the buffer contents to a string.
      * @param {object} font Optional. The font to use for serialization.
      * @param {number} start Optional. The starting index of the glyphs to serialize.
      * @param {number} end Optional. The ending index of the glyphs to serialize.
      * @param {string} format Optional. The format to serialize the buffer contents to.
      * @param {string[]} flags Optional. The flags to use for serialization. A list of strings which may be either:
      * "DEFAULT"
      * "NO_CLUSTERS"
      * "NO_POSITIONS"
      * "NO_GLYPH_NAMES"
      * "GLYPH_EXTENTS"
      * "GLYPH_FLAGS"
      * "NO_ADVANCES"
      *
      * @returns {string} The serialized buffer contents.
      */
      serialize: function (font?: Font | null, start: number = 0, end: number | null = null, format: string = "TEXT", flags: string[] = []): string {
        var sp = Module.stackSave();
        if (end == null) end = this.getLength();
        var bufLen = 32 * 1024;
        var bufPtr = exports.malloc(bufLen);
        var bufConsumedPtr = Module.stackAlloc(4);
        var flagsValue = 0;
        flags.forEach(flag => flagsValue |= bufferSerializeFlags[flag] || 0);
        var result = "";
        while (start < end) {
          start += exports.hb_buffer_serialize(ptr, start, end,
            bufPtr, bufLen, bufConsumedPtr,
            font ? font.ptr : 0, _hb_tag(format), flagsValue);
          var bufConsumed = Module.HEAPU32[bufConsumedPtr / 4];
          if (bufConsumed == 0) break;
          result += _utf8_ptr_to_string(bufPtr, bufConsumed);
        }
        exports.free(bufPtr);
        Module.stackRestore(sp);
        return result;
      },
      /**
      * Return the buffer content type.
      *
      * @returns {string} The buffer content type. One of:
      * "INVALID"
      * "UNICODE"
      * "GLYPHS"
      */
      getContentType: function (): string {
        return bufferContentType[exports.hb_buffer_get_content_type(ptr)];
      },
      /**
      * Return the buffer contents as a JSON object.
      *
      * After shaping, this function will return an array of glyph information
      * objects. Each object will have the following attributes:
      *
      *   - g: The glyph ID
      *   - cl: The cluster ID
      *   - ax: Advance width (width to advance after this glyph is painted)
      *   - ay: Advance height (height to advance after this glyph is painted)
      *   - dx: X displacement (adjustment in X dimension when painting this glyph)
      *   - dy: Y displacement (adjustment in Y dimension when painting this glyph)
      *   - flags: Glyph flags like `HB_GLYPH_FLAG_UNSAFE_TO_BREAK` (0x1)
      **/
      json: function (): JsonGlyph[] {
        var buf = this.serialize(null, 0, null, "JSON", ["NO_GLYPH_NAMES", "GLYPH_FLAGS"]);
        var json = JSON.parse(buf);
        // For backward compatibility, as harfbuzz uses 'fl' for flags but earlier
        // we were doing the serialization ourselves and used 'flags'.
        json.forEach(function (glyph: Record<string, unknown>) {
          glyph.flags = glyph.fl || 0;
          delete glyph.fl;
        });
        return json;
      },
      /**
      * Free the object.
      */
      destroy: function (): void { exports.hb_buffer_destroy(ptr); }
    };
  }

  /**
  * Shape a buffer with a given font.
  *
  * This returns nothing, but modifies the buffer.
  *
  * @param {object} font: A font returned from `createFont`
  * @param {object} buffer: A buffer returned from `createBuffer` and suitably
  *   prepared.
  * @param {object} features: A string of comma-separated OpenType features to apply.
  */
  function shape(font: Font, buffer: Buffer, features?: string): void {
    var featuresPtr = 0;
    var featuresLen = 0;
    if (features) {
      var featureList = features.split(",");
      featuresPtr = exports.malloc(16 * featureList.length);
      featureList.forEach(function (feature) {
        var str = _string_to_ascii_ptr(feature);
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
  * terminated after a given lookup ID is reached. If the user requests the function
  * to terminate shaping after an ID in the GSUB phase, GPOS table lookups will be
  * processed as normal.
  *
  * @param {object} font: A font returned from `createFont`
  * @param {object} buffer: A buffer returned from `createBuffer` and suitably
  *   prepared.
  * @param {object} features: A string of comma-separated OpenType features to apply.
  * @param {number} stop_at: A lookup ID at which to terminate shaping.
  * @param {number} stop_phase: Either 0 (don't terminate shaping), 1 (`stop_at`
      refers to a lookup ID in the GSUB table), 2 (`stop_at` refers to a lookup
      ID in the GPOS table).
  */
  function shapeWithTrace(font: Font, buffer: Buffer, features: string, stop_at: number, stop_phase: number): TraceEntry[] {
    var trace: TraceEntry[] = [];
    var currentPhase = TRACE_PHASE_DONT_STOP;
    var stopping = false;
    var failure = false;

    buffer.setMessageFunc((buffer: Buffer, font: Font, message: string) => {
      if (message.startsWith("start table GSUB"))
        currentPhase = TRACE_PHASE_GSUB;
      else if (message.startsWith("start table GPOS"))
        currentPhase = TRACE_PHASE_GPOS;

      if (currentPhase != stop_phase)
        stopping = false;

      if (failure)
        return true;

      if (stop_phase != TRACE_PHASE_DONT_STOP && currentPhase == stop_phase && message.startsWith("end lookup " + stop_at))
        stopping = true;

      if (stopping)
        return false;

      var traceBuf = buffer.serialize(font, 0, null, "JSON", ["NO_GLYPH_NAMES"]);

      trace.push({
        m: message,
        t: JSON.parse(traceBuf),
        glyphs: buffer.getContentType() == "GLYPHS",
      });

      return true;
    });

    shape(font, buffer, features);
    return trace;
  }

  function version(): { major: number; minor: number; micro: number } {
    var sp = Module.stackSave();
    var versionPtr = Module.stackAlloc(12);
    exports.hb_version(versionPtr, versionPtr + 4, versionPtr + 8);
    var ver = {
      major: Module.HEAPU32[versionPtr / 4],
      minor: Module.HEAPU32[(versionPtr + 4) / 4],
      micro: Module.HEAPU32[(versionPtr + 8) / 4],
    };
    Module.stackRestore(sp);
    return ver;
  }

  function version_string(): string {
    var versionPtr = exports.hb_version_string();
    return _utf8_ptr_to_string(versionPtr);
  }

  /**
   * Convert an OpenType script tag to HarfBuzz script.
   * @param {string} tag: The tag to convert.
   * @returns {string}: The script.
   */
  function otTagToScript(tag: string): string {
    var hbTag = _hb_tag(tag);
    var script = exports.hb_ot_tag_to_script(hbTag);
    return _hb_untag(script);
  }

  /**
   * Convert an OpenType language tag to HarfBuzz language.
   * @param {string} tag: The tag to convert.
   * @returns {string}: The language.
   */
  function otTagToLanguage(tag: string): string {
    var hbTag = _hb_tag(tag);
    var language = exports.hb_ot_tag_to_language(hbTag);
    return _language_to_string(language);
  }

  return {
    createBlob: createBlob,
    createFace: createFace,
    createFont: createFont,
    createFontFuncs: createFontFuncs,
    createBuffer: createBuffer,
    shape: shape,
    shapeWithTrace: shapeWithTrace,
    version: version,
    version_string: version_string,
    otTagToScript: otTagToScript,
    otTagToLanguage: otTagToLanguage,
  };
}
