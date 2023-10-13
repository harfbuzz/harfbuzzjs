// Based on https://github.com/harfbuzz/harfbuzzjs/issues/9#issuecomment-507874962
// Which was based on https://github.com/harfbuzz/harfbuzzjs/issues/9#issuecomment-507622485
const { readFile, writeFile } = require('fs').promises;
const { join, extname, basename } = require('path');
const { performance } = require('node:perf_hooks');

(async () => {
    const { instance: { exports } } = await WebAssembly.instantiate(await readFile(join(__dirname, '../hb-subset.wasm')));
    const fileName = 'MaterialSymbolsOutlined-VF.ttf';
    const fontBlob = await readFile(join(__dirname, fileName));

    const t = performance.now();
    const heapu8 = new Uint8Array(exports.memory.buffer);
    const fontBuffer = exports.malloc(fontBlob.byteLength);
    heapu8.set(new Uint8Array(fontBlob), fontBuffer);

    /* Creating a face */
    const blob = exports.hb_blob_create(fontBuffer, fontBlob.byteLength, 2/*HB_MEMORY_MODE_WRITABLE*/, 0, 0);
    const face = exports.hb_face_create(blob, 0);
    exports.hb_blob_destroy(blob);

    /* Add your glyph indices here and subset */
    const input = exports.hb_subset_input_create_or_fail();
    const plan = exports.hb_subset_plan_create_or_fail(face, input);
    console.log('plan: ', plan)
    const glyph_map = exports.hb_subset_plan_old_to_new_glyph_mapping(plan);
    console.log('glyph_map: ', glyph_map)

    const glyph_set = exports.hb_subset_input_glyph_set(plan);

    // TODO: get gids via hb-shape
    const SUBSET_GIDS = [4261,4995,5012,5013,5014]; // star icon
    for (const gid of SUBSET_GIDS) {
        exports.hb_set_add(glyph_set, gid.toString());
    }

    const subset = exports.hb_subset_or_fail(face, input);

    /* Clean up */
    exports.hb_subset_input_destroy(input);

    /* Get result blob */
    const resultBlob = exports.hb_face_reference_blob(subset);

    const offset = exports.hb_blob_get_data(resultBlob, 0);
    const subsetByteLength = exports.hb_blob_get_length(resultBlob);
    if (subsetByteLength === 0) {
        exports.hb_blob_destroy(resultBlob);
        exports.hb_face_destroy(subset);
        exports.hb_face_destroy(face);
        exports.free(fontBuffer);
        throw new Error(
            'Failed to create subset font, maybe the input file is corrupted?'
        );
    }
    
    // Output font data(Uint8Array)
    const subsetFontBlob = heapu8.subarray(offset, offset + exports.hb_blob_get_length(resultBlob));
    console.info('✨ Subset done in', performance.now() - t, 'ms');

    const extName = extname(fileName).toLowerCase();
    const fontName = basename(fileName, extName);
    await writeFile(join(__dirname, '/', `${fontName}.subset${extName}`), subsetFontBlob);    
    console.info(`Wrote subset to: ${__dirname}/${fontName}.subset${extName}`);

    /* Clean up */
    exports.hb_blob_destroy(resultBlob);
    exports.hb_face_destroy(subset);
    exports.hb_face_destroy(face);
    exports.free(fontBuffer);
})();
