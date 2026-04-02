import {
  Module,
  exports,
  hb_tag,
  hb_untag,
  utf8_ptr_to_string,
  string_to_ascii_ptr,
  language_to_string,
} from "./helpers";
import type { TraceEntry } from "./types";
import type { Font } from "./font";
import {
  Buffer,
  BufferContentType,
  BufferSerializeFormat,
  BufferSerializeFlag,
} from "./buffer";

export enum TracePhase {
  DONT_STOP = 0,
  GSUB = 1,
  GPOS = 2,
}

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
    featureList.forEach((feature) => {
      const str = string_to_ascii_ptr(feature);
      if (
        exports.hb_feature_from_string(
          str.ptr,
          -1,
          featuresPtr + featuresLen * 16,
        )
      )
        featuresLen++;
      str.free();
    });
  }

  exports.hb_shape(font.ptr, buffer.ptr, featuresPtr, featuresLen);
  if (featuresPtr) exports.free(featuresPtr);
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
 * @param stop_phase The {@link TracePhase} at which to stop shaping.
 * @returns An array of trace entries, each with a message, serialized glyphs, and phase info.
 */
export function shapeWithTrace(
  font: Font,
  buffer: Buffer,
  features: string,
  stop_at: number,
  stop_phase: TracePhase,
): TraceEntry[] {
  const trace: TraceEntry[] = [];
  let currentPhase = TracePhase.DONT_STOP;
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

    const traceBuf = buffer.serialize(
      font,
      0,
      null,
      BufferSerializeFormat.JSON,
      BufferSerializeFlag.NO_GLYPH_NAMES,
    );

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
  return utf8_ptr_to_string(versionPtr);
}

/**
 * Convert an OpenType script tag to HarfBuzz script.
 * @param tag The tag to convert.
 * @returns The script.
 */
export function otTagToScript(tag: string): string {
  const hbTag = hb_tag(tag);
  const script = exports.hb_ot_tag_to_script(hbTag);
  return hb_untag(script);
}

/**
 * Convert an OpenType language tag to HarfBuzz language.
 * @param tag The tag to convert.
 * @returns The language.
 */
export function otTagToLanguage(tag: string): string {
  const hbTag = hb_tag(tag);
  const language = exports.hb_ot_tag_to_language(hbTag);
  return language_to_string(language);
}
