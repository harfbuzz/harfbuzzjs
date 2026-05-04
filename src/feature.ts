import {
  Module,
  exports,
  hb_tag,
  hb_untag,
  string_to_ascii_ptr,
  utf8_ptr_to_string,
} from "./helpers";

/**
 * A {@link https://harfbuzz.github.io/harfbuzz-hb-common.html#hb-feature-t | HarfBuzz feature}.
 *
 * The structure that holds information about requested feature application.
 * The feature will be applied with the given value to all glyphs which are in
 * clusters between {@link Feature.start} (inclusive) and {@link Feature.end}
 * (exclusive). Setting `start` to `0` and `end` to `0xffffffff` specifies that
 * the feature always applies to the entire buffer.
 */
export class Feature {
  /**
   * Special setting for {@link Feature.start} to apply the feature from the
   * start of the buffer.
   */
  static readonly GLOBAL_START = 0;

  /**
   * Special setting for {@link Feature.end} to apply the feature from to the
   * end of the buffer.
   */
  static readonly GLOBAL_END = 0xffffffff;

  /** The tag of the feature. */
  tag: string;
  /**
   * The value of the feature. `0` disables the feature, non-zero (usually `1`)
   * enables the feature. For features implemented as lookup type 3 (like
   * `salt`) the value is a one-based index into the alternates.
   */
  value: number;
  /** The cluster to start applying this feature setting (inclusive). */
  start: number;
  /** The cluster to end applying this feature setting (exclusive). */
  end: number;

  constructor(
    tag: string,
    value: number = 1,
    start: number = Feature.GLOBAL_START,
    end: number = Feature.GLOBAL_END,
  ) {
    this.tag = tag;
    this.value = value;
    this.start = start;
    this.end = end;
  }

  /**
   * Parses a string into a Feature.
   *
   * The format for specifying feature strings follows. All valid CSS
   * font-feature-settings values other than `normal` and the global values are
   * also accepted, though not documented below. CSS string escapes are not
   * supported.
   *
   * The range indices refer to the positions between Unicode characters. The
   * position before the first character is always 0.
   *
   * The format is Python-esque. Here is how it all works:
   *
   * | Syntax        | Value | Start | End | Meaning                          |
   * | ------------- | ----- | ----- | --- | -------------------------------- |
   * | `kern`        | 1     | 0     | ∞   | Turn feature on                  |
   * | `+kern`       | 1     | 0     | ∞   | Turn feature on                  |
   * | `-kern`       | 0     | 0     | ∞   | Turn feature off                 |
   * | `kern=0`      | 0     | 0     | ∞   | Turn feature off                 |
   * | `kern=1`      | 1     | 0     | ∞   | Turn feature on                  |
   * | `aalt=2`      | 2     | 0     | ∞   | Choose 2nd alternate             |
   * | `kern[]`      | 1     | 0     | ∞   | Turn feature on                  |
   * | `kern[:]`     | 1     | 0     | ∞   | Turn feature on                  |
   * | `kern[5:]`    | 1     | 5     | ∞   | Turn feature on, partial         |
   * | `kern[:5]`    | 1     | 0     | 5   | Turn feature on, partial         |
   * | `kern[3:5]`   | 1     | 3     | 5   | Turn feature on, range           |
   * | `kern[3]`     | 1     | 3     | 3+1 | Turn feature on, single char     |
   * | `aalt[3:5]=2` | 2     | 3     | 5   | Turn 2nd alternate on for range  |
   *
   * @param str The string to parse.
   * @returns A Feature, or undefined if the string is not a valid feature.
   */
  static fromString(str: string): Feature | undefined {
    const sp = Module.stackSave();
    const featurePtr = Module.stackAlloc(16);
    const strPtr = string_to_ascii_ptr(str);
    let feature: Feature | undefined;
    if (exports.hb_feature_from_string(strPtr.ptr, -1, featurePtr)) {
      feature = new Feature(
        hb_untag(Module.HEAPU32[featurePtr / 4]),
        Module.HEAPU32[featurePtr / 4 + 1],
        Module.HEAPU32[featurePtr / 4 + 2],
        Module.HEAPU32[featurePtr / 4 + 3],
      );
    }
    strPtr.free();
    Module.stackRestore(sp);
    return feature;
  }

  /**
   * Converts the feature to a string in the format understood by
   * {@link Feature.fromString}.
   *
   * Note that the feature value will be omitted if it is `1`, but the string
   * won't include any whitespace.
   *
   * @returns The feature string.
   */
  toString(): string {
    const sp = Module.stackSave();
    const featurePtr = Module.stackAlloc(16);
    this.writeTo(featurePtr);
    const bufLen = 128;
    const bufPtr = Module.stackAlloc(bufLen);
    exports.hb_feature_to_string(featurePtr, bufPtr, bufLen);
    const result = utf8_ptr_to_string(bufPtr);
    Module.stackRestore(sp);
    return result;
  }

  /** @internal Write this feature into the given hb_feature_t pointer. */
  writeTo(ptr: number): void {
    Module.HEAPU32[ptr / 4] = hb_tag(this.tag);
    Module.HEAPU32[ptr / 4 + 1] = this.value;
    Module.HEAPU32[ptr / 4 + 2] = this.start;
    Module.HEAPU32[ptr / 4 + 3] = this.end;
  }
}
