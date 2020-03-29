#!/bin/bash

[ -f stb_image.h ] || wget https://raw.githubusercontent.com/nothings/stb/master/stb_image.h

clang \
    -Oz \
    -DHAVE_CONFIG_OVERRIDE_H -I. \
    ../libc/zephyr-string.c ../libc/malloc.cc ../libc/main.c \
    main.c \
    --target=wasm32 -nostdlib -nostdinc \
    -Wno-builtin-requires-header \
    -flto \
    -Wl,--no-entry \
    -Wl,--lto-O3 \
    -Wl,--strip-all \
    -Wl,--gc-sections \
    -Wl,--export=malloc \
    -Wl,--export=free \
    -Wl,--export=stbi_load_from_memory \
    -Wl,--export=__heap_base \
    -I../libc/include
wasm-opt -Oz a.out -o stb_image.wasm && rm a.out
