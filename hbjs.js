function hbjs(instance) {
    'use strict';
    var exports = instance.exports;
    var heapu8 = new Uint8Array(exports.memory.buffer);
    var heapu32 = new Uint32Array(exports.memory.buffer);
    var heapi32 = new Int32Array(exports.memory.buffer);
    var utf8Encoder = new TextEncoder();
    var HB_MEMORY_MODE_WRITABLE = 2;
    function createCString(text) {
        var bytes = utf8Encoder.encode(text);
        var ptr = exports.malloc(bytes.byteLength);
        heapu8.set(bytes, ptr);
        return {
            ptr: ptr,
            length: bytes.byteLength,
            free: function () { exports.free(ptr); }
        };
    }
    function createBlob(blob) {
        var blobPtr = exports.malloc(blob.byteLength);
        heapu8.set(blob, blobPtr);
        var ptr = exports.hb_blob_create(blobPtr, blob.byteLength, HB_MEMORY_MODE_WRITABLE, blobPtr, exports.free_ptr());
        return {
            ptr: ptr,
            destroy: function () { exports.hb_blob_destroy(ptr); }
        };
    }
    function createFace(blob, index) {
        var ptr = exports.hb_face_create(blob.ptr, index);
        return {
            ptr: ptr,
            getUnitsPerEM: function () {
                return exports.hb_face_get_upem(ptr);
            },
            destroy: function () { exports.hb_face_destroy(ptr); }
        };
    }
    function createFont(face) {
        var ptr = exports.hb_font_create(face.ptr);
        var unitsPerEM = face.getUnitsPerEM();
        return {
            ptr: ptr,
            unitsPerEM: unitsPerEM,
            setScale: function (xScale, yScale) {
                exports.hb_font_set_scale(ptr, xScale, yScale);
            },
            destroy: function () { exports.hb_font_destroy(ptr); }
        };
    }
    function createBuffer() {
        var ptr = exports.hb_buffer_create();
        return {
            ptr: ptr,
            addText: function (text) {
                var str = createCString(text);
                exports.hb_buffer_add_utf8(ptr, str.ptr, str.length, 0, str.length);
                str.free();
            },
            guessSegmentProperties: function () {
                return exports.hb_buffer_guess_segment_properties(ptr);
            },
            setDirection: function (dir) {
                let direction = { "ltr": 4, "rtl": 5, "ttb": 6, "btt": 7 }[dir];
                exports.hb_buffer_set_direction(ptr, direction);
            },
            shape: function (font, features) {
                // features are not used yet
                exports.hb_shape(font.ptr, ptr, 0, 0);
            },
            json: function () {
                var length = exports.hb_buffer_get_length(ptr);
                var result = [];
                var infosPtr32 = exports.hb_buffer_get_glyph_infos(ptr, 0) / 4;
                var positionsPtr32 = exports.hb_buffer_get_glyph_positions(ptr, 0) / 4;
                var infos = heapu32.slice(infosPtr32, infosPtr32 + 5 * length);
                var positions = heapi32.slice(positionsPtr32, positionsPtr32 + 5 * length);
                for (var i = 0; i < length; ++i) {
                    result.push({
                        g: infos[i * 5 + 0],
                        cl: infos[i * 5 + 2],
                        ax: positions[i * 5 + 0],
                        ay: positions[i * 5 + 1],
                        dx: positions[i * 5 + 2],
                        dy: positions[i * 5 + 3]
                    });
                }
                return result;
            },
            destroy: function () { exports.hb_buffer_destroy(ptr); }
        };
    }
    function shape(text, font, features) {
        let buffer = createBuffer();
        buffer.addText(text);
        buffer.guessSegmentProperties();
        buffer.shape(font, features);
        let result = buffer.json();
        buffer.destroy();
        return result;
    }
    function getWidth(text, font, fontSizeInPixel, features) {
        let scale = fontSizeInPixel / font.unitsPerEM;
        let shapeResult = shape(text, font, features);
        let totalWidth = shapeResult.map((glyphInformation) => {
            return glyphInformation.ax;
        }).reduce((previous, current, i, arr) => {
            return previous + current;
        }, 0.0);
        return totalWidth * scale;
    }
    return {
        createBlob: createBlob,
        createFace: createFace,
        createFont: createFont,
        createBuffer: createBuffer,
        shape: shape,
        getWidth: getWidth
    };
}
;
export function loadHarfbuzz(webAssemblyUrl) {
    return fetch(webAssemblyUrl).then(response => {
        return response.arrayBuffer();
    }).then(wasm => {
        return WebAssembly.instantiate(wasm);
    }).then(result => {
        //@ts-ignore
        result.instance.exports.memory.grow(1000); // each page is 64kb in size => 64mb allowed for webassembly, maybe we need more... 
        return hbjs(result.instance);
    });
}
//# sourceMappingURL=hbjs.js.map