import type { Exports } from '~/schema/export'
import type { BlobInstace } from '~/schema/blob'
import { hb_tag, hb_untag } from '~/utils/index'

const HB_MEMORY_MODE_WRITABLE = 2
const HB_SET_VALUE_INVALID = -1

export function hb(instance: WebAssembly.Instance) {
  const exports = instance.exports as unknown as Exports
  const memory = exports.memory
  const heapu8 = new Uint8Array(memory.buffer)
  const heapu32 = new Uint32Array(memory.buffer)
  const heapi32 = new Int32Array(memory.buffer)
  const heapf32 = new Float32Array(memory.buffer)

  /**
   * Create an object representing a Harfbuzz blob.
   * @param blob A blob of binary data (usually the contents of a font file).
   */
  function createBlob(blob: ArrayBuffer) {
    const blobPtr = exports.malloc(blob.byteLength)
    heapu8.set(new Uint8Array(blob), blobPtr)
    const ptr = exports.hb_blob_create(blobPtr, blob.byteLength, HB_MEMORY_MODE_WRITABLE, blobPtr, exports.free_ptr())

    return {
      ptr,
      destory() {
        exports.hb_blob_destroy(ptr)
      }
    }
  }

  function createFace(blob: BlobInstace, index: number) {
    const ptr = exports.hb_face_create(blob.ptr, index)
    const upem = exports.hb_face_get_upem(ptr)

    return {
      ptr,
      upem,
      /**
       * Return the binary contents of an OpenType table.
       * @param table Table name
       * @returns 
       */
      reference_table(table: string) {
        const blob = exports.hb_face_reference_table(ptr, hb_tag(table))
        const length = exports.hb_blob_get_length(blob)
        if (!length) return

        const blobPtr = exports.hb_blob_get_data(blob, null)
        return heapu8.subarray(blobPtr)
      },
      getAxisInfos() {
        const axis = exports.malloc(64 * 32)
        const c = exports.malloc(4)
        heapu32[c / 4] = 64
        exports.hb_ot_var_get_axis_infos(ptr, 0, c, axis)
        const result: { [p: string]: { min: number; default: number; max: number }} = {}
        Array.from({ length: heapu32[c / 4] }).forEach((_, i) => {
          result[hb_untag(heapu32[axis / 4 + i * 8 + 1])] = {
            min: heapf32[axis / 4 + i * 8 + 4],
            default: heapf32[axis / 4 + i * 8 + 5],
            max: heapf32[axis / 4 + i * 8 + 6]
          }
        })
        exports.free(c)
        exports.free(axis)

        return result
      },
      collectUnicodes() {
        const unicodeSetPtr = exports.hb_set_create()
        exports.hb_face_collect_unicodes(ptr, unicodeSetPtr)
        const result = resolveTypedArrayFromSet(unicodeSetPtr, 'u32')
        exports.hb_set_destroy(unicodeSetPtr)
        return result
      },
      destory() {
        exports.hb_face_destroy(ptr)
      }
    }
  }

  function resolveTypedArrayFromSet(ptr: number, type: 'u8' | 'u32' | 'i32' | 'f32') {
    const heap: Uint8Array | Uint32Array | Int32Array | Float32Array = type === 'u32'
      ? heapu32
      : type === 'i32'
      ? heapi32
      : type === 'f32'
      ? heapf32
      : heapu8

    const bytesPerElment = type === 'u32'
      ? Uint32Array.BYTES_PER_ELEMENT
      : type === 'i32'
      ? Int32Array.BYTES_PER_ELEMENT
      : type === 'f32'
      ? Float32Array.BYTES_PER_ELEMENT
      : Uint8Array.BYTES_PER_ELEMENT

    const setCount = exports.hb_set_get_population(ptr)
    const arrayPtr = exports.malloc(setCount * bytesPerElment)
    const arrayOffset = arrayPtr / bytesPerElment
    const array = heap.subarray(arrayOffset, arrayOffset + setCount)
    heap.set(array, arrayOffset)
    exports.hb_set_next_many(
      ptr,
      HB_SET_VALUE_INVALID,
      arrayPtr,
      setCount
    )
    return array
  }

  return {
    createBlob,
    createFace
  }
}