#!/bin/bash

[ -d harfbuzz ] || git clone --depth=1 https://github.com/harfbuzz/harfbuzz
(cd harfbuzz; git pull)
emcmake cmake -Bbuild -H. -GNinja && ninja -Cbuild
