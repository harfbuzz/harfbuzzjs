#!/bin/bash

[ -d libraqm-nofreetype ] || git clone --depth=1 https://github.com/ebraminio/libraqm-nofreetype

clang \
    -Oz \
    -I../fribidi.js/fribidi/lib -I../fribidi.js/fribidi/build/lib \
    ../fribidi.js/fribidi/lib/fribidi*.c -I../fribidi.js/fribidi/build/gen.tab/ \
    ../libc/zephyr-string.c ../libc/malloc.cc ../libc/main.c \
    libraqm-nofreetype/src/raqm.c \
    ../harfbuzz/src/harfbuzz.cc -I../harfbuzz/src/ \
	-DHB_TINY -DHB_USE_INTERNAL_QSORT \
    -UHAVE_CONFIG_H \
    -DHAVE_STRINGIZE -DHAVE_MEMORY_H -DHAVE_MEMSET -DHAVE_MEMMOVE -DHAVE_STRING_H \
    --target=wasm32 -nostdlib -nostdinc \
    -Wno-builtin-requires-header -Wno-int-conversion -Wno-enum-conversion \
    -flto \
    -Wl,--no-entry \
    -Wl,--lto-O3 \
    -Wl,--strip-all \
    -Wl,--gc-sections \
    -Wl,--export=malloc \
    -Wl,--export=free \
    -Wl,--export=hb_blob_create \
    -Wl,--export=hb_blob_get_length \
    -Wl,--export=hb_blob_destroy \
    -Wl,--export=hb_face_create \
    -Wl,--export=hb_face_get_glyph_count \
    -Wl,--export=hb_face_destroy \
    -Wl,--export=hb_font_create \
    -Wl,--export=hb_font_set_scale \
    -Wl,--export=hb_font_destroy \
    -Wl,--export=raqm_create \
    -Wl,--export=raqm_reference \
    -Wl,--export=raqm_destroy \
    -Wl,--export=raqm_set_text \
    -Wl,--export=raqm_set_text_utf8 \
    -Wl,--export=raqm_set_par_direction \
    -Wl,--export=raqm_set_language \
    -Wl,--export=raqm_set_harfbuzz_font \
    -Wl,--export=raqm_set_harfbuzz_font_range \
    -Wl,--export=raqm_set_invisible_glyph \
    -Wl,--export=raqm_layout \
    -Wl,--export=raqm_get_glyphs \
    -Wl,--export=raqm_index_to_position \
    -Wl,--export=raqm_position_to_index \
    -Wl,--export=__heap_base \
    -I../libc/include -DSTDC_HEADERS -DHAVE_STDLIB_H -DFRIBIDI_NO_DEPRECATED
# TODO: Add raqm_add_font_feature and strtol to libc
wasm-opt -Oz a.out -o raqm.wasm && rm a.out
#mv a.out fribidi.wasm