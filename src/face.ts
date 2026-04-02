import {
  Module,
  exports,
  STATIC_ARRAY_SIZE,
  hb_tag,
  hb_untag,
  utf16_ptr_to_string,
  language_to_string,
  language_from_string,
  typed_array_from_set,
} from "./helpers";
import type { AxisInfo, NameEntry, FeatureNameIds } from "./types";
import type { Blob } from "./blob";

const HB_OT_NAME_ID_INVALID = 0xffff;

export enum GlyphClass {
  UNCLASSIFIED = 0,
  BASE_GLYPH = 1,
  LIGATURE = 2,
  MARK = 3,
  COMPONENT = 4,
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
    const blob = exports.hb_face_reference_table(this.ptr, hb_tag(table));
    const length = exports.hb_blob_get_length(blob);
    if (!length) {
      return;
    }
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
      result[hb_untag(Module.HEAPU32[axis / 4 + i * 8 + 1])] = {
        min: Module.HEAPF32[axis / 4 + i * 8 + 4],
        default: Module.HEAPF32[axis / 4 + i * 8 + 5],
        max: Module.HEAPF32[axis / 4 + i * 8 + 6],
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
    const result = typed_array_from_set(unicodeSetPtr);
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
    const tableTag = hb_tag(table);
    let startOffset = 0;
    let scriptCount = STATIC_ARRAY_SIZE;
    const scriptCountPtr = Module.stackAlloc(4);
    const scriptTagsPtr = Module.stackAlloc(STATIC_ARRAY_SIZE * 4);
    const tags: string[] = [];
    while (scriptCount == STATIC_ARRAY_SIZE) {
      Module.HEAPU32[scriptCountPtr / 4] = scriptCount;
      exports.hb_ot_layout_table_get_script_tags(
        this.ptr,
        tableTag,
        startOffset,
        scriptCountPtr,
        scriptTagsPtr,
      );
      scriptCount = Module.HEAPU32[scriptCountPtr / 4];
      const scriptTags = Module.HEAPU32.subarray(
        scriptTagsPtr / 4,
        scriptTagsPtr / 4 + scriptCount,
      );
      tags.push(...Array.from(scriptTags as Uint32Array).map(hb_untag));
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
    const tableTag = hb_tag(table);
    let startOffset = 0;
    let featureCount = STATIC_ARRAY_SIZE;
    const featureCountPtr = Module.stackAlloc(4);
    const featureTagsPtr = Module.stackAlloc(STATIC_ARRAY_SIZE * 4);
    const tags: string[] = [];
    while (featureCount == STATIC_ARRAY_SIZE) {
      Module.HEAPU32[featureCountPtr / 4] = featureCount;
      exports.hb_ot_layout_table_get_feature_tags(
        this.ptr,
        tableTag,
        startOffset,
        featureCountPtr,
        featureTagsPtr,
      );
      featureCount = Module.HEAPU32[featureCountPtr / 4];
      const featureTags = Module.HEAPU32.subarray(
        featureTagsPtr / 4,
        featureTagsPtr / 4 + featureCount,
      );
      tags.push(...Array.from(featureTags as Uint32Array).map(hb_untag));
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
    const tableTag = hb_tag(table);
    let startOffset = 0;
    let languageCount = STATIC_ARRAY_SIZE;
    const languageCountPtr = Module.stackAlloc(4);
    const languageTagsPtr = Module.stackAlloc(STATIC_ARRAY_SIZE * 4);
    const tags: string[] = [];
    while (languageCount == STATIC_ARRAY_SIZE) {
      Module.HEAPU32[languageCountPtr / 4] = languageCount;
      exports.hb_ot_layout_script_get_language_tags(
        this.ptr,
        tableTag,
        scriptIndex,
        startOffset,
        languageCountPtr,
        languageTagsPtr,
      );
      languageCount = Module.HEAPU32[languageCountPtr / 4];
      const languageTags = Module.HEAPU32.subarray(
        languageTagsPtr / 4,
        languageTagsPtr / 4 + languageCount,
      );
      tags.push(...Array.from(languageTags as Uint32Array).map(hb_untag));
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
  getLanguageFeatureTags(
    table: string,
    scriptIndex: number,
    languageIndex: number,
  ): string[] {
    const sp = Module.stackSave();
    const tableTag = hb_tag(table);
    let startOffset = 0;
    let featureCount = STATIC_ARRAY_SIZE;
    const featureCountPtr = Module.stackAlloc(4);
    const featureTagsPtr = Module.stackAlloc(STATIC_ARRAY_SIZE * 4);
    const tags: string[] = [];
    while (featureCount == STATIC_ARRAY_SIZE) {
      Module.HEAPU32[featureCountPtr / 4] = featureCount;
      exports.hb_ot_layout_language_get_feature_tags(
        this.ptr,
        tableTag,
        scriptIndex,
        languageIndex,
        startOffset,
        featureCountPtr,
        featureTagsPtr,
      );
      featureCount = Module.HEAPU32[featureCountPtr / 4];
      const featureTags = Module.HEAPU32.subarray(
        featureTagsPtr / 4,
        featureTagsPtr / 4 + featureCount,
      );
      tags.push(...Array.from(featureTags as Uint32Array).map(hb_untag));
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
        nameId: Module.HEAPU32[entriesPtr / 4 + i * 3],
        language: language_to_string(
          Module.HEAPU32[entriesPtr / 4 + i * 3 + 2],
        ),
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
    const languagePtr = language_from_string(language);
    const nameLen =
      exports.hb_ot_name_get_utf16(this.ptr, nameId, languagePtr, 0, 0) + 1;
    const textSizePtr = Module.stackAlloc(4);
    const textPtr = exports.malloc(nameLen * 2);
    Module.HEAPU32[textSizePtr / 4] = nameLen;
    exports.hb_ot_name_get_utf16(
      this.ptr,
      nameId,
      languagePtr,
      textSizePtr,
      textPtr,
    );
    const name = utf16_ptr_to_string(textPtr, nameLen - 1);
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
  getFeatureNameIds(
    table: string,
    featureIndex: number,
  ): FeatureNameIds | null {
    const sp = Module.stackSave();
    const tableTag = hb_tag(table);
    const labelIdPtr = Module.stackAlloc(4);
    const tooltipIdPtr = Module.stackAlloc(4);
    const sampleIdPtr = Module.stackAlloc(4);
    const numNamedParametersPtr = Module.stackAlloc(4);
    const firstParameterIdPtr = Module.stackAlloc(4);

    const found = exports.hb_ot_layout_feature_get_name_ids(
      this.ptr,
      tableTag,
      featureIndex,
      labelIdPtr,
      tooltipIdPtr,
      sampleIdPtr,
      numNamedParametersPtr,
      firstParameterIdPtr,
    );

    let names: FeatureNameIds | null = null;
    if (found) {
      const uiLabelNameId = Module.HEAPU32[labelIdPtr / 4];
      const uiTooltipTextNameId = Module.HEAPU32[tooltipIdPtr / 4];
      const sampleTextNameId = Module.HEAPU32[sampleIdPtr / 4];
      const numNamedParameters = Module.HEAPU32[numNamedParametersPtr / 4];
      const firstParameterId = Module.HEAPU32[firstParameterIdPtr / 4];
      const paramUiLabelNameIds = Array.from(
        { length: numNamedParameters },
        (_: number, i: number) => firstParameterId + i,
      );
      names = {
        uiLabelNameId:
          uiLabelNameId == HB_OT_NAME_ID_INVALID ? null : uiLabelNameId,
        uiTooltipTextNameId:
          uiTooltipTextNameId == HB_OT_NAME_ID_INVALID
            ? null
            : uiTooltipTextNameId,
        sampleTextNameId:
          sampleTextNameId == HB_OT_NAME_ID_INVALID ? null : sampleTextNameId,
        paramUiLabelNameIds: paramUiLabelNameIds,
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
