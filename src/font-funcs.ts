import { Module, exports, registry, utf8_ptr_to_string } from "./helpers";
import type { FontExtents, GlyphExtents } from "./types";
import { Font } from "./font";

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
    const ptr = this.ptr;
    registry.register(this, () => { exports.hb_font_funcs_destroy(ptr); }, this);
  }

  /**
   * Set the font's glyph extents function.
   * @param func The callback receives a Font and glyph ID. It should return
   * an object with xBearing, yBearing, width, and height, or null on failure.
   */
  setGlyphExtentsFunc(
    func: (font: Font, glyph: number) => GlyphExtents | null,
  ): void {
    const funcPtr = Module.addFunction(
      (
        fontPtr: number,
        font_data: number,
        glyph: number,
        extentsPtr: number,
        user_data: number,
      ) => {
        const font = new Font(fontPtr);
        const extents = func(font, glyph);
        if (extents) {
          Module.HEAP32[extentsPtr / 4] = extents.xBearing;
          Module.HEAP32[extentsPtr / 4 + 1] = extents.yBearing;
          Module.HEAP32[extentsPtr / 4 + 2] = extents.width;
          Module.HEAP32[extentsPtr / 4 + 3] = extents.height;
          return 1;
        }
        return 0;
      },
      "ippipp",
    );
    exports.hb_font_funcs_set_glyph_extents_func(this.ptr, funcPtr, 0, 0);
  }

  /**
   * Set the font's glyph from name function.
   * @param func The callback receives a Font and glyph name. It should return
   * the glyph ID, or null on failure.
   */
  setGlyphFromNameFunc(
    func: (font: Font, name: string) => number | null,
  ): void {
    const funcPtr = Module.addFunction(
      (
        fontPtr: number,
        font_data: number,
        namePtr: number,
        len: number,
        glyphPtr: number,
        user_data: number,
      ) => {
        const font = new Font(fontPtr);
        const name = utf8_ptr_to_string(namePtr, len);
        const glyph = func(font, name);
        if (glyph) {
          Module.HEAPU32[glyphPtr / 4] = glyph;
          return 1;
        }
        return 0;
      },
      "ipppipp",
    );
    exports.hb_font_funcs_set_glyph_from_name_func(this.ptr, funcPtr, 0, 0);
  }

  /**
   * Set the font's glyph horizontal advance function.
   * @param func The callback receives a Font and glyph ID. It should return
   * the horizontal advance of the glyph.
   */
  setGlyphHAdvanceFunc(func: (font: Font, glyph: number) => number): void {
    const funcPtr = Module.addFunction(
      (
        fontPtr: number,
        font_data: number,
        glyph: number,
        user_data: number,
      ) => {
        const font = new Font(fontPtr);
        const advance = func(font, glyph);
        return advance;
      },
      "ippip",
    );
    exports.hb_font_funcs_set_glyph_h_advance_func(this.ptr, funcPtr, 0, 0);
  }

  /**
   * Set the font's glyph vertical advance function.
   * @param func The callback receives a Font and glyph ID. It should return
   * the vertical advance of the glyph.
   */
  setGlyphVAdvanceFunc(func: (font: Font, glyph: number) => number): void {
    const funcPtr = Module.addFunction(
      (
        fontPtr: number,
        font_data: number,
        glyph: number,
        user_data: number,
      ) => {
        const font = new Font(fontPtr);
        const advance = func(font, glyph);
        return advance;
      },
      "ippip",
    );
    exports.hb_font_funcs_set_glyph_v_advance_func(this.ptr, funcPtr, 0, 0);
  }

  /**
   * Set the font's glyph horizontal origin function.
   * @param func The callback receives a Font and glyph ID. It should return
   * the [x, y] horizontal origin of the glyph, or null on failure.
   */
  setGlyphHOriginFunc(
    func: (font: Font, glyph: number) => [number, number] | null,
  ): void {
    const funcPtr = Module.addFunction(
      (
        fontPtr: number,
        font_data: number,
        glyph: number,
        xPtr: number,
        yPtr: number,
        user_data: number,
      ) => {
        const font = new Font(fontPtr);
        const origin = func(font, glyph);
        if (origin) {
          Module.HEAP32[xPtr / 4] = origin[0];
          Module.HEAP32[yPtr / 4] = origin[1];
          return 1;
        }
        return 0;
      },
      "ippippp",
    );
    exports.hb_font_funcs_set_glyph_h_origin_func(this.ptr, funcPtr, 0, 0);
  }

  /**
   * Set the font's glyph vertical origin function.
   * @param func The callback receives a Font and glyph ID. It should return
   * the [x, y] vertical origin of the glyph, or null on failure.
   */
  setGlyphVOriginFunc(
    func: (font: Font, glyph: number) => [number, number] | null,
  ): void {
    const funcPtr = Module.addFunction(
      (
        fontPtr: number,
        font_data: number,
        glyph: number,
        xPtr: number,
        yPtr: number,
        user_data: number,
      ) => {
        const font = new Font(fontPtr);
        const origin = func(font, glyph);
        if (origin) {
          Module.HEAP32[xPtr / 4] = origin[0];
          Module.HEAP32[yPtr / 4] = origin[1];
          return 1;
        }
        return 0;
      },
      "ippippp",
    );
    exports.hb_font_funcs_set_glyph_v_origin_func(this.ptr, funcPtr, 0, 0);
  }

  /**
   * Set the font's glyph horizontal kerning function.
   * @param func The callback receives a Font, first glyph ID, and second glyph ID.
   * It should return the horizontal kerning of the glyphs.
   */
  setGlyphHKerningFunc(
    func: (font: Font, firstGlyph: number, secondGlyph: number) => number,
  ): void {
    const funcPtr = Module.addFunction(
      (
        fontPtr: number,
        font_data: number,
        firstGlyph: number,
        secondGlyph: number,
        user_data: number,
      ) => {
        const font = new Font(fontPtr);
        const kerning = func(font, firstGlyph, secondGlyph);
        return kerning;
      },
      "ippiip",
    );
    exports.hb_font_funcs_set_glyph_h_kerning_func(this.ptr, funcPtr, 0, 0);
  }

  /**
   * Set the font's glyph name function.
   * @param func The callback receives a Font and glyph ID. It should return
   * the name of the glyph, or null on failure.
   */
  setGlyphNameFunc(func: (font: Font, glyph: number) => string | null): void {
    const utf8Encoder = new TextEncoder();
    const funcPtr = Module.addFunction(
      (
        fontPtr: number,
        font_data: number,
        glyph: number,
        namePtr: number,
        size: number,
        user_data: number,
      ) => {
        const font = new Font(fontPtr);
        const name = func(font, glyph);
        if (name) {
          utf8Encoder.encodeInto(
            name,
            Module.HEAPU8.subarray(namePtr, namePtr + size),
          );
          return 1;
        }
        return 0;
      },
      "ippipip",
    );
    exports.hb_font_funcs_set_glyph_name_func(this.ptr, funcPtr, 0, 0);
  }

  /**
   * Set the font's nominal glyph function.
   * @param func The callback receives a Font and unicode code point. It should
   * return the nominal glyph of the unicode, or null on failure.
   */
  setNominalGlyphFunc(
    func: (font: Font, unicode: number) => number | null,
  ): void {
    const funcPtr = Module.addFunction(
      (
        fontPtr: number,
        font_data: number,
        unicode: number,
        glyphPtr: number,
        user_data: number,
      ) => {
        const font = new Font(fontPtr);
        const glyph = func(font, unicode);
        if (glyph) {
          Module.HEAPU32[glyphPtr / 4] = glyph;
          return 1;
        }
        return 0;
      },
      "ippipp",
    );
    exports.hb_font_funcs_set_nominal_glyph_func(this.ptr, funcPtr, 0, 0);
  }

  /**
   * Set the font's variation glyph function.
   * @param func The callback receives a Font, unicode code point, and variation
   * selector. It should return the variation glyph, or null on failure.
   */
  setVariationGlyphFunc(
    func: (
      font: Font,
      unicode: number,
      variationSelector: number,
    ) => number | null,
  ): void {
    const funcPtr = Module.addFunction(
      (
        fontPtr: number,
        font_data: number,
        unicode: number,
        variationSelector: number,
        glyphPtr: number,
        user_data: number,
      ) => {
        const font = new Font(fontPtr);
        const glyph = func(font, unicode, variationSelector);
        if (glyph) {
          Module.HEAPU32[glyphPtr / 4] = glyph;
          return 1;
        }
        return 0;
      },
      "ippiipp",
    );
    exports.hb_font_funcs_set_variation_glyph_func(this.ptr, funcPtr, 0, 0);
  }

  /**
   * Set the font's horizontal extents function.
   * @param func The callback receives a Font. It should return an object with
   * ascender, descender, and lineGap, or null on failure.
   */
  setFontHExtentsFunc(func: (font: Font) => FontExtents | null): void {
    const funcPtr = Module.addFunction(
      (
        fontPtr: number,
        font_data: number,
        extentsPtr: number,
        user_data: number,
      ) => {
        const font = new Font(fontPtr);
        const extents = func(font);
        if (extents) {
          Module.HEAP32[extentsPtr / 4] = extents.ascender;
          Module.HEAP32[extentsPtr / 4 + 1] = extents.descender;
          Module.HEAP32[extentsPtr / 4 + 2] = extents.lineGap;
          return 1;
        }
        return 0;
      },
      "ipppp",
    );
    exports.hb_font_funcs_set_font_h_extents_func(this.ptr, funcPtr, 0, 0);
  }

  /**
   * Set the font's vertical extents function.
   * @param func The callback receives a Font. It should return an object with
   * ascender, descender, and lineGap, or null on failure.
   */
  setFontVExtentsFunc(func: (font: Font) => FontExtents | null): void {
    const funcPtr = Module.addFunction(
      (
        fontPtr: number,
        font_data: number,
        extentsPtr: number,
        user_data: number,
      ) => {
        const font = new Font(fontPtr);
        const extents = func(font);
        if (extents) {
          Module.HEAP32[extentsPtr / 4] = extents.ascender;
          Module.HEAP32[extentsPtr / 4 + 1] = extents.descender;
          Module.HEAP32[extentsPtr / 4 + 2] = extents.lineGap;
          return 1;
        }
        return 0;
      },
      "ipppp",
    );
    exports.hb_font_funcs_set_font_v_extents_func(this.ptr, funcPtr, 0, 0);
  }
}
