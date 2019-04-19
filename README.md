# harfbuzzjs
Providing [harfbuzz](https://github.com/harfbuzz/harfbuzz) shaping
library for client/server side JavaScript projects.

## Building
1. Install emscripten, git, cmake, nodejs, ninja and Google Closure
and make sure emcmake (emscripten related) is on your path
2. ./build.sh

Not able to install all these in order to build `.wasm`? Download
it from [here](https://github.com/harfbuzz/harfbuzz/files/3099139/harfbuzzjs.zip)
and put `.wasm`/`.js` in root directory, or, download them from
releases tab of the project.

## Usage and testing
### Client
1. `(cd example && node server.js)`
2. Open the link on browser
### Node.js
1. `node examples/hbjs.example.node.js`

Even the fact we provide a tiny wrapper around main functionalities of
harfbuzz, it's easy to use other parts of the using module._hb* functions,
see example/nohbjs.js to see how that will be possible.
