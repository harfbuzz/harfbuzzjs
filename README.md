# harfbuzzjs
Providing [HarfBuzz](https://github.com/harfbuzz/harfbuzz) shaping
library for client/server side JavaScript projects.

See the demo [here](https://harfbuzz.github.io/harfbuzzjs/).

## Building
1. Install emscripten, git, cmake, nodejs, ninja and Google Closure
and make sure emcmake (emscripten related) is on your path
2. `./build.sh`

## Download
Download the pack from [releases tab](https://github.com/harfbuzz/harfbuzzjs/releases)
of the project, or just download the [demo page](https://harfbuzz.github.io/harfbuzzjs/) (the
demo source is in [gh-pages](https://github.com/harfbuzz/harfbuzzjs/tree/gh-pages) branch).

## Usage and testing
### Browser
1. `(cd example && node server.js)`
2. Open the link on browser
### Node.js
1. `node examples/hbjs.example.node.js`

Even the fact we provide a tiny wrapper around the main functionalities of
harfbuzz, it's easy to use other parts using `module._hb*` functions,
see `example/nohbjs.js` to see how, but you may need a custom build.

## [npm](https://www.npmjs.com/package/harfbuzzjs)
Can be added with `npm i harfbuzzjs` or `yarn add harfbuzzjs`, see the examples for
how to use it.

## [wapm](https://wapm.io/)
The wapm's `.wasm` file is built on `/wapm` directory of this project, run `./build.sh` of
that folder to get `.wasm`. A full version of harfbuzz for wapm is currently released
[here](https://wapm.io/package/ebraminio/harfbuzz).

## Need more of the library?
File a bug and mention your usecase.

You can also add the symbols you like to CMakeLists.txt and compile the pack yourself.

Another option also is to use `.wasm` and `.js` available at `/wapm` folder of the release
which is the full version but doesn't have an optimal size.

## Stability?
We are [considering](https://github.com/harfbuzz/harfbuzzjs/issues/3) a switch to WASI at least for
wapm releases so consider it unstable yet usable for now.

## Use the library in a bigger emscripten project?
See [harfbuzz port inside emscripten](https://github.com/emscripten-core/emscripten/blob/incoming/tools/ports/harfbuzz.py)
and [emscripten-ports/HarfBuzz](https://github.com/emscripten-ports/HarfBuzz), basically all you need is to use
`-s USE_HARFBUZZ=1` in your build.
