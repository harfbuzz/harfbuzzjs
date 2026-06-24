import createHarfBuzz from "./harfbuzz.js";
import { init } from "./helpers";

export * from "./types";
export * from "./blob";
export * from "./face";
export * from "./font";
export * from "./font-funcs";
export * from "./draw-funcs";
export * from "./paint-funcs";
export * from "./buffer";
export * from "./feature";
export * from "./variation";
export * from "./shape";

init(await createHarfBuzz());
