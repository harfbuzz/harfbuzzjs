#!/bin/bash

[ -f nanojpeg.c ] || wget http://svn.emphy.de/nanojpeg/trunk/nanojpeg/nanojpeg.c

clang \
    -Os \
    ../libc/zephyr-string.c ../libc/malloc.cc ../libc/main.c \
    nanojpeg.c \
    --target=wasm32 -nostdlib -nostdinc \
    -Wno-builtin-requires-header \
    -flto \
    -Wl,--no-entry \
    -Wl,--lto-O3 \
    -Wl,--strip-all \
    -Wl,--gc-sections \
    -Wl,--export=malloc \
    -Wl,--export=free \
    -Wl,--export=njInit \
    -Wl,--export=njDecode \
    -Wl,--export=njGetWidth \
    -Wl,--export=njGetHeight \
    -Wl,--export=njIsColor \
    -Wl,--export=njGetImage \
    -Wl,--export=njGetImageSize \
    -Wl,--export=njDone \
    -Wl,--export=__heap_base \
    -I../libc/include
wasm-opt -Os a.out -o nanojpeg.wasm && rm a.out
