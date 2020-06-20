#!/bin/bash

[ -d harfbuzz/src ] || git clone --depth=1 https://github.com/harfbuzz/harfbuzz
(cd harfbuzz; git pull --ff-only)

# ideally you will only need `clang` `lld` packages be installed to make this work
clang \
    -I./libc/include -Oz \
	-fno-exceptions -fno-rtti -fno-threadsafe-statics -fvisibility-inlines-hidden \
	--target=wasm32 \
	-nostdlib -nostdinc \
	-Wno-builtin-requires-header \
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
	-Wl,--export=hb_face_get_upem \
	-Wl,--export=free \
	-Wl,--export=free_ptr \
	-Wl,--export=__heap_base \
	hbjs.c -DHAVE_CONFIG_OVERRIDE_H -I. -DHB_EXPERIMENTAL_API \
	$@ libc/malloc.cc libc/zephyr-string.c libc/main.c harfbuzz/src/harfbuzz.cc \
	-o hb.wasm
# add '-Wl,--export=hbjs_glyph_svg \' to expose glyph draw as svg

# optionally you can install and use wasm-opt
#wasm-opt -Oz hb.wasm -o hb.wasm
