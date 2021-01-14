#!/bin/bash

[ -d zstd ] || git clone --depth=1 https://github.com/facebook/zstd
[ -f zstd/contrib/single_file_libs/zstddeclib.c ] || (cd zstd/contrib/single_file_libs && ./build_decoder_test.sh)

clang \
    -I ../libc \
    ../libc/{malloc.cc,zephyr-string.c} \
    zstd/contrib/single_file_libs/zstddeclib.c \
    -I ../libc/include \
    -flto -Oz -Wno-builtin-requires-header \
    -nostdlib -nostdinc \
    --target=wasm32 \
    -Wl,--no-entry \
    -Wl,--strip-all \
    -Wl,--lto-O3 \
    -Wl,--gc-sections \
    -Wl,--export=ZSTD_decompress \
    -Wl,--export=ZSTD_getFrameContentSize \
    -Wl,--export=malloc \
    -Wl,--export=free \
    -o zstd.wasm
