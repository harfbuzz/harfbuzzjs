import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  outDir: 'dist',
  deps: { neverBundle: ['./hb.js'] },
  copy: ['hb.js', 'hb.wasm', 'hb-subset.wasm'],
});
