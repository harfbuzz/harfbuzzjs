#!/bin/bash

(cd ..; [ -d harfbuzz/src ] || git clone --depth=1 https://github.com/harfbuzz/harfbuzz)
(cd ../harfbuzz; git pull)

clang \
    -I../libc/include -I. -Oz \
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
	-Wl,--export=hb_set_union \
	-Wl,--export=hb_face_reference_blob \
	-Wl,--export=hb_blob_get_data \
	-Wl,--export=hb_blob_get_length \
	-Wl,--export=hb_blob_destroy \
	-Wl,--export=hb_face_destroy \
	-Wl,--export=hb_subset_input_create_or_fail \
	-Wl,--export=hb_subset_input_reference \
	-Wl,--export=hb_subset_input_destroy \
	-Wl,--export=hb_subset_input_unicode_set \
	-Wl,--export=hb_subset_input_glyph_set \
	-Wl,--export=hb_subset_input_nameid_set \
	-Wl,--export=hb_subset_input_drop_tables_set \
	-Wl,--export=hb_subset_input_set_drop_hints \
	-Wl,--export=hb_subset_input_get_drop_hints \
	-Wl,--export=hb_subset_input_set_desubroutinize \
	-Wl,--export=hb_subset_input_get_desubroutinize \
	-Wl,--export=hb_subset_input_set_retain_gids \
	-Wl,--export=hb_subset_input_get_retain_gids \
	-Wl,--export=hb_subset \
	-Wl,--export=free \
	../libc/emmalloc.cpp ../libc/zephyr-string.c ../libc/main.c ../harfbuzz/src/harfbuzz.cc \
	../harfbuzz/src/hb-subset*.cc
wasm-opt -Oz a.out -o hb-subset.wasm && rm a.out