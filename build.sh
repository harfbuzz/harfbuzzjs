#!/bin/bash

[ -d harfbuzz/src ] || git clone --depth=1 https://github.com/harfbuzz/harfbuzz
(cd harfbuzz; git pull)

# Or, -DHB_EXTERN=__attribute__((used))
clang \
    -I./libc/include -Oz \
	-fno-exceptions -fno-rtti -fno-threadsafe-statics -fvisibility-inlines-hidden \
	--target=wasm32 \
	-nostdlib -nostdinc \
	-flto \
	-DHB_TINY -DHB_USE_INTERNAL_QSORT \
	-Wl,--no-entry \
	-Wl,--strip-all \
	-Wl,--lto-O3 \
	-Wl,--gc-sections \
	-Wl,--export=malloc \
	-Wl,--export=hb_blob_create \
	-Wl,--export=hb_face_create \
	-Wl,--export=hb_font_create \
	-Wl,--export=hb_buffer_create \
	-Wl,--export=hb_buffer_add_utf8 \
	-Wl,--export=hb_buffer_guess_segment_properties \
	-Wl,--export=hb_buffer_set_direction \
	-Wl,--export=hb_shape \
	-Wl,--export=hb_buffer_get_glyph_infos \
	-Wl,--export=hb_buffer_get_glyph_positions \
	-Wl,--export=hb_buffer_get_length \
	-Wl,--export=hb_buffer_destroy \
	-Wl,--export=hb_font_destroy \
	-Wl,--export=hb_face_destroy \
	-Wl,--export=hb_blob_destroy \
	-Wl,--export=hb_blob_get_length \
	-Wl,--export=hb_font_set_scale \
	-Wl,--export=free \
	libc/emmalloc.cpp libc/zephyr-string.c libc/main.c harfbuzz/src/harfbuzz.cc
# wasm-opt is from binaryen package
wasm-opt -Oz a.out -o hb.wasm && rm a.out

# emscripten based
# --profiling-funcs
# em++ -std=c++11 \
#  -I./libc/include -Oz -s SUPPORT_ERRNO=1 -s EXIT_RUNTIME=0 -s WASM_OBJECT_FILES=0 --llvm-lto 1 -s MALLOC=emmalloc --closure 1 -s ENVIRONMENT=node \
#  -fno-exceptions -fno-rtti -fno-threadsafe-statics -fvisibility-inlines-hidden \
# 	-DHB_TINY -DHB_USE_INTERNAL_QSORT \
#  -s 'EXPORTED_FUNCTIONS=["_malloc", "_hb_blob_create", "_hb_face_create", "_hb_font_create", "_hb_buffer_create", "_hb_buffer_add_utf8", "_hb_buffer_guess_segment_properties", "_hb_buffer_set_direction", "_hb_shape", "_hb_buffer_get_glyph_infos", "_hb_buffer_get_glyph_positions", "_hb_buffer_get_length", "_hb_buffer_destroy", "_hb_font_destroy", "_hb_face_destroy", "_hb_blob_destroy", "_hb_blob_get_length", "_hb_font_set_scale", "_free"]' \
# 	libc/zephyr-string.c libc/main.c harfbuzz/src/harfbuzz.cc
