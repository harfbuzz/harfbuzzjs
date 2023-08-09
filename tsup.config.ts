import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  minify: true,
  splitting: false,
  sourcemap: true,
  target: 'node16',
  dts: true,
  format: ['esm', 'cjs']
})