import { exports, string_to_ascii_ptr, utf8_ptr_to_string } from "./helpers";

/**
 * The direction of a text segment or buffer.
 *
 * A segment can also be tested for horizontal or vertical orientation
 * (irrespective of specific direction).
 */
export class Direction {
  /** Initial, unset direction. */
  static readonly INVALID = new Direction(0);
  /** Text is set horizontally from left to right. */
  static readonly LTR = new Direction(4);
  /** Text is set horizontally from right to left. */
  static readonly RTL = new Direction(5);
  /** Text is set vertically from top to bottom. */
  static readonly TTB = new Direction(6);
  /** Text is set vertically from bottom to top. */
  static readonly BTT = new Direction(7);

  readonly value: number;

  /**
   * Converts a string to a Direction. Matching is loose and case-insensitive;
   * the first letter determines the direction (`l`/`L`: LTR, `r`/`R`: RTL,
   * `t`/`T`: TTB, `b`/`B`: BTT). Other strings yield `Direction.INVALID`.
   * @param name A string like `"ltr"`, `"rtl"`, `"ttb"`, or `"btt"`.
   */
  constructor(name: string);
  /** @internal Wrap an existing hb_direction_t. */
  constructor(existingValue: number);
  constructor(arg: string | number) {
    if (typeof arg === "number") {
      this.value = arg;
    } else {
      const strPtr = string_to_ascii_ptr(arg);
      this.value = exports.hb_direction_from_string(strPtr.ptr, -1);
      strPtr.free();
    }
  }

  /**
   * Converts the Direction to a string.
   * @returns A string like `"ltr"`, `"rtl"`, `"ttb"`, `"btt"`, or `"invalid"`.
   */
  toString(): string {
    return utf8_ptr_to_string(exports.hb_direction_to_string(this.value));
  }
}
