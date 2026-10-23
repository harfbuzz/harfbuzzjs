import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: false,
  outDir: "dist",
  deps: { neverBundle: ["./harfbuzz.js"] },
  copy: ["src/harfbuzz.d.ts"],
  // The classes implement Disposable, so consumers need its declarations even
  // without "esnext" in their lib.
  banner: { dts: '/// <reference lib="esnext.disposable" />' },
});
