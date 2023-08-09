export type Pointer = number
type BCP47LanguageTag = string

export enum BufferFlag {
  HB_BUFFER_FLAG_DEFAULT = 0x0,
  HB_BUFFER_FLAG_BOT = 0x1, /* Beginning-of-text */
  HB_BUFFER_FLAG_EOT = 0x2, /* End-of-text */
  HB_BUFFER_FLAG_PRESERVE_DEFAULT_IGNORABLES = 0x4,
  HB_BUFFER_FLAG_REMOVE_DEFAULT_IGNORABLES = 0x8,
  HB_BUFFER_FLAG_DO_NOT_INSERT_DOTTED_CIRCLE = 0x10,
  HB_BUFFER_FLAG_VERIFY = 0x20,
  HB_BUFFER_FLAG_PRODUCE_UNSAFE_TO_CONCAT	= 0x40,
  HB_BUFFER_FLAG_PRODUCE_SAFE_TO_INSERT_TATWEEL	= 0x80,
  HB_BUFFER_FLAG_DEFINED = 0xFF
}

export enum ClusterLevel {
  HB_BUFFER_CLUSTER_LEVEL_MONOTONE_GRAPHEMES = 0,
  HB_BUFFER_CLUSTER_LEVEL_MONOTONE_CHARACTERS = 1,
  HB_BUFFER_CLUSTER_LEVEL_CHARACTERS = 2
}

export enum GlyphFlag {
  HB_GLYPH_FLAG_UNSAFE_TO_BREAK = 0x1,
  HB_GLYPH_FLAG_UNSAFE_TO_CONCAT = 0x2,
  HB_GLYPH_FLAG_SAFE_TO_INSERT_TATWEEL = 0x4,
  HB_GLYPH_FLAG_DEFINED = 0x7
}

export interface Exports {
  memory: WebAssembly.Memory
  malloc: (length: number) => Pointer
  free: (ptr: Pointer) => void
  free_ptr: () => Pointer
  hb_blob_create: (data: Pointer, length: number, memoryMode: number, useData: Pointer, destroyFunction: Pointer) => Pointer
  hb_blob_destroy: (ptr: Pointer) => void
  hb_blob_get_length: (blob: Blob) => number
  hb_blob_get_data: (blob: Blob, length: number | null) => Pointer
  
  hb_face_create: (blobPtr: Pointer, index: number) => Pointer
  hb_face_get_upem: (facePtr: Pointer) => number
  hb_face_destroy: (ptr: Pointer) => void
  hb_face_reference_table: (ptr: Pointer, tag: number) => Blob
  hb_face_collect_unicodes: (facePtr: Pointer, setPtr: Pointer) => void
  hb_font_set_variations: (font: Pointer, variations: Pointer, variations_length: number) => void
  hb_ot_var_get_axis_infos: (ptr: Pointer, start_offset: number, axes_count: Pointer, axes_array: Pointer) => number

  hb_set_create: () => Pointer
  hb_set_destroy: (setPtr: Pointer) => void
  hb_set_get_population: (setPtr: Pointer) => number
  hb_set_next_many: (
    setPtr: Pointer,
    greaterThanUnicodePtr: Pointer,
    outputU32ArrayPtr: Pointer,
    size: number,
  ) => number

  hb_font_create: (facePtr: Pointer) => Pointer
  hb_font_set_scale: (fontPtr: Pointer, xScale: number, yScale: number) => void
  hb_font_glyph_to_string: (facePtr: Pointer, glyph: number, s: number, size: number) => void
  hb_font_destroy: (ptr: Pointer) => void
  hb_buffer_create: () => Pointer
  hb_buffer_add_utf8: (bufferPtr: Pointer, stringPtr: Pointer, stringLength: number, itemOffset: number, itemLength: number) => void
  hb_buffer_add_utf16: (bufferPtr: Pointer, stringPtr: Pointer, stringLength: number, itemOffset: number, itemLength: number) => void
  hb_buffer_guess_segment_properties: (bufferPtr: Pointer) => void
  hb_buffer_set_direction: (bufferPtr: Pointer, direction: number) => void
  hb_shape: (fontPtr: Pointer, bufferPtr: Pointer, features: any, numFeatures: number) => void
  hb_buffer_get_length: (bufferPtr: Pointer) => number
  hb_buffer_get_glyph_infos: (bufferPtr: Pointer, length: number) => any
  hb_buffer_get_glyph_positions: (bufferPtr: Pointer, length: number) => any
  hb_buffer_destroy: (bufferPtr: Pointer) => void
  hb_buffer_set_flags: (bufferPtr: Pointer, bufferFlag: BufferFlag) => void
  hb_buffer_set_language: (bufferPtr: Pointer, language: string) => void
  hb_buffer_set_script: (bufferPtr: Pointer, script: string) => void
  hb_buffer_set_cluster_level: (bufferPtr: Pointer, cluster_level: ClusterLevel) => void
  hb_glyph_info_get_glyph_flags: (bufferPtr: Pointer) => GlyphFlag
  hbjs_glyph_svg: (font: Pointer, glyphId: number, pathBuffer: number, size: number) => number
  hbjs_shape_with_trace: (font: Pointer, buffer: Pointer, features: Pointer, stop_at: number, stop_phase: number, outbuf: Pointer, buf_size: number) => number

  hb_language_from_string: (ptr: Pointer, len: number) => BCP47LanguageTag

  hb_script_from_string: (ptr: Pointer, len: number) => string
}