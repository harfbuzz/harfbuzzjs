#!/bin/bash
set -e

[ -x "$(command -v git)" ] || (echo "Please install git from your package manager" && exit 1)
[ -x "$(command -v clang)" ] || (echo "Please install clang from your package manager" && exit 1)

[ -d harfbuzz/src ] || git clone https://github.com/harfbuzz/harfbuzz
(cd harfbuzz; git checkout 3.0.0)

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
	-Wl,--export=hb_blob_get_data \
	-Wl,--export=hb_blob_get_length \
	-Wl,--export=hb_face_create \
	-Wl,--export=hb_face_reference_table \
	-Wl,--export=hb_font_create \
	-Wl,--export=hb_buffer_create \
	-Wl,--export=hb_buffer_add_utf8 \
	-Wl,--export=hb_buffer_add_utf16 \
	-Wl,--export=hb_buffer_guess_segment_properties \
	-Wl,--export=hb_buffer_set_direction \
	-Wl,--export=hb_buffer_set_cluster_level \
	-Wl,--export=hb_buffer_set_flags \
	-Wl,--export=hb_buffer_set_script \
	-Wl,--export=hb_script_from_string \
	-Wl,--export=hb_buffer_set_language \
	-Wl,--export=hb_language_from_string \
	-Wl,--export=hb_shape \
	-Wl,--export=hb_buffer_get_glyph_infos \
	-Wl,--export=hb_buffer_get_glyph_positions \
	-Wl,--export=hb_buffer_get_length \
	-Wl,--export=hb_buffer_destroy \
	-Wl,--export=hb_font_destroy \
	-Wl,--export=hb_face_destroy \
	-Wl,--export=hb_face_get_upem \
	-Wl,--export=hb_blob_destroy \
	-Wl,--export=hb_blob_get_length \
	-Wl,--export=hb_font_set_scale \
	-Wl,--export=hb_face_get_upem \
	-Wl,--export=hbjs_glyph_svg \
	-Wl,--export=hbjs_shape_with_trace \
	-Wl,--export=hb_ot_var_get_axis_infos \
	-Wl,--export=hb_font_set_variations \
	-Wl,--export=free \
	-Wl,--export=free_ptr \
	-Wl,--export=__heap_base \
	hbjs.c -DHAVE_CONFIG_OVERRIDE_H -I. -DHB_EXPERIMENTAL_API \
	libc/malloc.cc libc/zephyr-string.c libc/prf.c libc/strtol.c libc/sprintf.c libc/main.c harfbuzz/src/harfbuzz.cc \
	-o hb.wasm $@
