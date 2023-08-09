import type { Exports, GlyphFlag } from '~/schema/export'
import type { BlobInstace } from '~/schema/blob'
import type { FaceInstance } from '~/schema/face'
import type { FontInstance } from '~/schema/font'
import type { BufferInstance } from '~/schema/buffer'
import { hb_tag, hb_untag, buffer_flag } from '~/utils/index'

const HB_MEMORY_MODE_WRITABLE = 2
const HB_SET_VALUE_INVALID = -1

export function hb(instance: WebAssembly.Instance) {
  const exports = instance.exports as unknown as Exports
  const memory = exports.memory
  const heapu8 = new Uint8Array(memory.buffer)
  const heapu32 = new Uint32Array(memory.buffer)
  const heapi32 = new Int32Array(memory.buffer)
  const heapf32 = new Float32Array(memory.buffer)
  const utf8Decoder = new TextDecoder('utf8')

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

  /**
  * Create an object representing a Harfbuzz face.
  * @param {BlobInstace} blob An object returned from `createBlob`.
  * @param {number} index The index of the font in the blob. (0 for most files,
  *  or a 0-indexed font number if the `blob` came form a TTC/OTC file.)
  **/
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
        const result = resolveTypedArrayFromSet(unicodeSetPtr, 'u32') as Uint32Array
        exports.hb_set_destroy(unicodeSetPtr)
        return result
      },
      destory() {
        exports.hb_face_destroy(ptr)
      }
    }
  }

  var pathBufferSize = 65536; // should be enough for most glyphs
  var pathBuffer = exports.malloc(pathBufferSize); // permanently allocated

  var nameBufferSize = 256; // should be enough for most glyphs
  var nameBuffer = exports.malloc(nameBufferSize); // permanently allocated

  function createFont(face: FaceInstance) {
    const ptr = exports.hb_font_create(face.ptr)

    /**
    * Return a glyph as an SVG path string.
    * @param {number} glyphId ID of the requested glyph in the font.
    **/
    function glyphToPath(glyphId: number) {
      const length = exports.hbjs_glyph_svg(ptr, glyphId, pathBuffer, pathBufferSize)
      return length > 0 ? utf8Decoder.decode(heapu8.subarray(pathBuffer, pathBuffer + length)) : ''
    }

    /**
     * Return glyph name.
     * @param {number} glyphId ID of the requested glyph in the font.
     **/
    function glyphName(glyphId: number) {
      exports.hb_font_glyph_to_string(ptr, glyphId, nameBuffer, nameBufferSize)
      const array = heapu8.subarray(nameBuffer, nameBuffer + nameBufferSize)
      return utf8Decoder.decode(array.slice(0, array.indexOf(0)))
    }

    return {
      ptr,
      glyphName,
      glyphToPath,
      /**
      * Return a glyph as a JSON path string
      * based on format described on https://svgwg.org/specs/paths/#InterfaceSVGPathSegment
      * @param {number} glyphId ID of the requested glyph in the font.
      **/
      glyphToJson(glyphId: number) {
        const path = glyphToPath(glyphId)
        return path.replace(/([MLQCZ])/g, '|$1 ')
          .split('|')
          .filter(v => v.length)
          .map(v => {
            const row = v.split(/[ ,]/g)
            return {
              type: row[0],
              values: row.slice(1).filter(v => v.length).map(Number)
            }
          })
      },
      /**
      * Set the font's scale factor, affecting the position values returned from
      * shaping.
      * @param {number} xScale Units to scale in the X dimension.
      * @param {number} yScale Units to scale in the Y dimension.
      **/
      setScale(xScale: number, yScale: number) {
        exports.hb_font_set_scale(ptr, xScale, yScale)
      },
      /**
       * Set the font's variations.
       * @param {object} variations Dictionary of variations to set
       **/
      setVariations (variations: Record<string, number>) {
        var entries = Object.entries(variations)
        var vars = exports.malloc(8 * entries.length)
        entries.forEach(function (entry, i) {
          heapu32[vars / 4 + i * 2 + 0] = hb_tag(entry[0]);
          heapf32[vars / 4 + i * 2 + 1] = entry[1];
        });
        exports.hb_font_set_variations(ptr, vars, entries.length)
        exports.free(vars)
      },
      destroy() {
        exports.hb_font_destroy(ptr)
      }
    }
  }

  function createBuffer() {
    const ptr = exports.hb_buffer_create()

    return {
      ptr,
      /**
      * Add text to the buffer.
      * @param {string} text Text to be added to the buffer.
      **/
      addText(text: string) {
        const str = createJsString(text)
        exports.hb_buffer_add_utf16(ptr, str.ptr, str.length, 0, str.length)
        str.free()
      },
      /**
      * Set buffer script, language and direction.
      *
      * This needs to be done before shaping.
      **/
      guessSegmentProperties() {
        return exports.hb_buffer_guess_segment_properties(ptr)
      },
      /**
      * Set buffer direction explicitly.
      * @param {string} direction: One of "ltr", "rtl", "ttb" or "btt"
      */
      setDirection(dir: 'ltr' | 'rtl' | 'ttb' | 'btt') {
        exports.hb_buffer_set_direction(ptr, {
          ltr: 4,
          rtl: 5,
          ttb: 6,
          btt: 7
        }[dir] || 0)
      },
      /**
      * Set buffer flags explicitly.
      * @param {string[]} flags: A list of strings which may be either:
      */
      setFlags(flags: Array<'BOT' | 'EOT' | 'PRESERVE_DEFAULT_IGNORABLES' | 'REMOVE_DEFAULT_IGNORABLES' | 'DO_NOT_INSERT_DOTTED_CIRCLE' | 'PRODUCE_UNSAFE_TO_CONCAT'>) {
        const flag = flags.reduce((res, item) => res |= buffer_flag(item), 0)

        exports.hb_buffer_set_flags(ptr, flag)
      },
      /**
      * Set buffer language explicitly.
      * @param {string} language: The buffer language
      */
      setLanguage(language: string) {
        const str = createAsciiString(language)
        exports.hb_buffer_set_language(ptr, exports.hb_language_from_string(str.ptr, -1))
        str.free()
      },
       /**
      * Set buffer script explicitly.
      * @param {string} script: The buffer script
      */
       setScript (script: string) {
        var str = createAsciiString(script)
        exports.hb_buffer_set_script(ptr, exports.hb_script_from_string(str.ptr, -1))
        str.free()
      },
      /**
      * Set the Harfbuzz clustering level.
      *
      * Affects the cluster values returned from shaping.
      * @param {number} level: Clustering level. See the Harfbuzz manual chapter
      * on Clusters.
      **/
      setClusterLevel (level: number) {
        exports.hb_buffer_set_cluster_level(ptr, level)
      },
      /**
      * Return the buffer contents as a JSON object.
      *
      * After shaping, this function will return an array of glyph information
      * objects. Each object will have the following attributes:
      *
      *   - g: The glyph ID
      *   - cl: The cluster ID
      *   - ax: Advance width (width to advance after this glyph is painted)
      *   - ay: Advance height (height to advance after this glyph is painted)
      *   - dx: X displacement (adjustment in X dimension when painting this glyph)
      *   - dy: Y displacement (adjustment in Y dimension when painting this glyph)
      *   - flags: Glyph flags like `HB_GLYPH_FLAG_UNSAFE_TO_BREAK` (0x1)
      **/
     json() {
      const length = exports.hb_buffer_get_length(ptr)
      const infosPtr = exports.hb_buffer_get_glyph_infos(ptr, 0)
      const infosPtr32 = infosPtr / 4
      const positionsPtr32 = exports.hb_buffer_get_glyph_positions(ptr, 0) / 4
      const infos = heapu32.subarray(infosPtr32, infosPtr32 + 5 * length)
      const positions = heapi32.subarray(positionsPtr32, positionsPtr32 + 5 * length)
      const result: Array<{
        g: number
        cl: number
        ax: number
        ay: number
        dx: number
        dy: number
        flags: GlyphFlag
      }> = []
      for (var i = 0; i < length; ++i) {
        result.push({
          g: infos[i * 5 + 0],
          cl: infos[i * 5 + 2],
          ax: positions[i * 5 + 0],
          ay: positions[i * 5 + 1],
          dx: positions[i * 5 + 2],
          dy: positions[i * 5 + 3],
          flags: exports.hb_glyph_info_get_glyph_flags(infosPtr + i * 20)
        });
      }
      return result
     },
     destroy() { exports.hb_buffer_destroy(ptr) }
    }
  }

  function shape(font: FontInstance, buffer: BufferInstance) {
    exports.hb_shape(font.ptr, buffer.ptr, 0, 0)
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

  function createJsString(text: string) {
    const ptr = exports.malloc(text.length * 2)
    const words = new Uint16Array(exports.memory.buffer, ptr, text.length)
    for (let i = 0; i < words.length; ++i) words[i] = text.charCodeAt(i)
    return {
      ptr,
      length: words.length,
      free() { exports.free(ptr) }
    }
  }

  /**
  * Use when you know the input range should be ASCII.
  * Faster than encoding to UTF-8
  **/
  function createAsciiString(text: string) {
    const length = text.length
    const ptr = exports.malloc(length + 1)
    for (let i = 0; i < length; ++i) {
      const char = text.charCodeAt(i)
      if (char > 127) throw new Error('Expected ASCII text')
      heapu8[ptr + i] = char
    }
    heapu8[ptr + length] = 0

    return {
      ptr,
      length,
      free() { exports.free(ptr) }
    }
  }

  function shapeWithTrace(
    font: FontInstance,
    buffer: BufferInstance,
    features: string,
    stop_at: number,
    stop_phase: 0 | 1 | 2
  ) {
    const length = 1024 * 1024
    const traceBuffer = exports.malloc(length)
    const featureStr = createAsciiString(features)
    const traceLength = exports.hbjs_shape_with_trace(font.ptr, buffer.ptr, featureStr.ptr, stop_at, stop_phase, traceBuffer, length)
    featureStr.free()
    const trace = utf8Decoder.decode(heapu8.subarray(traceBuffer, traceBuffer + traceLength - 1))
    exports.free(traceBuffer)

    return JSON.parse(trace)
  }

  return {
    createBlob,
    createFace,
    createFont,
    createBuffer,
    shape,
    shapeWithTrace
  }
}