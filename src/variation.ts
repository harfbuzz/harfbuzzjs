import {
  Module,
  exports,
  hb_tag,
  hb_untag,
  string_to_ascii_ptr,
  utf8_ptr_to_string,
} from "./helpers";

/**
 * A {@link https://harfbuzz.github.io/harfbuzz-hb-common.html#hb-variation-t | HarfBuzz variation}.
 *
 * Data type for holding variation data. Registered OpenType variation-axis
 * tags are listed in
 * {@link https://docs.microsoft.com/en-us/typography/opentype/spec/dvaraxisreg | OpenType Axis Tag Registry}.
 */
export class Variation {
  /** The tag of the variation-axis name. */
  tag: string;
  /** The value of the variation axis. */
  value: number;

  constructor(tag: string, value: number = 0) {
    this.tag = tag;
    this.value = value;
  }

  /**
   * Parses a string into a Variation.
   *
   * The format for specifying variation settings follows. All valid CSS
   * font-variation-settings values other than `normal` and `inherited` are
   * also accepted, though, not documented below.
   *
   * The format is a tag, optionally followed by an equals sign, followed by a
   * number. For example `wght=500`, or `slnt=-7.5`.
   *
   * @param str The string to parse.
   * @returns A Variation, or undefined if the string is not a valid variation.
   */
  static fromString(str: string): Variation | undefined {
    const sp = Module.stackSave();
    const variationPtr = Module.stackAlloc(8);
    const strPtr = string_to_ascii_ptr(str);
    let variation: Variation | undefined;
    if (exports.hb_variation_from_string(strPtr.ptr, -1, variationPtr)) {
      variation = new Variation(
        hb_untag(Module.HEAPU32[variationPtr / 4]),
        Module.HEAPF32[variationPtr / 4 + 1],
      );
    }
    strPtr.free();
    Module.stackRestore(sp);
    return variation;
  }

  /**
   * Converts the variation to a string in the format understood by
   * {@link Variation.fromString}.
   *
   * Note that the string won't include any whitespace.
   *
   * @returns The variation string.
   */
  toString(): string {
    const sp = Module.stackSave();
    const variationPtr = Module.stackAlloc(8);
    this.writeTo(variationPtr);
    const bufLen = 128;
    const bufPtr = Module.stackAlloc(bufLen);
    exports.hb_variation_to_string(variationPtr, bufPtr, bufLen);
    const result = utf8_ptr_to_string(bufPtr);
    Module.stackRestore(sp);
    return result;
  }

  /** @internal Write this variation into the given hb_variation_t pointer. */
  writeTo(ptr: number): void {
    Module.HEAPU32[ptr / 4] = hb_tag(this.tag);
    Module.HEAPF32[ptr / 4 + 1] = this.value;
  }
}
