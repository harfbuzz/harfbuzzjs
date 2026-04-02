import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  outDir: 'dist',
  deps: { neverBundle: ['./harfbuzz.js'] },
  copy: ['harfbuzz.js', 'harfbuzz.wasm', 'harfbuzz-subset.wasm'],
});
