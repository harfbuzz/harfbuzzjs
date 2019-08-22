#!/bin/bash

[ -d fribidi/lib ] || git clone --depth=1 https://github.com/fribidi/fribidi
(cd fribidi; git pull)

clang \
    -Oz \
    -Ifribidi/lib -Ifribidi/build/lib \
    $PWD/fribidi/lib/fribidi*.c -Ifribidi/build/gen.tab/ \
    ../libc/zephyr-string.c ../libc/malloc.cc ../libc/main.c \
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
    -Wl,--export=fribidi_charset_to_unicode \
    -Wl,--export=fribidi_get_bidi_types \
    -Wl,--export=fribidi_get_par_embedding_levels_ex \
    -Wl,--export=fribidi_unicode_to_charset \
    -I../libc/include -DSTDC_HEADERS -DHAVE_STDLIB_H -DFRIBIDI_NO_DEPRECATED
wasm-opt -Oz a.out -o fribidi.wasm && rm a.out
#mv a.out hb.wasm