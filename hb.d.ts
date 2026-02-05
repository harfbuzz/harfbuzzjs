import type { HBModule } from './src/types'

declare function createHarfBuzz(): Promise<HBModule>;
export default createHarfBuzz;
