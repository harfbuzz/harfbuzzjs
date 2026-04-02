import createHarfBuzz from "./harfbuzz.js";
import { init } from "./helpers";

export { init } from "./helpers";
export * from "./types";
export * from "./blob";
export * from "./face";
export * from "./font";
export * from "./font-funcs";
export * from "./buffer";
export * from "./shape";

export default createHarfBuzz().then(async (module) => {
  init(module);
  return await import("./index");
});
