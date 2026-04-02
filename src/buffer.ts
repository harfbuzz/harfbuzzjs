import {
  Module,
  exports,
  hb_tag,
  utf8_ptr_to_string,
  string_to_ascii_ptr,
  string_to_utf16_ptr,
} from "./helpers";
import type { GlyphInfo, GlyphPosition, JsonGlyph } from "./types";
import { Font } from "./font";

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
  addText(
    text: string,
    itemOffset: number = 0,
    itemLength: number | null = null,
  ): void {
    const str = string_to_utf16_ptr(text);
    if (itemLength == null) itemLength = str.length;
    exports.hb_buffer_add_utf16(
      this.ptr,
      str.ptr,
      str.length,
      itemOffset,
      itemLength,
    );
    str.free();
  }

  /**
   * Add code points to the buffer.
   * @param codePoints Array of code points to be added to the buffer.
   * @param itemOffset The offset of the first code point to add to the buffer.
   * @param itemLength The number of code points to add to the buffer, or null for the end of the array.
   */
  addCodePoints(
    codePoints: number[],
    itemOffset: number = 0,
    itemLength: number | null = null,
  ): void {
    const codePointsPtr = exports.malloc(codePoints.length * 4);
    const codePointsArray = Module.HEAPU32.subarray(
      codePointsPtr / 4,
      codePointsPtr / 4 + codePoints.length,
    );
    codePointsArray.set(codePoints);
    if (itemLength == null) itemLength = codePoints.length;
    exports.hb_buffer_add_codepoints(
      this.ptr,
      codePointsPtr,
      codePoints.length,
      itemOffset,
      itemLength,
    );
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
    const str = string_to_ascii_ptr(language);
    exports.hb_buffer_set_language(
      this.ptr,
      exports.hb_language_from_string(str.ptr, -1),
    );
    str.free();
  }

  /**
   * Set buffer script explicitly.
   * @param script The buffer script
   */
  setScript(script: string): void {
    const str = string_to_ascii_ptr(script);
    exports.hb_buffer_set_script(
      this.ptr,
      exports.hb_script_from_string(str.ptr, -1),
    );
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
  setMessageFunc(
    func: (buffer: Buffer, font: Font, message: string) => boolean,
  ): void {
    const traceFunc = (
      bufferPtr: number,
      fontPtr: number,
      messagePtr: number,
      user_data: number,
    ) => {
      const message = utf8_ptr_to_string(messagePtr);
      const buffer = new Buffer(bufferPtr);
      const font = new Font(fontPtr);
      const result = func(buffer, font, message);
      buffer.destroy();
      font.destroy();
      return result ? 1 : 0;
    };
    const traceFuncPtr = Module.addFunction(traceFunc, "iiiii");
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
    const infosArray = Module.HEAPU32.subarray(
      infosPtr32,
      infosPtr32 + this.getLength() * 5,
    );
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
    const positionsPtr32 =
      exports.hb_buffer_get_glyph_positions(this.ptr, 0) / 4;
    if (positionsPtr32 == 0) {
      return [];
    }
    const positionsArray = Module.HEAP32.subarray(
      positionsPtr32,
      positionsPtr32 + this.getLength() * 5,
    );
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
    const infosArray = Module.HEAPU32.subarray(
      infosPtr32,
      infosPtr32 + this.getLength() * 5,
    );

    const positionsPtr32 =
      exports.hb_buffer_get_glyph_positions(this.ptr, 0) / 4;
    const positionsArray = positionsPtr32
      ? Module.HEAP32.subarray(
          positionsPtr32,
          positionsPtr32 + this.getLength() * 5,
        )
      : null;

    const out: (GlyphInfo & Partial<GlyphPosition>)[] = [];
    for (let i = 0; i < infosArray.length; i += 5) {
      const info: GlyphInfo & Partial<GlyphPosition> = {
        codepoint: infosArray[i],
        cluster: infosArray[i + 2],
      };
      for (const [name, idx] of [
        ["mask", 1],
        ["var1", 3],
        ["var2", 4],
      ] as [string, number][]) {
        Object.defineProperty(info, name, {
          value: infosArray[i + idx],
          enumerable: false,
        });
      }
      if (positionsArray) {
        info.x_advance = positionsArray[i];
        info.y_advance = positionsArray[i + 1];
        info.x_offset = positionsArray[i + 2];
        info.y_offset = positionsArray[i + 3];
        Object.defineProperty(info, "var", {
          value: positionsArray[i + 4],
          enumerable: false,
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
    const positionsPtr32 =
      exports.hb_buffer_get_glyph_positions(this.ptr, 0) / 4;
    if (positionsPtr32 == 0) {
      return;
    }
    const len = Math.min(positions.length, this.getLength());
    const positionsArray = Module.HEAP32.subarray(
      positionsPtr32,
      positionsPtr32 + len * 5,
    );
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
  serialize(
    font?: Font | null,
    start: number = 0,
    end?: number | null,
    format: BufferSerializeFormat = BufferSerializeFormat.TEXT,
    flags: number = 0,
  ): string {
    const sp = Module.stackSave();
    const endPos = end ?? this.getLength();
    const bufLen = 32 * 1024;
    const bufPtr = exports.malloc(bufLen);
    const bufConsumedPtr = Module.stackAlloc(4);
    let result = "";
    while (start < endPos) {
      start += exports.hb_buffer_serialize(
        this.ptr,
        start,
        endPos,
        bufPtr,
        bufLen,
        bufConsumedPtr,
        font ? font.ptr : 0,
        hb_tag(format),
        flags,
      );
      const bufConsumed = Module.HEAPU32[bufConsumedPtr / 4];
      if (bufConsumed == 0) break;
      result += utf8_ptr_to_string(bufPtr, bufConsumed);
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
    const buf = this.serialize(
      null,
      0,
      null,
      BufferSerializeFormat.JSON,
      BufferSerializeFlag.NO_GLYPH_NAMES | BufferSerializeFlag.GLYPH_FLAGS,
    );
    return JSON.parse(buf);
  }

  /** Free the object. */
  destroy(): void {
    exports.hb_buffer_destroy(this.ptr);
  }
}
