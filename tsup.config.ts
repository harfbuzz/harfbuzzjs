import { defineConfig } from 'tsup'

export default defineConfig([{
  entry: ['src/client.ts'],
  outDir: 'dist/client',
  minify: true,
  splitting: false,
  sourcemap: true,
  target: 'es2015',
  dts: true,
  format: ['esm', 'iife']
}, {
  entry: ['src/node.ts'],
  outDir: 'dist/node',
  minify: true,
  splitting: false,
  sourcemap: true,
  target: 'node16',
  dts: true,
  format: ['esm', 'cjs']
}])