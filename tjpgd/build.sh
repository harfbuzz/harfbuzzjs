#!/bin/bash

[ -d tjpgd1d ] || (echo Download it from http://elm-chan.org/fsw/tjpgd/tjpgd1d.zip && exit 1)

clang \
    -I ../libc -I ../libc/include \
    ../libc/{malloc.cc,zephyr-string.c} \
    -I tjpgd1d/src tjpgd1d/src/tjpgd.c \
    decoder.c \
    -flto -Oz -Wno-builtin-requires-header \
    -nostdlib -nostdinc \
    --target=wasm32 \
    -Wl,--no-entry \
    -Wl,--strip-all \
    -Wl,--lto-O3 \
    -Wl,--gc-sections \
    -Wl,--export=decode \
    -Wl,--export=malloc \
    -Wl,--export=free \
    -o tjpgd.wasm
