import { expect, it } from "vitest";
import * as hb from "../dist/index.mjs";

// Kept in its own file, so that filling up the WASM memory does not affect
// the other tests.
it("Blob throws when malloc fails instead of writing to address 0", function () {
  const data = new Uint8Array(64 * 1024 * 1024);
  const blobs = [];
  expect(function () {
    // 64 × 64 MiB is more than the 2 GiB the WASM memory can grow to.
    for (let i = 0; i < 64; i++) blobs.push(new hb.Blob(data));
  }).to.throw("Failed to allocate");
  // The module's static data, which lives at the start of the memory, is intact.
  expect(hb.versionString()).to.match(/^\d+\.\d+\.\d+$/);
});
