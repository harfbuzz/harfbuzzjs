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
harfbuzz, it's easy to use other parts of the using `module._hb*` functions,
see example/nohbjs.js to see how.

## [wapm](https://wapm.io/)
The wapm's `.wasm` file is build on `/wapm` directory of this project, run ./build.sh of
that folder to get `.wasm` a full version of harfbuzz for wapm, currently released
[here](https://wapm.io/package/ebraminio/harfbuzz).

## Need more of the API?
File a bug, mention your usecase and wait for a new release.

You can also add the symbols you like to CMakeLists.txt and compile the pack yourself.

Another option also would be to use `.wasm` and `.js` available at `/wapm` folder of the release
which is the full version but don't have an optimal size.
