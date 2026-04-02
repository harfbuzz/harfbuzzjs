import {
  Module,
  exports,
  hb_tag,
  utf8_ptr_to_string,
  string_to_utf8_ptr,
} from "./helpers";
import type { FontExtents, GlyphExtents, SvgPathCommand } from "./types";
import type { Face } from "./face";
import type { FontFuncs } from "./font-funcs";

/**
 * An object representing a {@link https://harfbuzz.github.io/harfbuzz-hb-font.html | HarfBuzz font}.
 * A font represents a face at a specific size and with certain other
 * parameters (pixels-per-em, variation settings) specified. Fonts are the
 * primary input to the shaping process.
 */
export class Font {
  readonly ptr: number;
  private drawFuncsPtr: number | null = null;
  private moveToPtr: number | null = null;
  private lineToPtr: number | null = null;
  private cubicToPtr: number | null = null;
  private quadToPtr: number | null = null;
  private closePathPtr: number | null = null;
  private pathBuffer = "";

  /**
   * @param face A Face to create the font from.
   */
  constructor(face: Face);
  /** @internal Wrap an existing font pointer. */
  constructor(existingPtr: number);
  constructor(arg: Face | number) {
    if (typeof arg === "number") {
      this.ptr = exports.hb_font_reference(arg);
    } else {
      this.ptr = exports.hb_font_create(arg.ptr);
    }
  }

  /**
   * Create a sub font that inherits this font's properties.
   * @returns A new Font object representing the sub font.
   */
  subFont(): Font {
    return new Font(exports.hb_font_create_sub_font(this.ptr));
  }

  /**
   * Return font horizontal extents.
   * @returns Object with ascender, descender, and lineGap properties.
   */
  hExtents(): FontExtents {
    const sp = Module.stackSave();
    const extentsPtr = Module.stackAlloc(48);
    exports.hb_font_get_h_extents(this.ptr, extentsPtr);
    const extents = {
      ascender: Module.HEAP32[extentsPtr / 4],
      descender: Module.HEAP32[extentsPtr / 4 + 1],
      lineGap: Module.HEAP32[extentsPtr / 4 + 2],
    };
    Module.stackRestore(sp);
    return extents;
  }

  /**
   * Return font vertical extents.
   * @returns Object with ascender, descender, and lineGap properties.
   */
  vExtents(): FontExtents {
    const sp = Module.stackSave();
    const extentsPtr = Module.stackAlloc(48);
    exports.hb_font_get_v_extents(this.ptr, extentsPtr);
    const extents = {
      ascender: Module.HEAP32[extentsPtr / 4],
      descender: Module.HEAP32[extentsPtr / 4 + 1],
      lineGap: Module.HEAP32[extentsPtr / 4 + 2],
    };
    Module.stackRestore(sp);
    return extents;
  }

  /**
   * Return glyph name.
   * @param glyphId ID of the requested glyph in the font.
   * @returns The glyph name string.
   */
  glyphName(glyphId: number): string {
    const sp = Module.stackSave();
    const strSize = 256;
    const strPtr = Module.stackAlloc(strSize);
    exports.hb_font_glyph_to_string(this.ptr, glyphId, strPtr, strSize);
    const name = utf8_ptr_to_string(strPtr);
    Module.stackRestore(sp);
    return name;
  }

  /**
   * Return a glyph as an SVG path string.
   * @param glyphId ID of the requested glyph in the font.
   * @returns SVG path data string.
   */
  glyphToPath(glyphId: number): string {
    if (!this.drawFuncsPtr) {
      const moveTo = (
        dfuncs: number,
        draw_data: number,
        draw_state: number,
        to_x: number,
        to_y: number,
        user_data: number,
      ) => {
        this.pathBuffer += `M${to_x},${to_y}`;
      };
      const lineTo = (
        dfuncs: number,
        draw_data: number,
        draw_state: number,
        to_x: number,
        to_y: number,
        user_data: number,
      ) => {
        this.pathBuffer += `L${to_x},${to_y}`;
      };
      const cubicTo = (
        dfuncs: number,
        draw_data: number,
        draw_state: number,
        c1_x: number,
        c1_y: number,
        c2_x: number,
        c2_y: number,
        to_x: number,
        to_y: number,
        user_data: number,
      ) => {
        this.pathBuffer += `C${c1_x},${c1_y} ${c2_x},${c2_y} ${to_x},${to_y}`;
      };
      const quadTo = (
        dfuncs: number,
        draw_data: number,
        draw_state: number,
        c_x: number,
        c_y: number,
        to_x: number,
        to_y: number,
        user_data: number,
      ) => {
        this.pathBuffer += `Q${c_x},${c_y} ${to_x},${to_y}`;
      };
      const closePath = (
        dfuncs: number,
        draw_data: number,
        draw_state: number,
        user_data: number,
      ) => {
        this.pathBuffer += "Z";
      };

      this.moveToPtr = Module.addFunction(moveTo, "viiiffi");
      this.lineToPtr = Module.addFunction(lineTo, "viiiffi");
      this.cubicToPtr = Module.addFunction(cubicTo, "viiiffffffi");
      this.quadToPtr = Module.addFunction(quadTo, "viiiffffi");
      this.closePathPtr = Module.addFunction(closePath, "viiii");
      this.drawFuncsPtr = exports.hb_draw_funcs_create();
      exports.hb_draw_funcs_set_move_to_func(
        this.drawFuncsPtr,
        this.moveToPtr,
        0,
        0,
      );
      exports.hb_draw_funcs_set_line_to_func(
        this.drawFuncsPtr,
        this.lineToPtr,
        0,
        0,
      );
      exports.hb_draw_funcs_set_cubic_to_func(
        this.drawFuncsPtr,
        this.cubicToPtr,
        0,
        0,
      );
      exports.hb_draw_funcs_set_quadratic_to_func(
        this.drawFuncsPtr,
        this.quadToPtr,
        0,
        0,
      );
      exports.hb_draw_funcs_set_close_path_func(
        this.drawFuncsPtr,
        this.closePathPtr,
        0,
        0,
      );
    }

    this.pathBuffer = "";
    exports.hb_font_draw_glyph(this.ptr, glyphId, this.drawFuncsPtr, 0);
    return this.pathBuffer;
  }

  /**
   * Return glyph horizontal advance.
   * @param glyphId ID of the requested glyph in the font.
   * @returns The horizontal advance width.
   */
  glyphHAdvance(glyphId: number): number {
    return exports.hb_font_get_glyph_h_advance(this.ptr, glyphId);
  }

  /**
   * Return glyph vertical advance.
   * @param glyphId ID of the requested glyph in the font.
   * @returns The vertical advance height.
   */
  glyphVAdvance(glyphId: number): number {
    return exports.hb_font_get_glyph_v_advance(this.ptr, glyphId);
  }

  /**
   * Return glyph horizontal origin.
   * @param glyphId ID of the requested glyph in the font.
   * @returns [x, y] origin coordinates, or null if not available.
   */
  glyphHOrigin(glyphId: number): [number, number] | null {
    const sp = Module.stackSave();
    const xPtr = Module.stackAlloc(4);
    const yPtr = Module.stackAlloc(4);
    let origin: [number, number] | null = null;
    if (exports.hb_font_get_glyph_h_origin(this.ptr, glyphId, xPtr, yPtr)) {
      origin = [Module.HEAP32[xPtr / 4], Module.HEAP32[yPtr / 4]];
    }
    Module.stackRestore(sp);
    return origin;
  }

  /**
   * Return glyph vertical origin.
   * @param glyphId ID of the requested glyph in the font.
   * @returns [x, y] origin coordinates, or null if not available.
   */
  glyphVOrigin(glyphId: number): [number, number] | null {
    const sp = Module.stackSave();
    const xPtr = Module.stackAlloc(4);
    const yPtr = Module.stackAlloc(4);
    let origin: [number, number] | null = null;
    if (exports.hb_font_get_glyph_v_origin(this.ptr, glyphId, xPtr, yPtr)) {
      origin = [Module.HEAP32[xPtr / 4], Module.HEAP32[yPtr / 4]];
    }
    Module.stackRestore(sp);
    return origin;
  }

  /**
   * Return glyph extents.
   * @param glyphId ID of the requested glyph in the font.
   * @returns An object with xBearing, yBearing, width, and height, or null.
   */
  glyphExtents(glyphId: number): GlyphExtents | null {
    const sp = Module.stackSave();
    const extentsPtr = Module.stackAlloc(16);
    let extents: GlyphExtents | null = null;
    if (exports.hb_font_get_glyph_extents(this.ptr, glyphId, extentsPtr)) {
      extents = {
        xBearing: Module.HEAP32[extentsPtr / 4],
        yBearing: Module.HEAP32[extentsPtr / 4 + 1],
        width: Module.HEAP32[extentsPtr / 4 + 2],
        height: Module.HEAP32[extentsPtr / 4 + 3],
      };
    }
    Module.stackRestore(sp);
    return extents;
  }

  /**
   * Return glyph ID from name.
   * @param name Name of the requested glyph in the font.
   * @returns The glyph ID, or null if not found.
   */
  glyphFromName(name: string): number | null {
    const sp = Module.stackSave();
    const glyphIdPtr = Module.stackAlloc(4);
    const namePtr = string_to_utf8_ptr(name);
    let glyphId: number | null = null;
    if (
      exports.hb_font_get_glyph_from_name(
        this.ptr,
        namePtr.ptr,
        namePtr.length,
        glyphIdPtr,
      )
    ) {
      glyphId = Module.HEAPU32[glyphIdPtr / 4];
    }
    namePtr.free();
    Module.stackRestore(sp);
    return glyphId;
  }

  /**
   * Return a glyph as a JSON path string
   * based on format described on https://svgwg.org/specs/paths/#InterfaceSVGPathSegment
   * @param glyphId ID of the requested glyph in the font.
   * @returns An array of path segment objects with type and values.
   */
  glyphToJson(glyphId: number): SvgPathCommand[] {
    const path = this.glyphToPath(glyphId);
    return path
      .replace(/([MLQCZ])/g, "|$1 ")
      .split("|")
      .filter((x) => x.length)
      .map((x) => {
        const [type, ...values] = x.split(/[ ,]/g).filter((s) => s.length);
        return { type, values: values.map(Number) };
      });
  }

  /**
   * Set the font's scale factor, affecting the position values returned from
   * shaping.
   * @param xScale Units to scale in the X dimension.
   * @param yScale Units to scale in the Y dimension.
   */
  setScale(xScale: number, yScale: number): void {
    exports.hb_font_set_scale(this.ptr, xScale, yScale);
  }

  /**
   * Set the font's variations.
   * @param variations Dictionary of variations to set.
   */
  setVariations(variations: Record<string, number>): void {
    const entries = Object.entries(variations);
    const vars = exports.malloc(8 * entries.length);
    entries.forEach(([tag, value], i) => {
      Module.HEAPU32[vars / 4 + i * 2 + 0] = hb_tag(tag);
      Module.HEAPF32[vars / 4 + i * 2 + 1] = value;
    });
    exports.hb_font_set_variations(this.ptr, vars, entries.length);
    exports.free(vars);
  }

  /** Set the font's font functions. */
  setFuncs(fontFuncs: FontFuncs): void {
    exports.hb_font_set_funcs(this.ptr, fontFuncs.ptr);
  }

  /** Free the object. */
  destroy(): void {
    exports.hb_font_destroy(this.ptr);
    if (this.drawFuncsPtr) {
      exports.hb_draw_funcs_destroy(this.drawFuncsPtr);
      this.drawFuncsPtr = null;
      Module.removeFunction(this.moveToPtr!);
      Module.removeFunction(this.lineToPtr!);
      Module.removeFunction(this.cubicToPtr!);
      Module.removeFunction(this.quadToPtr!);
      Module.removeFunction(this.closePathPtr!);
    }
  }
}
