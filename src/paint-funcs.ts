import {
  Module,
  exports,
  registry,
  STATIC_ARRAY_SIZE,
  hb_untag,
  register_callback_data_pointer,
  get_callback_data,
  remove_callback_data_pointer,
  color_from_int,
  color_to_int,
} from "./helpers";
import type {
  Color,
  ColorLine,
  ColorStop,
  GlyphExtents,
  PaintCompositeMode,
  PaintExtend,
} from "./types";
import { Font } from "./font";

function decode_color_line(colorLinePtr: number): ColorLine {
  const extend = exports.hb_color_line_get_extend(colorLinePtr) as PaintExtend;
  const colorStops: ColorStop[] = [];
  const sp = Module.stackSave();
  const countPtr = Module.stackAlloc(4);
  const stopsPtr = Module.stackAlloc(STATIC_ARRAY_SIZE * 12);
  let startOffset = 0;
  let count = STATIC_ARRAY_SIZE;
  while (count === STATIC_ARRAY_SIZE) {
    Module.HEAPU32[countPtr / 4] = count;
    exports.hb_color_line_get_color_stops(
      colorLinePtr,
      startOffset,
      countPtr,
      stopsPtr,
    );
    count = Module.HEAPU32[countPtr / 4];
    for (let i = 0; i < count; i++) {
      const o = (stopsPtr + i * 12) / 4;
      colorStops.push({
        offset: Module.HEAPF32[o],
        isForeground: Module.HEAPU32[o + 1] !== 0,
        color: color_from_int(Module.HEAPU32[o + 2]),
      });
    }
    startOffset += count;
  }
  Module.stackRestore(sp);
  return { extend, colorStops };
}

/**
 * A callback to apply a transform to subsequent paint calls. The transform is
 * applied after the current transform, and remains in effect until a matching
 * call to {@link PaintFuncs.setPopTransformFunc}.
 * @param xx xx component of the transform matrix
 * @param yx yx component of the transform matrix
 * @param xy xy component of the transform matrix
 * @param yy yy component of the transform matrix
 * @param dx dx component of the transform matrix
 * @param dy dy component of the transform matrix
 * @param paintData the data accompanying the paint functions in
 * {@link Font.paintGlyph}
 * @param userData the user data pointer passed to
 * {@link PaintFuncs.setPushTransformFunc}
 */
export type PaintPushTransformFunc = (
  xx: number,
  yx: number,
  xy: number,
  yy: number,
  dx: number,
  dy: number,
  paintData: unknown,
  userData: unknown,
) => void;

/**
 * A callback to undo the effect of a prior call to the
 * {@link PaintFuncs.setPushTransformFunc} callback.
 * @param paintData the data accompanying the paint functions in
 * {@link Font.paintGlyph}
 * @param userData the user data pointer passed to
 * {@link PaintFuncs.setPopTransformFunc}
 */
export type PaintPopTransformFunc = (
  paintData: unknown,
  userData: unknown,
) => void;

/**
 * A callback to render a color glyph by glyph index.
 * @param glyph the glyph ID
 * @param font the {@link Font}
 * @param paintData the data accompanying the paint functions in
 * {@link Font.paintGlyph}
 * @param userData the user data pointer passed to
 * {@link PaintFuncs.setColorGlyphFunc}
 * @returns `true` if the glyph was painted, `false` otherwise.
 */
export type PaintColorGlyphFunc = (
  glyph: number,
  font: Font,
  paintData: unknown,
  userData: unknown,
) => boolean;

/**
 * A callback to clip subsequent paint calls to the outline of a glyph.
 *
 * The coordinates of the glyph outline are expected in the current `font` scale
 * (ie. the results of calling {@link Font.drawGlyph} with `font`). The outline
 * is transformed by the current transform.
 *
 * This clip is applied in addition to the current clip, and remains in effect
 * until a matching call to {@link PaintFuncs.setPopClipFunc}.
 * @param glyph the glyph ID
 * @param font the {@link Font}
 * @param paintData the data accompanying the paint functions in
 * {@link Font.paintGlyph}
 * @param userData the user data pointer passed to
 * {@link PaintFuncs.setPushClipGlyphFunc}
 */
export type PaintPushClipGlyphFunc = (
  glyph: number,
  font: Font,
  paintData: unknown,
  userData: unknown,
) => void;

/**
 * A callback to clip subsequent paint calls to a rectangle.
 *
 * The coordinates of the rectangle are interpreted according to the current
 * transform.
 *
 * This clip is applied in addition to the current clip, and remains in effect
 * until a matching call to {@link PaintFuncs.setPopClipFunc}.
 * @param xmin min X for the rectangle
 * @param ymin min Y for the rectangle
 * @param xmax max X for the rectangle
 * @param ymax max Y for the rectangle
 * @param paintData the data accompanying the paint functions in
 * {@link Font.paintGlyph}
 * @param userData the user data pointer passed to
 * {@link PaintFuncs.setPushClipRectangleFunc}
 */
export type PaintPushClipRectangleFunc = (
  xmin: number,
  ymin: number,
  xmax: number,
  ymax: number,
  paintData: unknown,
  userData: unknown,
) => void;

/**
 * A callback to undo the effect of a prior call to the
 * {@link PaintFuncs.setPushClipGlyphFunc} or
 * {@link PaintFuncs.setPushClipRectangleFunc} callback.
 * @param paintData the data accompanying the paint functions in
 * {@link Font.paintGlyph}
 * @param userData the user data pointer passed to
 * {@link PaintFuncs.setPopClipFunc}
 */
export type PaintPopClipFunc = (paintData: unknown, userData: unknown) => void;

/**
 * A callback to paint a color everywhere within the current clip.
 *
 * When `isForeground` is true, this color originates from the foreground-color
 * sentinel in the font's color data. The `color` parameter still carries a
 * fully resolved RGBA value (with any paint-tree alpha already applied), so
 * backends that do not need to distinguish the foreground can simply use
 * `color` directly.
 *
 * Backends that defer foreground resolution (e.g. to honor a CSS `currentColor`
 * or a runtime uniform) should substitute their own foreground RGB when
 * `isForeground` is true, but must combine the alpha from `color` with their
 * foreground alpha, since it encodes additional modulation from the paint tree.
 * For this mode to work correctly, the caller should pass a fully-opaque
 * foreground color to {@link Font.paintGlyph}, so that the alpha in `color`
 * reflects only the paint-tree contribution.
 * @param isForeground whether the color is the foreground
 * @param color the color to use, unpremultiplied
 * @param paintData the data accompanying the paint functions in
 * {@link Font.paintGlyph}
 * @param userData the user data pointer passed to
 * {@link PaintFuncs.setColorFunc}
 */
export type PaintColorFunc = (
  isForeground: boolean,
  color: Color,
  paintData: unknown,
  userData: unknown,
) => void;

/**
 * A callback to paint a glyph image.
 *
 * This method is called for glyphs with image blobs in the CBDT, sbix or SVG
 * tables. The `format` identifies the kind of data that is contained in
 * `image`. Possible values include `"png "`, `"svg "` and `"BGRA"`.
 *
 * The image dimensions and glyph extents are provided if available, and should
 * be used to size and position the image.
 * @param image the image data
 * @param width width of the raster image in pixels, or 0
 * @param height height of the raster image in pixels, or 0
 * @param format the image format as a tag
 * @param extents glyph extents for desired rendering
 * @param paintData the data accompanying the paint functions in
 * {@link Font.paintGlyph}
 * @param userData the user data pointer passed to
 * {@link PaintFuncs.setImageFunc}
 * @returns Whether the operation was successful.
 */
export type PaintImageFunc = (
  image: Uint8Array,
  width: number,
  height: number,
  format: string,
  extents: GlyphExtents | undefined,
  paintData: unknown,
  userData: unknown,
) => boolean;

/**
 * A callback to paint a linear gradient everywhere within the current clip. The
 * coordinates of the points are interpreted according to the current transform; see the
 * OpenType spec
 * [COLR](https://learn.microsoft.com/en-us/typography/opentype/spec/colr)
 * section for details on how the points define the direction of the gradient, and
how to interpret the `colorLine`.
 * @param colorLine color information for the gradient
 * @param x0 X coordinate of the first point
 * @param y0 Y coordinate of the first point
 * @param x1 X coordinate of the second point
 * @param y1 Y coordinate of the second point
 * @param x2 X coordinate of the third point
 * @param y2 Y coordinate of the third point
 * @param paintData the data accompanying the paint functions in
 * {@link Font.paintGlyph}
 * @param userData the user data pointer passed to
 * {@link PaintFuncs.setLinearGradientFunc}
 */
export type PaintLinearGradientFunc = (
  colorLine: ColorLine,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  paintData: unknown,
  userData: unknown,
) => void;

/**
 * A callback to paint a radial gradient everywhere within the current clip. The
 * coordinates of the points are interpreted according to the current transform; see the
 * OpenType spec
 * [COLR](https://learn.microsoft.com/en-us/typography/opentype/spec/colr)
 * section for details on how the points define the direction of the gradient, and
how to interpret the `colorLine`.
 * @param colorLine color information for the gradient
 * @param x0 X coordinate of the first circle's center
 * @param y0 Y coordinate of the first circle's center
 * @param r0 radius of the first circle
 * @param x1 X coordinate of the second circle's center
 * @param y1 Y coordinate of the second circle's center
 * @param r1 radius of the second circle
 * @param paintData the data accompanying the paint functions in
 * {@link Font.paintGlyph}
 * @param userData the user data pointer passed to
 * {@link PaintFuncs.setRadialGradientFunc}
 */
export type PaintRadialGradientFunc = (
  colorLine: ColorLine,
  x0: number,
  y0: number,
  r0: number,
  x1: number,
  y1: number,
  r1: number,
  paintData: unknown,
  userData: unknown,
) => void;

/**
 * A callback to paint a sweep gradient everywhere within the current clip. The
 * coordinates of the points are interpreted according to the current transform; see the
 * OpenType spec
 * [COLR](https://learn.microsoft.com/en-us/typography/opentype/spec/colr)
 * section for details on how the points define the direction of the gradient, and
how to interpret the `colorLine`.
 * @param colorLine color information for the gradient
 * @param x0 X coordinate of the circle's center
 * @param y0 Y coordinate of the circle's center
 * @param startAngle the start angle, in radians
 * @param endAngle the end angle, in radians
 * @param paintData the data accompanying the paint functions in
 * {@link Font.paintGlyph}
 * @param userData the user data pointer passed to
 * {@link PaintFuncs.setSweepGradientFunc}
 */
export type PaintSweepGradientFunc = (
  colorLine: ColorLine,
  x0: number,
  y0: number,
  startAngle: number,
  endAngle: number,
  paintData: unknown,
  userData: unknown,
) => void;

/**
 * A callback to use an intermediate surface for subsequent paint calls. The
 * drawing is redirected to the intermediate surface until a matching call to
 * {@link PaintFuncs.setPopGroupFunc}.
 * @param paintData the data accompanying the paint functions in
 * {@link Font.paintGlyph}
 * @param userData the user data pointer passed to
 * {@link PaintFuncs.setPushGroupFunc}
 */
export type PaintPushGroupFunc = (
  paintData: unknown,
  userData: unknown,
) => void;

/**
 * A callback to undo the effect of a prior call to the
 * {@link PaintFuncs.setPushGroupFunc} callback: it stops the redirection to the
 * intermediate surface, then composites it on the previous surface using the
 * compositing mode passed to this call.
 * @param mode the {@link PaintCompositeMode} to use
 * @param paintData the data accompanying the paint functions in
 * {@link Font.paintGlyph}
 * @param userData the user data pointer passed to
 * {@link PaintFuncs.setPopGroupFunc}
 */
export type PaintPopGroupFunc = (
  mode: PaintCompositeMode,
  paintData: unknown,
  userData: unknown,
) => void;

/**
 * A callback to fetch a custom palette override color for `colorIndex`.
 *
 * Custom palette colors override colors from the font's selected color palette.
 * It is not necessary to override all palette entries; return `undefined` for
 * entries that should be taken from the font palette.
 *
 * This function might be called multiple times, but the custom palette is
 * expected to remain unchanged for the duration of one {@link Font.paintGlyph}
 * call.
 * @param colorIndex color index to fetch
 * @param paintData the data accompanying the paint functions in
 * {@link Font.paintGlyph}
 * @param userData the user data pointer passed to
 * {@link PaintFuncs.setCustomPaletteColorFunc}
 * @returns the custom color, or `undefined` to use the font palette.
 */
export type PaintCustomPaletteColorFunc = (
  colorIndex: number,
  paintData: unknown,
  userData: unknown,
) => Color | undefined;

/**
 * An object representing
 * {@link https://harfbuzz.github.io/harfbuzz-hb-paint.html | HarfBuzz paint functions}.
 *
 * Glyph paint callbacks.
 *
 * The callbacks assume that the caller maintains a stack of current transforms,
 * clips and intermediate surfaces, as evidenced by the pairs of push/pop
 * callbacks. The push/pop calls will be properly nested, so it is fine to store
 * the different kinds of object on a single stack.
 *
 * Not all callbacks are required for all kinds of glyphs. For rendering COLRv0
 * or non-color outline glyphs, the gradient callbacks are not needed, and the
 * composite callback only needs to handle simple alpha compositing
 * ({@link PaintCompositeMode.SRC_OVER}).
 *
 * The paint-image callback is only needed for glyphs with image blobs in the
 * CBDT, sbix or SVG tables.
 *
 * The custom-palette-color callback is only necessary if you want to override
 * colors from the font palette with custom colors.
 */
export class PaintFuncs {
  readonly ptr: number;
  private funcPtrs: number[] = [];
  private userDataPtrs: number[] = [];

  constructor() {
    this.ptr = exports.hb_paint_funcs_create();
    const ptr = this.ptr;
    const funcPtrs = this.funcPtrs;
    const userDataPtrs = this.userDataPtrs;
    registry.register(this, () => {
      exports.hb_paint_funcs_destroy(ptr);
      for (const ptr of funcPtrs) Module.removeFunction(ptr);
      for (const ptr of userDataPtrs) remove_callback_data_pointer(ptr);
    });
  }

  /**
   * Sets the push-transform callback on the paint functions object.
   * @param func The push-transform callback.
   * @param userData Data to pass to `func`.
   */
  setPushTransformFunc(func: PaintPushTransformFunc, userData?: unknown): void {
    const userDataPtr = register_callback_data_pointer(userData);
    this.userDataPtrs.push(userDataPtr);
    const funcPtr = Module.addFunction(
      (funcs, paintData, xx, yx, xy, yy, dx, dy, user) =>
        func(
          xx,
          yx,
          xy,
          yy,
          dx,
          dy,
          get_callback_data(paintData),
          get_callback_data(user),
        ),
      "viiffffffi",
    );
    this.funcPtrs.push(funcPtr);
    exports.hb_paint_funcs_set_push_transform_func(
      this.ptr,
      funcPtr,
      userDataPtr,
      0,
    );
  }

  /**
   * Sets the pop-transform callback on the paint functions object.
   * @param func The pop-transform callback.
   * @param userData Data to pass to `func`.
   */
  setPopTransformFunc(func: PaintPopTransformFunc, userData?: unknown): void {
    const userDataPtr = register_callback_data_pointer(userData);
    this.userDataPtrs.push(userDataPtr);
    const funcPtr = Module.addFunction(
      (funcs, paintData, user) =>
        func(get_callback_data(paintData), get_callback_data(user)),
      "viii",
    );
    this.funcPtrs.push(funcPtr);
    exports.hb_paint_funcs_set_pop_transform_func(
      this.ptr,
      funcPtr,
      userDataPtr,
      0,
    );
  }

  /**
   * Sets the color-glyph callback on the paint functions object.
   * @param func The color-glyph callback.
   * @param userData Data to pass to `func`.
   */
  setColorGlyphFunc(func: PaintColorGlyphFunc, userData?: unknown): void {
    const userDataPtr = register_callback_data_pointer(userData);
    this.userDataPtrs.push(userDataPtr);
    const funcPtr = Module.addFunction(
      (funcs, paintData, glyph, fontPtr, user) =>
        func(
          glyph,
          new Font(fontPtr),
          get_callback_data(paintData),
          get_callback_data(user),
        )
          ? 1
          : 0,
      "iiiiii",
    );
    this.funcPtrs.push(funcPtr);
    exports.hb_paint_funcs_set_color_glyph_func(
      this.ptr,
      funcPtr,
      userDataPtr,
      0,
    );
  }

  /**
   * Sets the push-clip-glyph callback on the paint functions object.
   * @param func The push-clip-glyph callback.
   * @param userData Data to pass to `func`.
   */
  setPushClipGlyphFunc(func: PaintPushClipGlyphFunc, userData?: unknown): void {
    const userDataPtr = register_callback_data_pointer(userData);
    this.userDataPtrs.push(userDataPtr);
    const funcPtr = Module.addFunction(
      (funcs, paintData, glyph, fontPtr, user) =>
        func(
          glyph,
          new Font(fontPtr),
          get_callback_data(paintData),
          get_callback_data(user),
        ),
      "viiiii",
    );
    this.funcPtrs.push(funcPtr);
    exports.hb_paint_funcs_set_push_clip_glyph_func(
      this.ptr,
      funcPtr,
      userDataPtr,
      0,
    );
  }

  /**
   * Sets the push-clip-rectangle callback on the paint functions object.
   * @param func The push-clip-rectangle callback.
   * @param userData Data to pass to `func`.
   */
  setPushClipRectangleFunc(
    func: PaintPushClipRectangleFunc,
    userData?: unknown,
  ): void {
    const userDataPtr = register_callback_data_pointer(userData);
    this.userDataPtrs.push(userDataPtr);
    const funcPtr = Module.addFunction(
      (funcs, paintData, xmin, ymin, xmax, ymax, user) =>
        func(
          xmin,
          ymin,
          xmax,
          ymax,
          get_callback_data(paintData),
          get_callback_data(user),
        ),
      "viiffffi",
    );
    this.funcPtrs.push(funcPtr);
    exports.hb_paint_funcs_set_push_clip_rectangle_func(
      this.ptr,
      funcPtr,
      userDataPtr,
      0,
    );
  }

  /**
   * Sets the pop-clip callback on the paint functions object.
   * @param func The pop-clip callback.
   * @param userData Data to pass to `func`.
   */
  setPopClipFunc(func: PaintPopClipFunc, userData?: unknown): void {
    const userDataPtr = register_callback_data_pointer(userData);
    this.userDataPtrs.push(userDataPtr);
    const funcPtr = Module.addFunction(
      (funcs, paintData, user) =>
        func(get_callback_data(paintData), get_callback_data(user)),
      "viii",
    );
    this.funcPtrs.push(funcPtr);
    exports.hb_paint_funcs_set_pop_clip_func(this.ptr, funcPtr, userDataPtr, 0);
  }

  /**
   * Sets the paint-color callback on the paint functions object.
   * @param func The paint-color callback.
   * @param userData Data to pass to `func`.
   */
  setColorFunc(func: PaintColorFunc, userData?: unknown): void {
    const userDataPtr = register_callback_data_pointer(userData);
    this.userDataPtrs.push(userDataPtr);
    const funcPtr = Module.addFunction(
      (funcs, paintData, isForeground, color, user) =>
        func(
          isForeground !== 0,
          color_from_int(color),
          get_callback_data(paintData),
          get_callback_data(user),
        ),
      "viiiii",
    );
    this.funcPtrs.push(funcPtr);
    exports.hb_paint_funcs_set_color_func(this.ptr, funcPtr, userDataPtr, 0);
  }

  /**
   * Sets the paint-image callback on the paint functions object.
   * @param func The paint-image callback.
   * @param userData Data to pass to `func`.
   */
  setImageFunc(func: PaintImageFunc, userData?: unknown): void {
    const userDataPtr = register_callback_data_pointer(userData);
    this.userDataPtrs.push(userDataPtr);
    const funcPtr = Module.addFunction(
      (
        funcs,
        paintData,
        blob,
        width,
        height,
        format,
        slant,
        extentsPtr,
        user,
      ) => {
        const length = exports.hb_blob_get_length(blob);
        const dataPtr = exports.hb_blob_get_data(blob, 0);
        const image = Module.HEAPU8.subarray(dataPtr, dataPtr + length);
        let extents: GlyphExtents | undefined;
        if (extentsPtr) {
          extents = {
            xBearing: Module.HEAP32[extentsPtr / 4],
            yBearing: Module.HEAP32[extentsPtr / 4 + 1],
            width: Module.HEAP32[extentsPtr / 4 + 2],
            height: Module.HEAP32[extentsPtr / 4 + 3],
          };
        }
        return func(
          image,
          width,
          height,
          hb_untag(format),
          extents,
          get_callback_data(paintData),
          get_callback_data(user),
        )
          ? 1
          : 0;
      },
      "iiiiiiifii",
    );
    this.funcPtrs.push(funcPtr);
    exports.hb_paint_funcs_set_image_func(this.ptr, funcPtr, userDataPtr, 0);
  }

  /**
   * Sets the linear-gradient callback on the paint functions object.
   * @param func The linear-gradient callback.
   * @param userData Data to pass to `func`.
   */
  setLinearGradientFunc(
    func: PaintLinearGradientFunc,
    userData?: unknown,
  ): void {
    const userDataPtr = register_callback_data_pointer(userData);
    this.userDataPtrs.push(userDataPtr);
    const funcPtr = Module.addFunction(
      (funcs, paintData, colorLine, x0, y0, x1, y1, x2, y2, user) =>
        func(
          decode_color_line(colorLine),
          x0,
          y0,
          x1,
          y1,
          x2,
          y2,
          get_callback_data(paintData),
          get_callback_data(user),
        ),
      "viiiffffffi",
    );
    this.funcPtrs.push(funcPtr);
    exports.hb_paint_funcs_set_linear_gradient_func(
      this.ptr,
      funcPtr,
      userDataPtr,
      0,
    );
  }

  /**
   * Sets the radial-gradient callback on the paint functions object.
   * @param func The radial-gradient callback.
   * @param userData Data to pass to `func`.
   */
  setRadialGradientFunc(
    func: PaintRadialGradientFunc,
    userData?: unknown,
  ): void {
    const userDataPtr = register_callback_data_pointer(userData);
    this.userDataPtrs.push(userDataPtr);
    const funcPtr = Module.addFunction(
      (funcs, paintData, colorLine, x0, y0, r0, x1, y1, r1, user) =>
        func(
          decode_color_line(colorLine),
          x0,
          y0,
          r0,
          x1,
          y1,
          r1,
          get_callback_data(paintData),
          get_callback_data(user),
        ),
      "viiiffffffi",
    );
    this.funcPtrs.push(funcPtr);
    exports.hb_paint_funcs_set_radial_gradient_func(
      this.ptr,
      funcPtr,
      userDataPtr,
      0,
    );
  }

  /**
   * Sets the sweep-gradient callback on the paint functions object.
   * @param func The sweep-gradient callback.
   * @param userData Data to pass to `func`.
   */
  setSweepGradientFunc(func: PaintSweepGradientFunc, userData?: unknown): void {
    const userDataPtr = register_callback_data_pointer(userData);
    this.userDataPtrs.push(userDataPtr);
    const funcPtr = Module.addFunction(
      (funcs, paintData, colorLine, x0, y0, startAngle, endAngle, user) =>
        func(
          decode_color_line(colorLine),
          x0,
          y0,
          startAngle,
          endAngle,
          get_callback_data(paintData),
          get_callback_data(user),
        ),
      "viiiffffi",
    );
    this.funcPtrs.push(funcPtr);
    exports.hb_paint_funcs_set_sweep_gradient_func(
      this.ptr,
      funcPtr,
      userDataPtr,
      0,
    );
  }

  /**
   * Sets the push-group callback on the paint functions object.
   * @param func The push-group callback.
   * @param userData Data to pass to `func`.
   */
  setPushGroupFunc(func: PaintPushGroupFunc, userData?: unknown): void {
    const userDataPtr = register_callback_data_pointer(userData);
    this.userDataPtrs.push(userDataPtr);
    const funcPtr = Module.addFunction(
      (funcs, paintData, user) =>
        func(get_callback_data(paintData), get_callback_data(user)),
      "viii",
    );
    this.funcPtrs.push(funcPtr);
    exports.hb_paint_funcs_set_push_group_func(
      this.ptr,
      funcPtr,
      userDataPtr,
      0,
    );
  }

  /**
   * Sets the pop-group callback on the paint functions object.
   * @param func The pop-group callback.
   * @param userData Data to pass to `func`.
   */
  setPopGroupFunc(func: PaintPopGroupFunc, userData?: unknown): void {
    const userDataPtr = register_callback_data_pointer(userData);
    this.userDataPtrs.push(userDataPtr);
    const funcPtr = Module.addFunction(
      (funcs, paintData, mode, user) =>
        func(
          mode as PaintCompositeMode,
          get_callback_data(paintData),
          get_callback_data(user),
        ),
      "viiii",
    );
    this.funcPtrs.push(funcPtr);
    exports.hb_paint_funcs_set_pop_group_func(
      this.ptr,
      funcPtr,
      userDataPtr,
      0,
    );
  }

  /**
   * Sets the custom-palette-color callback on the paint functions object.
   * @param func The custom-palette-color callback.
   * @param userData Data to pass to `func`.
   */
  setCustomPaletteColorFunc(
    func: PaintCustomPaletteColorFunc,
    userData?: unknown,
  ): void {
    const userDataPtr = register_callback_data_pointer(userData);
    this.userDataPtrs.push(userDataPtr);
    const funcPtr = Module.addFunction(
      (funcs, paintData, colorIndex, colorPtr, user) => {
        const color = func(
          colorIndex,
          get_callback_data(paintData),
          get_callback_data(user),
        );
        if (color !== undefined) {
          Module.HEAPU32[colorPtr / 4] = color_to_int(color);
          return 1;
        }
        return 0;
      },
      "iiiiii",
    );
    this.funcPtrs.push(funcPtr);
    exports.hb_paint_funcs_set_custom_palette_color_func(
      this.ptr,
      funcPtr,
      userDataPtr,
      0,
    );
  }
}
