import {
  Module,
  exports,
  freeFuncPtr,
  HB_MEMORY_MODE_WRITABLE,
} from "./helpers";

/**
 * An object representing a {@link https://harfbuzz.github.io/harfbuzz-hb-blob.html | HarfBuzz blob}.
 * A blob wraps a chunk of binary data, typically the contents of a font file.
 */
export class Blob {
  readonly ptr: number;

  /**
   * @param data Binary font data.
   */
  constructor(data: ArrayBuffer) {
    const blobPtr = exports.malloc(data.byteLength);
    Module.HEAPU8.set(new Uint8Array(data), blobPtr);
    this.ptr = exports.hb_blob_create(
      blobPtr,
      data.byteLength,
      HB_MEMORY_MODE_WRITABLE,
      blobPtr,
      freeFuncPtr,
    );
  }

  /** Free the object. */
  destroy() {
    exports.hb_blob_destroy(this.ptr);
  }
}
