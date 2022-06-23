#!/bin/bash

clang \
    -I../libc/include -I. -O3 \
	-fno-exceptions -fno-rtti -fno-threadsafe-statics -fvisibility-inlines-hidden \
	--target=wasm32 \
	-nostdlib -nostdinc \
	-flto \
	-DHB_TINY -DHB_USE_INTERNAL_QSORT -DHAVE_CONFIG_OVERRIDE_H \
	-Wl,--no-entry \
	-Wl,--strip-all \
	-Wl,--lto-O3 \
	-Wl,--gc-sections \
	-Wl,--export=malloc \
	-Wl,--export=hb_blob_create \
	-Wl,--export=hb_face_create \
	-Wl,--export=hb_set_create \
	-Wl,--export=hb_set_add \
	-Wl,--export=hb_set_del \
	-Wl,--export=hb_set_destroy \
	-Wl,--export=hb_set_union \
	-Wl,--export=hb_set_clear \
	-Wl,--export=hb_set_invert \
	-Wl,--export=hb_face_reference_blob \
	-Wl,--export=hb_blob_get_data \
	-Wl,--export=hb_blob_get_length \
	-Wl,--export=hb_blob_destroy \
	-Wl,--export=hb_face_get_empty \
	-Wl,--export=hb_face_destroy \
	-Wl,--export=hb_subset_input_create_or_fail \
	-Wl,--export=hb_subset_input_reference \
	-Wl,--export=hb_subset_input_destroy \
	-Wl,--export=hb_subset_input_set_user_data \
	-Wl,--export=hb_subset_input_get_user_data \
	-Wl,--export=hb_subset_input_unicode_set \
	-Wl,--export=hb_subset_input_glyph_set \
	-Wl,--export=hb_subset_input_set \
	-Wl,--export=hb_subset_input_get_flags \
	-Wl,--export=hb_subset_input_set_flags \
	-Wl,--export=hb_subset_or_fail \
	-Wl,--export=free \
	-Wl,--export=__heap_base \
	../libc/malloc.cc ../libc/zephyr-string.c ../libc/main.c ../harfbuzz/src/harfbuzz.cc \
	../harfbuzz/src/hb-subset*.cc \
	-o hb-subset.wasm
