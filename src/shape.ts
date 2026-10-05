import {
  Module,
  exports,
  hb_tag,
  hb_untag,
  utf8_ptr_to_string,
  string_to_ascii_ptr,
  language_to_string,
  type ValueOf,
} from "./helpers";
import type { TraceEntry } from "./types";
import type { Font } from "./font";
import type { Feature } from "./feature";
import {
  Buffer,
  BufferContentType,
  BufferSerializeFormat,
  BufferSerializeFlag,
} from "./buffer";

export const TracePhase = {
  DONT_STOP: 0,
  GSUB: 1,
  GPOS: 2,
} as const;
export type TracePhase = ValueOf<typeof TracePhase>;

/**
 * Shape a buffer with a given font.
 *
 * Converts the Unicode text in the buffer into positioned glyphs.
 * The buffer is modified in place.
 *
 * @param font The Font to shape with.
 * @param buffer The Buffer containing text to shape, suitably prepared
 *   (text added, segment properties set).
 * @param features An array of {@link Feature} values to apply.
 */
export function shape(font: Font, buffer: Buffer, features?: Feature[]): void {
  const featuresLen = features?.length ?? 0;
  const sp = Module.stackSave();
  let featuresPtr = 0;
  if (featuresLen) {
    featuresPtr = Module.stackAlloc(16 * featuresLen);
    features!.forEach((feature, i) => {
      feature.writeTo(featuresPtr + i * 16);
    });
  }
  exports.hb_shape(font.ptr, buffer.ptr, featuresPtr, featuresLen);
  Module.stackRestore(sp);
}

/**
 * Shape a buffer with a given font, returning a JSON trace of the shaping process.
 *
 * This function supports "partial shaping", where the shaping process is
 * terminated after a given lookup ID is reached.
 *
 * @param font The Font to shape with.
 * @param buffer The Buffer containing text to shape, suitably prepared.
 * @param features An array of {@link Feature} values to apply.
 * @param stop_at A lookup ID at which to terminate shaping.
 * @param stop_phase The {@link TracePhase} at which to stop shaping.
 * @returns An array of trace entries, each with a message, serialized glyphs, and phase info.
 */
export function shapeWithTrace(
  font: Font,
  buffer: Buffer,
  features: Feature[],
  stop_at: number,
  stop_phase: TracePhase,
): TraceEntry[] {
  const trace: TraceEntry[] = [];
  let currentPhase: TracePhase = TracePhase.DONT_STOP;
  let stopping = false;

  buffer.setMessageFunc((buffer, font, message) => {
    if (message.startsWith("start table GSUB")) currentPhase = TracePhase.GSUB;
    else if (message.startsWith("start table GPOS"))
      currentPhase = TracePhase.GPOS;

    if (currentPhase != stop_phase) stopping = false;

    if (
      stop_phase != TracePhase.DONT_STOP &&
      currentPhase == stop_phase &&
      message.startsWith("end lookup " + stop_at)
    )
      stopping = true;

    if (stopping) return false;

    const traceBuf = buffer.serialize({
      font,
      format: BufferSerializeFormat.JSON,
      flags: BufferSerializeFlag.NO_GLYPH_NAMES,
    });

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
export function versionString(): string {
  const versionPtr = exports.hb_version_string();
  return utf8_ptr_to_string(versionPtr);
}

/**
 * Convert an OpenType script tag to HarfBuzz script (ISO 15924).
 * @param tag The tag to convert.
 * @returns The script.
 */
export function otTagToScript(tag: string): string {
  const hbTag = hb_tag(tag);
  const script = exports.hb_ot_tag_to_script(hbTag);
  return hb_untag(script);
}

/**
 * Convert an OpenType language tag to HarfBuzz language (BCP 47).
 * @param tag The tag to convert.
 * @returns The language.
 */
export function otTagToLanguage(tag: string): string {
  const hbTag = hb_tag(tag);
  const language = exports.hb_ot_tag_to_language(hbTag);
  return language_to_string(language);
}

/** https://harfbuzz.github.io/harfbuzz-hb-ot-layout.html#HB-OT-MAX-TAGS-PER-LANGUAGE:CAPS */
const HB_OT_MAX_TAGS_PER_LANGUAGE = 3;
/** https://harfbuzz.github.io/harfbuzz-hb-ot-layout.html#HB-OT-MAX-TAGS-PER-SCRIPT:CAPS */
const HB_OT_MAX_TAGS_PER_SCRIPT = 3;

/**
 * Convert a HarfBuzz script (ISO 15924) and a HarfBuzz language (BCP 47) to OpenType script tags and OpenType language tags.
 * @param script A HarfBuzz script to convert.
 * @param language A HarfBuzz language to convert.
 * @returns An object with the OpenType script tags and the OpenType language tags.
 */
export function otTagsFromScriptAndLanguage(
  script: string,
  language: string,
): {
  scriptTags: string[];
  languageTags: string[];
} {
  const sp = Module.stackSave();
  const scriptStr = string_to_ascii_ptr(script);
  const languageStr = string_to_ascii_ptr(language);
  const scriptCountPtr = Module.stackAlloc(4);
  Module.HEAPU32[scriptCountPtr / 4] = HB_OT_MAX_TAGS_PER_SCRIPT;
  const scriptTagsPtr = Module.stackAlloc(HB_OT_MAX_TAGS_PER_SCRIPT * 4);
  const languageCountPtr = Module.stackAlloc(4);
  Module.HEAPU32[languageCountPtr / 4] = HB_OT_MAX_TAGS_PER_LANGUAGE;
  const languageTagsPtr = Module.stackAlloc(HB_OT_MAX_TAGS_PER_LANGUAGE * 4);
  exports.hb_ot_tags_from_script_and_language(
    exports.hb_script_from_string(scriptStr.ptr, -1),
    exports.hb_language_from_string(languageStr.ptr, -1),
    scriptCountPtr,
    scriptTagsPtr,
    languageCountPtr,
    languageTagsPtr,
  );
  scriptStr.free();
  languageStr.free();
  const scriptTags = Module.HEAPU32.subarray(
    scriptTagsPtr / 4,
    scriptTagsPtr / 4 + Module.HEAPU32[scriptCountPtr / 4],
  );
  const languageTags = Module.HEAPU32.subarray(
    languageTagsPtr / 4,
    languageTagsPtr / 4 + Module.HEAPU32[languageCountPtr / 4],
  );
  Module.stackRestore(sp);
  return {
    scriptTags: [...scriptTags].map(hb_untag),
    languageTags: [...languageTags].map(hb_untag),
  };
}

/**
 * Convert an OpenType script tag and an OpenType language tag to a HarfBuzz script (ISO 15924) and a HarfBuzz language (BCP 47).
 * @param scriptTag An OpenType script tag.
 * @param languageTag An OpenType language tag.
 * @returns An object with the HarfBuzz script and the HarfBuzz language.
 */
export function otTagsToScriptAndLanguage(
  scriptTag: string,
  languageTag: string,
): {
  script: string | undefined;
  language: string | undefined;
} {
  const sp = Module.stackSave();
  const scriptPtr = Module.stackAlloc(4);
  const languagePtr = Module.stackAlloc(4);
  exports.hb_ot_tags_to_script_and_language(
    hb_tag(scriptTag),
    hb_tag(languageTag),
    scriptPtr,
    languagePtr,
  );
  const script = Module.HEAPU32[scriptPtr / 4];
  const language = Module.HEAPU32[languagePtr / 4];
  Module.stackRestore(sp);
  return {
    script: hb_untag(script),
    language: language_to_string(language),
  };
}
