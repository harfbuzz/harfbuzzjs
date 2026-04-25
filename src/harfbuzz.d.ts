import type { HarfBuzzModule } from "./index.mjs";

declare function createHarfBuzz(): Promise<HarfBuzzModule>;
export default createHarfBuzz;
