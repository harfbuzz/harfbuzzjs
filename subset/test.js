// Based on https://github.com/harfbuzz/harfbuzzjs/issues/9#issuecomment-507874962
// Which was based on https://github.com/harfbuzz/harfbuzzjs/issues/9#issuecomment-507622485
const fs = require('fs');
const readFileAsync = require('util').promisify(fs.readFile);
const writeFileAsync = require('util').promisify(fs.writeFile);

(async () => {
    const { instance: { exports } } = await WebAssembly.instantiate(await readFileAsync(__dirname + '/hb-subset.wasm'));
    //exports.memory.grow(400); // each page is 64kb in size
    const fontBlob = await readFileAsync(__dirname + '/roboto-black.ttf');

    const heapu8 = new Uint8Array(exports.memory.buffer);
    const fontBuffer = exports.malloc(fontBlob.byteLength);
    heapu8.set(new Uint8Array(fontBlob), fontBuffer);

    /* Creating a face */
    const blob = exports.hb_blob_create(fontBuffer, fontBlob.byteLength, 2/*HB_MEMORY_MODE_WRITABLE*/, 0, 0);
    const face = exports.hb_face_create(blob, 0);
    exports.hb_blob_destroy(blob);

    /* Add your glyph indices here and subset */
    const input = exports.hb_subset_input_create_or_fail();
    const unicode_set = exports.hb_subset_input_unicode_set(input);
    exports.hb_set_add(unicode_set, 'a'.charCodeAt(0));
    exports.hb_set_add(unicode_set, 'b'.charCodeAt(0));
    exports.hb_set_add(unicode_set, 'c'.charCodeAt(0));

    // exports.hb_subset_input_set_drop_hints(input, true);
    const subset = exports.hb_subset_or_fail(face, input);

    /* Clean up */
    exports.hb_subset_input_destroy(input);

    /* Get result blob */
    const result = exports.hb_face_reference_blob(subset);

    const data = exports.hb_blob_get_data(result, 0);
    const subsetFontBlob = heapu8.subarray(data, data + exports.hb_blob_get_length(result));

    await writeFileAsync(__dirname + '/roboto-black-subset-js.ttf', subsetFontBlob);
    console.log(`Wrote subset to: ${__dirname}/roboto-black-subset-js.ttf`);

    /* Clean up */
    exports.hb_blob_destroy(result);
    exports.hb_face_destroy(subset);
    exports.hb_face_destroy(face);
    exports.free(fontBuffer);
})();
