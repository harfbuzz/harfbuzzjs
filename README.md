# harfbuzzjs
Providing [HarfBuzz](https://github.com/harfbuzz/harfbuzz) shaping
library for client/server side JavaScript projects.

See the demo [here](https://harfbuzz.github.io/harfbuzzjs/).

## Building
1. Install clang 8 and git
2. `./build.sh`

## Download
Download the pack from [releases tab](https://github.com/harfbuzz/harfbuzzjs/releases)
of the project, or just download the [demo page](https://harfbuzz.github.io/harfbuzzjs/) (the
demo source is in [gh-pages](https://github.com/harfbuzz/harfbuzzjs/tree/gh-pages) branch).

## Usage and testing
### Browser
1. `npx pad.js`
2. Open `http://127.0.0.1/examples/hbjs.example.html` or `http://127.0.0.1/examples/nohbjs.html`
### Node.js
1. `(cd examples && node hbjs.example.node.js)`

Even the fact we provide a tiny wrapper around the main functionalities of
harfbuzz, it's easy to use other parts see `example/nohbjs.js` to see how,
but you may need a custom build.

## [npm](https://www.npmjs.com/package/harfbuzzjs)
Can be added with `npm i harfbuzzjs` or `yarn add harfbuzzjs`, see the examples for
how to use it.

## Need more of the library?
File a bug and mention your usecase.

## Use the library in a bigger emscripten project?
See [harfbuzz port inside emscripten](https://github.com/emscripten-core/emscripten/blob/incoming/tools/ports/harfbuzz.py)
and [emscripten-ports/HarfBuzz](https://github.com/emscripten-ports/HarfBuzz), basically all you need is to use
`-s USE_HARFBUZZ=1` in your build.
