# harfbuzzjs
Providing [harfbuzz](https://github.com/harfbuzz/harfbuzz) shaping
library for client/server side JavaScript projects.

## Building
1. Install emscripten, git, cmake, nodejs, ninja and Google Closure
and make sure emcmake (emscripten related) is on your path
2. ./build.sh

Not able to install all these in order to build `.wasm`? Download
the pack from [releases tab](https://github.com/harfbuzz/harfbuzzjs/releases)
of the project.

## Usage and testing
### Browser
1. `(cd example && node server.js)`
2. Open the link on browser
### Node.js
1. `node examples/hbjs.example.node.js`

Even the fact we provide a tiny wrapper around main functionalities of
harfbuzz, it's easy to use other parts of the using module._hb* functions,
see example/nohbjs.js to see how that will be possible.

## [wapm](https://wapm.io/)
The wapm `.wasm` file is build on `/wapm` directory of this project, run ./build.sh of
that folder to get `.wasm` a full version of harfbuzz for wapm.

## I need more of the API, what should I do?
Either file a bug, mention your usecase and wait for a new release.

You can also add the symbol you like to CMakeLists.txt and compile the pack yourself.

Another option also would be use .wasm and .js available at `/wapm` folder which is
the full version but don't have an optimal size.
