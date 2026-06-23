import {
  Module,
  exports,
  registry,
  register_callback_data_pointer,
  get_callback_data,
  remove_callback_data_pointer,
} from "./helpers";

/**
 * A callback to perform a `move-to` draw operation.
 * @param x X component of target point
 * @param y Y component of target point
 * @param drawData the data accompanying the draw functions in
 * {@link Font.drawGlyph}
 * @param userData the user data pointer passed to
 * {@link DrawFuncs.setMoveToFunc}
 */
export type DrawMoveToFunc = (
  x: number,
  y: number,
  drawData: unknown,
  userData: unknown,
) => void;

/**
 * A callback to perform a `line-to` draw operation.
 * @param x X component of target point
 * @param y Y component of target point
 * @param drawData the data accompanying the draw functions in
 * {@link Font.drawGlyph}
 * @param userData the user data pointer passed to
 * {@link DrawFuncs.setLineToFunc}
 */
export type DrawLineToFunc = (
  x: number,
  y: number,
  drawData: unknown,
  userData: unknown,
) => void;

/**
 * A callback to perform a `quadratic-to` draw operation.
 * @param cx X component of control point
 * @param cy Y component of control point
 * @param x X component of target point
 * @param y Y component of target point
 * @param drawData the data accompanying the draw functions in
 * {@link Font.drawGlyph}
 * @param userData the user data pointer passed to
 * {@link DrawFuncs.setQuadraticToFunc}
 */
export type DrawQuadraticToFunc = (
  cx: number,
  cy: number,
  x: number,
  y: number,
  drawData: unknown,
  userData: unknown,
) => void;

/**
 * A callback to perform a `cubic-to` draw operation.
 * @param c1x X component of first control point
 * @param c1y Y component of first control point
 * @param c2x X component of second control point
 * @param c2y Y component of second control point
 * @param x X component of target point
 * @param y Y component of target point
 * @param drawData the data accompanying the draw functions in
 * {@link Font.drawGlyph}
 * @param userData the user data pointer passed to
 * {@link DrawFuncs.setCubicToFunc}
 */
export type DrawCubicToFunc = (
  c1x: number,
  c1y: number,
  c2x: number,
  c2y: number,
  x: number,
  y: number,
  drawData: unknown,
  userData: unknown,
) => void;

/**
 * A callback to perform a `close-path` draw operation.
 * @param drawData the data accompanying the draw functions in
 * {@link Font.drawGlyph}
 * @param userData the user data pointer passed to
 * {@link DrawFuncs.setClosePathFunc}
 */
export type DrawClosePathFunc = (drawData: unknown, userData: unknown) => void;

/**
 * An object representing
 * {@link https://harfbuzz.github.io/harfbuzz-hb-draw.html | HarfBuzz draw functions}.
 *
 * Glyph draw callbacks.
 *
 * The {@link DrawFuncs.setMoveToFunc | move-to},
 * {@link DrawFuncs.setLineToFunc | line-to} and
 * {@link DrawFuncs.setCubicToFunc | cubic-to} callbacks are necessary to be
 * defined, but we translate {@link DrawFuncs.setQuadraticToFunc | quadratic-to}
 * calls to cubic-to if the callback isn't defined.
 */
export class DrawFuncs {
  readonly ptr: number;
  private funcPtrs: number[] = [];
  private userDataPtrs: number[] = [];

  constructor() {
    this.ptr = exports.hb_draw_funcs_create();
    const ptr = this.ptr;
    const funcPtrs = this.funcPtrs;
    const userDataPtrs = this.userDataPtrs;
    registry.register(this, () => {
      exports.hb_draw_funcs_destroy(ptr);
      for (const ptr of funcPtrs) Module.removeFunction(ptr);
      for (const ptr of userDataPtrs) remove_callback_data_pointer(ptr);
    });
  }

  /**
   * Sets move-to callback to the draw functions object.
   * @param func The move-to callback.
   * @param userData Data to pass to `func`.
   */
  setMoveToFunc(func: DrawMoveToFunc, userData?: unknown): void {
    const userDataPtr = register_callback_data_pointer(userData);
    this.userDataPtrs.push(userDataPtr);
    const funcPtr = Module.addFunction(
      (
        dfuncs: number,
        draw_data: number,
        draw_state: number,
        toX: number,
        toY: number,
        user_data: number,
      ) => {
        func(
          toX,
          toY,
          get_callback_data(draw_data),
          get_callback_data(user_data),
        );
      },
      "viiiffi",
    );
    this.funcPtrs.push(funcPtr);
    exports.hb_draw_funcs_set_move_to_func(this.ptr, funcPtr, userDataPtr, 0);
  }

  /**
   * Sets line-to callback to the draw functions object.
   * @param func The line-to callback.
   * @param userData Data to pass to `func`.
   */
  setLineToFunc(func: DrawLineToFunc, userData?: unknown): void {
    const userDataPtr = register_callback_data_pointer(userData);
    this.userDataPtrs.push(userDataPtr);
    const funcPtr = Module.addFunction(
      (
        dfuncs: number,
        draw_data: number,
        draw_state: number,
        toX: number,
        toY: number,
        user_data: number,
      ) => {
        func(
          toX,
          toY,
          get_callback_data(draw_data),
          get_callback_data(user_data),
        );
      },
      "viiiffi",
    );
    this.funcPtrs.push(funcPtr);
    exports.hb_draw_funcs_set_line_to_func(this.ptr, funcPtr, userDataPtr, 0);
  }

  /**
   * Sets quadratic-to callback to the draw functions object.
   * @param func The quadratic-to callback.
   * @param userData Data to pass to `func`.
   */
  setQuadraticToFunc(func: DrawQuadraticToFunc, userData?: unknown): void {
    const userDataPtr = register_callback_data_pointer(userData);
    this.userDataPtrs.push(userDataPtr);
    const funcPtr = Module.addFunction(
      (
        dfuncs: number,
        draw_data: number,
        draw_state: number,
        cX: number,
        cY: number,
        toX: number,
        toY: number,
        user_data: number,
      ) => {
        func(
          cX,
          cY,
          toX,
          toY,
          get_callback_data(draw_data),
          get_callback_data(user_data),
        );
      },
      "viiiffffi",
    );
    this.funcPtrs.push(funcPtr);
    exports.hb_draw_funcs_set_quadratic_to_func(
      this.ptr,
      funcPtr,
      userDataPtr,
      0,
    );
  }

  /**
   * Sets cubic-to callback to the draw functions object.
   * @param func The cubic-to callback.
   * @param userData Data to pass to `func`.
   */
  setCubicToFunc(func: DrawCubicToFunc, userData?: unknown): void {
    const userDataPtr = register_callback_data_pointer(userData);
    this.userDataPtrs.push(userDataPtr);
    const funcPtr = Module.addFunction(
      (
        dfuncs: number,
        draw_data: number,
        draw_state: number,
        c1X: number,
        c1Y: number,
        c2X: number,
        c2Y: number,
        toX: number,
        toY: number,
        user_data: number,
      ) => {
        func(
          c1X,
          c1Y,
          c2X,
          c2Y,
          toX,
          toY,
          get_callback_data(draw_data),
          get_callback_data(user_data),
        );
      },
      "viiiffffffi",
    );
    this.funcPtrs.push(funcPtr);
    exports.hb_draw_funcs_set_cubic_to_func(this.ptr, funcPtr, userDataPtr, 0);
  }

  /**
   * Sets close-path callback to the draw functions object.
   * @param func The close-path callback.
   * @param userData Data to pass to `func`.
   */
  setClosePathFunc(func: DrawClosePathFunc, userData?: unknown): void {
    const userDataPtr = register_callback_data_pointer(userData);
    this.userDataPtrs.push(userDataPtr);
    const funcPtr = Module.addFunction(
      (
        dfuncs: number,
        draw_data: number,
        draw_state: number,
        user_data: number,
      ) => {
        func(get_callback_data(draw_data), get_callback_data(user_data));
      },
      "viiii",
    );
    this.funcPtrs.push(funcPtr);
    exports.hb_draw_funcs_set_close_path_func(
      this.ptr,
      funcPtr,
      userDataPtr,
      0,
    );
  }
}
