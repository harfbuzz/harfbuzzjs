#!/bin/bash
./build.sh
(cd wapm; ./build.sh)
git archive -o latest.zip HEAD .
zip -g latest.zip harfbuzzjs.js harfbuzzjs.wasm wapm/harfbuzzjs.js wapm/harfbuzzjs.wasm
echo
echo "latest.zip"