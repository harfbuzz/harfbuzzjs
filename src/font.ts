import {
  Module,
  exports,
  track,
  STATIC_ARRAY_SIZE,
  hb_tag,
  utf8_ptr_to_string,
  string_to_utf8_ptr,
  register_callback_data_pointer,
  remove_callback_data_pointer,
  color_to_int,
  type ValueOf,
} from "./helpers";
import type { Color, FontExtents, GlyphExtents, SvgPathCommand } from "./types";
import type { Direction } from "./buffer";
import { Face } from "./face";
import type { FontFuncs } from "./font-funcs";
import { DrawFuncs } from "./draw-funcs";
import type { PaintFuncs } from "./paint-funcs";
import type { Variation } from "./variation";

/**
 * Metric tags corresponding to [MVAR Value
 * Tags](https://docs.microsoft.com/en-us/typography/opentype/spec/mvar#value-tags).
 */
export const MetricsTag = {
  /** horizontal ascender. */
  HORIZONTAL_ASCENDER: hb_tag("hasc"),
  /** horizontal descender. */
  HORIZONTAL_DESCENDER: hb_tag("hdsc"),
  /** horizontal line gap. */
  HORIZONTAL_LINE_GAP: hb_tag("hlgp"),
  /** horizontal clipping ascent. */
  HORIZONTAL_CLIPPING_ASCENT: hb_tag("hcla"),
  /** horizontal clipping descent. */
  HORIZONTAL_CLIPPING_DESCENT: hb_tag("hcld"),
  /** vertical ascender. */
  VERTICAL_ASCENDER: hb_tag("vasc"),
  /** vertical descender. */
  VERTICAL_DESCENDER: hb_tag("vdsc"),
  /** vertical line gap. */
  VERTICAL_LINE_GAP: hb_tag("vlgp"),
  /** horizontal caret rise. */
  HORIZONTAL_CARET_RISE: hb_tag("hcrs"),
  /** horizontal caret run. */
  HORIZONTAL_CARET_RUN: hb_tag("hcrn"),
  /** horizontal caret offset. */
  HORIZONTAL_CARET_OFFSET: hb_tag("hcof"),
  /** vertical caret rise. */
  VERTICAL_CARET_RISE: hb_tag("vcrs"),
  /** vertical caret run. */
  VERTICAL_CARET_RUN: hb_tag("vcrn"),
  /** vertical caret offset. */
  VERTICAL_CARET_OFFSET: hb_tag("vcof"),
  /** x height. */
  X_HEIGHT: hb_tag("xhgt"),
  /** cap height. */
  CAP_HEIGHT: hb_tag("cpht"),
  /** subscript em x size. */
  SUBSCRIPT_EM_X_SIZE: hb_tag("sbxs"),
  /** subscript em y size. */
  SUBSCRIPT_EM_Y_SIZE: hb_tag("sbys"),
  /** subscript em x offset. */
  SUBSCRIPT_EM_X_OFFSET: hb_tag("sbxo"),
  /** subscript em y offset. */
  SUBSCRIPT_EM_Y_OFFSET: hb_tag("sbyo"),
  /** superscript em x size. */
  SUPERSCRIPT_EM_X_SIZE: hb_tag("spxs"),
  /** superscript em y size. */
  SUPERSCRIPT_EM_Y_SIZE: hb_tag("spys"),
  /** superscript em x offset. */
  SUPERSCRIPT_EM_X_OFFSET: hb_tag("spxo"),
  /** superscript em y offset. */
  SUPERSCRIPT_EM_Y_OFFSET: hb_tag("spyo"),
  /** strikeout size. */
  STRIKEOUT_SIZE: hb_tag("strs"),
  /** strikeout offset. */
  STRIKEOUT_OFFSET: hb_tag("stro"),
  /** underline size. */
  UNDERLINE_SIZE: hb_tag("unds"),
  /** underline offset. */
  UNDERLINE_OFFSET: hb_tag("undo"),
} as const;
export type MetricsTag = ValueOf<typeof MetricsTag>;

let pathDrawFuncs: DrawFuncs | undefined;
function getPathDrawFuncs(): DrawFuncs {
  if (!pathDrawFuncs) {
    pathDrawFuncs = new DrawFuncs();
    pathDrawFuncs.setMoveToFunc((x, y, path) => {
      (path as string[]).push(`M${x},${y}`);
    });
    pathDrawFuncs.setLineToFunc((x, y, path) => {
      (path as string[]).push(`L${x},${y}`);
    });
    pathDrawFuncs.setCubicToFunc((c1x, c1y, c2x, c2y, x, y, path) => {
      (path as string[]).push(`C${c1x},${c1y} ${c2x},${c2y} ${x},${y}`);
    });
    pathDrawFuncs.setQuadraticToFunc((cx, cy, x, y, path) => {
      (path as string[]).push(`Q${cx},${cy} ${x},${y}`);
    });
    pathDrawFuncs.setClosePathFunc((path) => {
      (path as string[]).push("Z");
    });
  }
  return pathDrawFuncs;
}

let jsonDrawFuncs: DrawFuncs | undefined;
function getJsonDrawFuncs(): DrawFuncs {
  if (!jsonDrawFuncs) {
    jsonDrawFuncs = new DrawFuncs();
    jsonDrawFuncs.setMoveToFunc((x, y, commands) => {
      (commands as SvgPathCommand[]).push({ type: "M", values: [x, y] });
    });
    jsonDrawFuncs.setLineToFunc((x, y, commands) => {
      (commands as SvgPathCommand[]).push({ type: "L", values: [x, y] });
    });
    jsonDrawFuncs.setCubicToFunc((c1x, c1y, c2x, c2y, x, y, commands) => {
      (commands as SvgPathCommand[]).push({
        type: "C",
        values: [c1x, c1y, c2x, c2y, x, y],
      });
    });
    jsonDrawFuncs.setQuadraticToFunc((cx, cy, x, y, commands) => {
      (commands as SvgPathCommand[]).push({
        type: "Q",
        values: [cx, cy, x, y],
      });
    });
    jsonDrawFuncs.setClosePathFunc((commands) => {
      (commands as SvgPathCommand[]).push({ type: "Z", values: [] });
    });
  }
  return jsonDrawFuncs;
}

/**
 * An object representing a {@link https://harfbuzz.github.io/harfbuzz-hb-font.html | HarfBuzz font}.
 * A font represents a face at a specific size and with certain other
 * parameters (pixels-per-em, variation settings) specified. Fonts are the
 * primary input to the shaping process.
 */
export class Font {
  readonly ptr: number;
  private _face?: Face;

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
      this._face = arg;
    }
    track(this, exports.hb_font_destroy);
  }

  /** The {@link Face} associated with this font. */
  get face(): Face {
    if (!this._face) {
      this._face = new Face(exports.hb_font_get_face(this.ptr));
    }
    return this._face;
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
   * Draws the outline that corresponds to a glyph in the specified font.
   *
   * The outline is returned by way of calls to the callbacks of the `drawFuncs`
   * object, with `drawData` passed to them.
   * @param glyphId The glyph ID.
   * @param drawFuncs The {@link DrawFuncs} to draw to.
   * @param drawData User data to pass to draw callbacks.
   */
  drawGlyph(glyphId: number, drawFuncs: DrawFuncs, drawData?: unknown): void {
    const drawDataPtr = register_callback_data_pointer(drawData);
    try {
      exports.hb_font_draw_glyph(this.ptr, glyphId, drawFuncs.ptr, drawDataPtr);
    } finally {
      remove_callback_data_pointer(drawDataPtr);
    }
  }

  /**
   * Draws the outline that corresponds to a glyph in the specified font.
   *
   * This is a newer name for {@link Font.drawGlyph}, that returns `false` if the
   * font has no outlines for the glyph.
   *
   * The outline is returned by way of calls to the callbacks of the `drawFuncs`
   * object, with `drawData` passed to them.
   * @param glyphId The glyph ID.
   * @param drawFuncs The {@link DrawFuncs} to draw to.
   * @param drawData User data to pass to draw callbacks.
   * @returns `true` if the glyph was drawn, `false` otherwise.
   */
  drawGlyphOrFail(
    glyphId: number,
    drawFuncs: DrawFuncs,
    drawData?: unknown,
  ): boolean {
    const drawDataPtr = register_callback_data_pointer(drawData);
    try {
      return !!exports.hb_font_draw_glyph_or_fail(
        this.ptr,
        glyphId,
        drawFuncs.ptr,
        drawDataPtr,
      );
    } finally {
      remove_callback_data_pointer(drawDataPtr);
    }
  }

  /**
   * Paints the glyph. This function is similar to {@link Font.paintGlyphOrFail},
   * but if painting a color glyph failed, it will fall back to painting an
   * outline monochrome glyph.
   *
   * The painting instructions are returned by way of calls to the callbacks of
   * the `paintFuncs` object, with `paintData` passed to them.
   *
   * If the font has color palettes, then `paletteIndex` selects the palette to
   * use. If the font only has one palette, this will be 0.
   * @param glyphId The glyph ID.
   * @param paintFuncs The {@link PaintFuncs} to paint with.
   * @param paintData User data to pass to paint callbacks.
   * @param paletteIndex The index of the font's color palette to use.
   * @param foreground The foreground color, unpremultiplied.
   */
  paintGlyph(
    glyphId: number,
    paintFuncs: PaintFuncs,
    paintData?: unknown,
    paletteIndex: number = 0,
    foreground: Color = { red: 0, green: 0, blue: 0, alpha: 255 },
  ): void {
    const paintDataPtr = register_callback_data_pointer(paintData);
    try {
      exports.hb_font_paint_glyph(
        this.ptr,
        glyphId,
        paintFuncs.ptr,
        paintDataPtr,
        paletteIndex,
        color_to_int(foreground),
      );
    } finally {
      remove_callback_data_pointer(paintDataPtr);
    }
  }

  /**
   * Paints a color glyph.
   *
   * Succeeds if the glyph has color paint layers (COLRv0), a color paint graph
   * (COLRv1), or a bitmap image that the font's callbacks render successfully.
   * Returns `false` if the font has no color data for the glyph; the client can
   * then fall back to {@link Font.drawGlyphOrFail} for the monochrome outline.
   *
   * The painting instructions are returned by way of calls to the callbacks of
   * the `paintFuncs` object, with `paintData` passed to them.
   *
   * If the font has color palettes, then `paletteIndex` selects the palette to
   * use. If the font only has one palette, this will be 0.
   * @param glyphId The glyph ID.
   * @param paintFuncs The {@link PaintFuncs} to paint with.
   * @param paintData User data to pass to paint callbacks.
   * @param paletteIndex The index of the font's color palette to use.
   * @param foreground The foreground color, unpremultiplied.
   * @returns `true` if the glyph was painted, `false` otherwise.
   */
  paintGlyphOrFail(
    glyphId: number,
    paintFuncs: PaintFuncs,
    paintData?: unknown,
    paletteIndex: number = 0,
    foreground: Color = { red: 0, green: 0, blue: 0, alpha: 255 },
  ): boolean {
    const paintDataPtr = register_callback_data_pointer(paintData);
    try {
      return !!exports.hb_font_paint_glyph_or_fail(
        this.ptr,
        glyphId,
        paintFuncs.ptr,
        paintDataPtr,
        paletteIndex,
        color_to_int(foreground),
      );
    } finally {
      remove_callback_data_pointer(paintDataPtr);
    }
  }

  /**
   * Fetches the PNG image for a glyph.
   *
   * To get an optimally sized PNG blob, the PPEM values must be set on the font.
   * If PPEM is unset, the blob returned will be the largest PNG available.
   * @param glyphId A glyph index.
   * @returns The PNG image for the glyph, or `undefined` if the glyph has no PNG
   * image.
   */
  getGlyphColorPng(glyphId: number): Uint8Array | undefined {
    const blob = exports.hb_ot_color_glyph_reference_png(this.ptr, glyphId);
    const length = exports.hb_blob_get_length(blob);
    let png: Uint8Array | undefined;
    if (length) {
      const dataPtr = exports.hb_blob_get_data(blob, 0);
      png = Module.HEAPU8.slice(dataPtr, dataPtr + length);
    }
    exports.hb_blob_destroy(blob);
    return png;
  }

  /**
   * Return a glyph as an SVG path string.
   * @param glyphId ID of the requested glyph in the font.
   * @returns SVG path data string.
   */
  glyphToPath(glyphId: number): string {
    const path: string[] = [];
    this.drawGlyph(glyphId, getPathDrawFuncs(), path);
    return path.join("");
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
   * @returns [x, y] origin coordinates, or undefined if not available.
   */
  glyphHOrigin(glyphId: number): [number, number] | undefined {
    const sp = Module.stackSave();
    const xPtr = Module.stackAlloc(4);
    const yPtr = Module.stackAlloc(4);
    let origin: [number, number] | undefined;
    if (exports.hb_font_get_glyph_h_origin(this.ptr, glyphId, xPtr, yPtr)) {
      origin = [Module.HEAP32[xPtr / 4], Module.HEAP32[yPtr / 4]];
    }
    Module.stackRestore(sp);
    return origin;
  }

  /**
   * Return glyph vertical origin.
   * @param glyphId ID of the requested glyph in the font.
   * @returns [x, y] origin coordinates, or undefined if not available.
   */
  glyphVOrigin(glyphId: number): [number, number] | undefined {
    const sp = Module.stackSave();
    const xPtr = Module.stackAlloc(4);
    const yPtr = Module.stackAlloc(4);
    let origin: [number, number] | undefined;
    if (exports.hb_font_get_glyph_v_origin(this.ptr, glyphId, xPtr, yPtr)) {
      origin = [Module.HEAP32[xPtr / 4], Module.HEAP32[yPtr / 4]];
    }
    Module.stackRestore(sp);
    return origin;
  }

  /**
   * Return glyph extents.
   * @param glyphId ID of the requested glyph in the font.
   * @returns An object with xBearing, yBearing, width, and height, or undefined.
   */
  glyphExtents(glyphId: number): GlyphExtents | undefined {
    const sp = Module.stackSave();
    const extentsPtr = Module.stackAlloc(16);
    let extents: GlyphExtents | undefined;
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
   * Fetches the glyph ID for a Unicode code point in the specified
   * font, with an optional variation selector.
   *
   * If `variationSelector` is 0, it is equivalent to
   * {@link Font.nominalGlyph}; otherwise it is equivalent to
   * {@link Font.variationGlyph}.
   *
   * @param unicode The Unicode code point to query.
   * @param variationSelector A variation-selector code point.
   * @returns The glyph ID, or undefined if not found.
   */
  glyph(unicode: number, variationSelector: number = 0): number | undefined {
    const sp = Module.stackSave();
    const glyphIdPtr = Module.stackAlloc(4);
    let glyphId: number | undefined;
    if (
      exports.hb_font_get_glyph(
        this.ptr,
        unicode,
        variationSelector,
        glyphIdPtr,
      )
    ) {
      glyphId = Module.HEAPU32[glyphIdPtr / 4];
    }
    Module.stackRestore(sp);
    return glyphId;
  }

  /**
   * Fetches the nominal glyph ID for a Unicode code point in the
   * specified font.
   *
   * This version of the function should not be used to fetch glyph IDs
   * for code points modified by variation selectors. For variation-selector
   * support, use {@link Font.variationGlyph} or {@link Font.glyph}.
   *
   * @param unicode The Unicode code point to query.
   * @returns The glyph ID, or undefined if not found.
   */
  nominalGlyph(unicode: number): number | undefined {
    const sp = Module.stackSave();
    const glyphIdPtr = Module.stackAlloc(4);
    let glyphId: number | undefined;
    if (exports.hb_font_get_nominal_glyph(this.ptr, unicode, glyphIdPtr)) {
      glyphId = Module.HEAPU32[glyphIdPtr / 4];
    }
    Module.stackRestore(sp);
    return glyphId;
  }

  /**
   * Fetches the glyph ID for a Unicode code point when followed by
   * by the specified variation-selector code point, in the specified
   * font.
   *
   * @param unicode The Unicode code point to query.
   * @param variationSelector The variation-selector code point to query.
   * @returns The glyph ID, or undefined if not found.
   */
  variationGlyph(
    unicode: number,
    variationSelector: number,
  ): number | undefined {
    const sp = Module.stackSave();
    const glyphIdPtr = Module.stackAlloc(4);
    let glyphId: number | undefined;
    if (
      exports.hb_font_get_variation_glyph(
        this.ptr,
        unicode,
        variationSelector,
        glyphIdPtr,
      )
    ) {
      glyphId = Module.HEAPU32[glyphIdPtr / 4];
    }
    Module.stackRestore(sp);
    return glyphId;
  }

  /**
   * Return glyph ID from name.
   * @param name Name of the requested glyph in the font.
   * @returns The glyph ID, or undefined if not found.
   */
  glyphFromName(name: string): number | undefined {
    const sp = Module.stackSave();
    const glyphIdPtr = Module.stackAlloc(4);
    const namePtr = string_to_utf8_ptr(name);
    let glyphId: number | undefined;
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
    const commands: SvgPathCommand[] = [];
    this.drawGlyph(glyphId, getJsonDrawFuncs(), commands);
    return commands;
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
   * Applies a list of font-variation settings to a font.
   *
   * Note that this overrides all existing variations set on the font.
   * Axes not included in `variations` will be effectively set to their
   * default values.
   *
   * @param variations Array of variation settings to apply.
   */
  setVariations(variations: Variation[]): void {
    const sp = Module.stackSave();
    const vars = Module.stackAlloc(8 * variations.length);
    variations.forEach((variation, i) => {
      variation.writeTo(vars + i * 8);
    });
    exports.hb_font_set_variations(this.ptr, vars, variations.length);
    Module.stackRestore(sp);
  }

  /** Set the font's font functions. */
  setFuncs(fontFuncs: FontFuncs): void {
    exports.hb_font_set_funcs(this.ptr, fontFuncs.ptr);
  }

  /**
   * Fetches the optical bound of a glyph positioned at the margin of text.
   * The direction identifies which edge of the glyph to query.
   * @param lookupIndex Index of the feature lookup to query.
   * @param direction Edge of the glyph to query.
   * @param glyph A glyph id.
   * @returns Adjustment value. Negative values mean the glyph will stick out of the margin.
   */
  getLookupOpticalBound(
    lookupIndex: number,
    direction: Direction,
    glyph: number,
  ): number {
    return exports.hb_ot_layout_lookup_get_optical_bound(
      this.ptr,
      lookupIndex,
      direction,
      glyph,
    );
  }

  /**
   * Fetches a list of the caret positions defined for a ligature glyph in the
   * GDEF table of the font.
   *
   * Note that a ligature that is formed from n characters will have n-1
   * caret positions. The first character is not represented in the array,
   * since its caret position is the glyph position.
   *
   * The positions returned by this function are 'unshaped', and will have to
   * be fixed up for kerning that may be applied to the ligature glyph.
   *
   * @param direction The text direction to use.
   * @param glyph The glyph to query.
   * @returns An array of caret positions.
   */
  getLigatureCarets(direction: Direction, glyph: number): number[] {
    const sp = Module.stackSave();
    let startOffset = 0;
    let caretCount = STATIC_ARRAY_SIZE;
    const caretCountPtr = Module.stackAlloc(4);
    const caretArrayPtr = Module.stackAlloc(STATIC_ARRAY_SIZE * 4);
    const carets: number[] = [];
    while (caretCount == STATIC_ARRAY_SIZE) {
      Module.HEAPU32[caretCountPtr / 4] = caretCount;
      exports.hb_ot_layout_get_ligature_carets(
        this.ptr,
        direction,
        glyph,
        startOffset,
        caretCountPtr,
        caretArrayPtr,
      );
      caretCount = Module.HEAPU32[caretCountPtr / 4];
      const caretArray = Module.HEAP32.subarray(
        caretArrayPtr / 4,
        caretArrayPtr / 4 + caretCount,
      );
      carets.push(...Array.from(caretArray as Int32Array));
      startOffset += caretCount;
    }
    Module.stackRestore(sp);
    return carets;
  }

  /**
   * Fetches metrics value corresponding to `metricsTag` from the font.
   *
   * @param metricsTag {@link MetricsTag} of metrics value you like to fetch.
   * @returns The metrics value, or undefined if not found in the font.
   */
  getMetricPosition(metricsTag: MetricsTag): number | undefined {
    const sp = Module.stackSave();
    const positionPtr = Module.stackAlloc(4);
    let position: number | undefined;
    if (exports.hb_ot_metrics_get_position(this.ptr, metricsTag, positionPtr)) {
      position = Module.HEAP32[positionPtr / 4];
    }
    Module.stackRestore(sp);
    return position;
  }

  /**
   * Fetches metrics value corresponding to `metricsTag` from the font, and
   * synthesizes a value if the value is missing in the font.
   *
   * @param metricsTag {@link MetricsTag} of metrics value you like to fetch.
   * @returns The metrics value.
   */
  getMetricPositionWithFallback(metricsTag: MetricsTag): number {
    const sp = Module.stackSave();
    const positionPtr = Module.stackAlloc(4);
    exports.hb_ot_metrics_get_position_with_fallback(
      this.ptr,
      metricsTag,
      positionPtr,
    );
    const position = Module.HEAP32[positionPtr / 4];
    Module.stackRestore(sp);
    return position;
  }

  /**
   * Fetches metrics value corresponding to `metricsTag` from the font with the
   * current font variation settings applied.
   *
   * @param metricsTag {@link MetricsTag} of metrics value you like to fetch.
   * @returns The requested metric value.
   */
  getMetricVariation(metricsTag: MetricsTag): number {
    return exports.hb_ot_metrics_get_variation(this.ptr, metricsTag);
  }

  /**
   * Fetches horizontal metrics value corresponding to `metricsTag` from the
   * font with the current font variation settings applied.
   *
   * @param metricsTag {@link MetricsTag} of metrics value you like to fetch.
   * @returns The requested metric value.
   */
  getMetricXVariation(metricsTag: MetricsTag): number {
    return exports.hb_ot_metrics_get_x_variation(this.ptr, metricsTag);
  }

  /**
   * Fetches vertical metrics value corresponding to `metricsTag` from the font
   * with the current font variation settings applied.
   *
   * @param metricsTag {@link MetricsTag} of metrics value you like to fetch.
   * @returns The requested metric value.
   */
  getMetricYVariation(metricsTag: MetricsTag): number {
    return exports.hb_ot_metrics_get_y_variation(this.ptr, metricsTag);
  }
}
