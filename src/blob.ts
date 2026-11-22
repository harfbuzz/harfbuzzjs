import { Module, exports, freeFuncPtr, track, untrack } from "./helpers";

/**
 * An object representing a {@link https://harfbuzz.github.io/harfbuzz-hb-blob.html | HarfBuzz blob}.
 * A blob wraps a chunk of binary data, typically the contents of a font file.
 */
export class Blob implements Disposable {
  readonly ptr: number;

  /**
   * @param data Binary font data.
   */
  constructor(data: Uint8Array | ArrayBuffer) {
    const array = data instanceof Uint8Array ? data : new Uint8Array(data);
    const blobPtr = exports.malloc(array.byteLength);
    Module.HEAPU8.set(array, blobPtr);
    this.ptr = exports.hb_blob_create(
      blobPtr,
      array.byteLength,
      2 /* HB_MEMORY_MODE_WRITABLE */,
      blobPtr,
      freeFuncPtr,
    );
    track(this, exports.hb_blob_destroy);
  }

  /**
   * Free the blob now instead of when it is garbage collected, as at the end
   * of a `using` declaration's scope. Idempotent; using the blob afterwards
   * throws. A {@link Face} created from the blob keeps the font data alive
   * until it is freed too.
   */
  [Symbol.dispose](): void {
    untrack(this);
  }
}
