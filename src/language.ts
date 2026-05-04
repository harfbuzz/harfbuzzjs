import { exports, string_to_ascii_ptr, utf8_ptr_to_string } from "./helpers";

/**
 * A {@link https://harfbuzz.github.io/harfbuzz-hb-common.html#hb-language-t | HarfBuzz language}.
 *
 * Data type for languages. Each Language corresponds to a BCP 47 language tag.
 */
export class Language {
  readonly ptr: number;

  /**
   * Converts `tag` representing a BCP 47 language tag to the corresponding
   * Language.
   * @param tag A string representing a BCP 47 language tag.
   */
  constructor(tag: string);
  /** @internal Wrap an existing hb_language_t. */
  constructor(existingPtr: number);
  constructor(arg: string | number) {
    if (typeof arg === "number") {
      this.ptr = arg;
    } else {
      const strPtr = string_to_ascii_ptr(arg);
      this.ptr = exports.hb_language_from_string(strPtr.ptr, -1);
      strPtr.free();
    }
  }

  /**
   * Converts the language to a string.
   * @returns A string representing the language.
   */
  toString(): string {
    return utf8_ptr_to_string(exports.hb_language_to_string(this.ptr));
  }
}
