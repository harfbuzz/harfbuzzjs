interface StringPtr {
  ptr: number;
  length: number;
  free: () => void;
}

import type { HarfBuzzModule } from "./types";

// Module-level WASM state (set once by init)
export let Module: HarfBuzzModule;
export let exports: HarfBuzzModule["wasmExports"];
export let freeFuncPtr: number;

const utf8Decoder = new TextDecoder("utf8");
const utf8Encoder = new TextEncoder();

export const STATIC_ARRAY_SIZE = 128;

export const registry = new FinalizationRegistry<() => void>((cleanup) => {
  cleanup();
});

/**
 * Initialize the HarfBuzz module.
 * @param module The Emscripten module instance created with {@link
 * createHarfBuzz}.
 */
export function init(module: EmscriptenModule) {
  Module = module as HarfBuzzModule;
  exports = Module.wasmExports;
  freeFuncPtr = Module.addFunction((ptr: number) => {
    exports.free(ptr);
  }, "vi");
}

export function hb_tag(s: string): number {
  return (
    ((s.charCodeAt(0) & 0xff) << 24) |
    ((s.charCodeAt(1) & 0xff) << 16) |
    ((s.charCodeAt(2) & 0xff) << 8) |
    ((s.charCodeAt(3) & 0xff) << 0)
  );
}

export function hb_untag(tag: number): string {
  return [
    String.fromCharCode((tag >> 24) & 0xff),
    String.fromCharCode((tag >> 16) & 0xff),
    String.fromCharCode((tag >> 8) & 0xff),
    String.fromCharCode((tag >> 0) & 0xff),
  ].join("");
}

export function utf8_ptr_to_string(ptr: number, length?: number): string {
  let end: number;
  if (length === undefined) end = Module.HEAPU8.indexOf(0, ptr);
  else end = ptr + length;
  return utf8Decoder.decode(Module.HEAPU8.subarray(ptr, end));
}

export function utf16_ptr_to_string(ptr: number, length: number): string {
  const end = ptr / 2 + length;
  return String.fromCharCode(...Module.HEAPU16.subarray(ptr / 2, end));
}

/**
 * Use when you know the input range should be ASCII.
 * Faster than encoding to UTF-8
 */
export function string_to_ascii_ptr(text: string): StringPtr {
  const ptr = exports.malloc(text.length + 1);
  for (let i = 0; i < text.length; ++i) {
    const char = text.charCodeAt(i);
    if (char > 127) throw new Error("Expected ASCII text");
    Module.HEAPU8[ptr + i] = char;
  }
  Module.HEAPU8[ptr + text.length] = 0;
  return {
    ptr,
    length: text.length,
    free: function () {
      exports.free(ptr);
    },
  };
}

export function string_to_utf8_ptr(text: string): StringPtr {
  const ptr = exports.malloc(text.length);
  utf8Encoder.encodeInto(text, Module.HEAPU8.subarray(ptr, ptr + text.length));
  return {
    ptr,
    length: text.length,
    free: function () {
      exports.free(ptr);
    },
  };
}

export function string_to_utf16_ptr(text: string): StringPtr {
  const ptr = exports.malloc(text.length * 2);
  const words = Module.HEAPU16.subarray(ptr / 2, ptr / 2 + text.length);
  for (let i = 0; i < words.length; ++i) words[i] = text.charCodeAt(i);
  return {
    ptr,
    length: words.length,
    free: function () {
      exports.free(ptr);
    },
  };
}

export function language_to_string(language: number): string {
  const ptr = exports.hb_language_to_string(language);
  return utf8_ptr_to_string(ptr);
}

export function language_from_string(str: string): number {
  const languageStr = string_to_ascii_ptr(str);
  const languagePtr = exports.hb_language_from_string(languageStr.ptr, -1);
  languageStr.free();
  return languagePtr;
}

/**
 * Return the typed array of HarfBuzz set contents.
 * @param setPtr Pointer of set
 * @returns Typed array instance
 */
export function typed_array_from_set(setPtr: number): Uint32Array {
  const setCount = exports.hb_set_get_population(setPtr);
  const arrayPtr = exports.malloc(setCount << 2);
  const arrayOffset = arrayPtr >> 2;
  exports.hb_set_next_many(
    setPtr,
    -1 /* HB_SET_VALUE_INVALID */,
    arrayPtr,
    setCount,
  );
  const array = Module.HEAPU32.subarray(arrayOffset, arrayOffset + setCount);
  return array;
}
