#!/bin/bash

[ -d harfbuzz ] || git clone --depth=1 https://github.com/behdad/harfbuzz
git pull
cd harfbuzz
emcmake cmake -Bwasmbuild -H. -GNinja -DHB_HARFBUZZJS=1 && ninja -Cwasmbuild
cp wasmbuild/harfbuzzjs.js ..
cp wasmbuild/harfbuzzjs.wasm ..
cd ..