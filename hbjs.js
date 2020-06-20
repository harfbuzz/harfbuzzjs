function hbjs(instance) {
  'use strict';

  var exports = instance.exports;
  var heapu8 = new Uint8Array(exports.memory.buffer);
  var heapu32 = new Uint32Array(exports.memory.buffer);
  var heapi32 = new Int32Array(exports.memory.buffer);
  var utf8Decoder = new TextDecoder("utf8");

  var HB_MEMORY_MODE_WRITABLE = 2;

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
      destroy: function () { exports.hb_face_destroy(ptr); }
    };
  }

  function createFont(face) {
    var ptr = exports.hb_font_create(face.ptr);
    return {
      ptr: ptr,
      setScale: function (xScale, yScale) {
        exports.hb_font_set_scale(ptr, xScale, yScale);
      },
      destroy: function () { exports.hb_font_destroy(ptr); }
    };
  }

  var utf8Encoder = new TextEncoder("utf8");
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
        exports.hb_buffer_set_direction(ptr, {
          ltr: 4,
          rtl: 5,
          ttb: 6,
          btt: 7
        }[dir] || 0);
      },
      shape: function (font, features) {
        // features are not used yet
        exports.hb_shape(font.ptr, ptr, 0, 0);
      },
      shapeWithTrace: function (font, features) {
        var traceBuffer = exports.malloc(2048);
        var featurestr = createCString(features);
        var traceLen = exports.hbjs_shape_with_trace(font.ptr, ptr, featurestr.ptr, 0, traceBuffer, 2048);
        return utf8Decoder.decode(heapu8.slice(traceBuffer, traceBuffer + traceLen))
      },
      json: function (font) {
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

  function glyphToSvg(font, glyphId) {
    var pathBuffer = exports.malloc(2048);
    var svgLength = exports.hbjs_glyph_svg(font.ptr, glyphId, pathBuffer, 2048);
    var path = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><path d="' +
      utf8Decoder.decode(heapu8.slice(pathBuffer, pathBuffer + svgLength)) +
      '"/></svg>';
    exports.free(pathBuffer);
    return path
  }


  function shape(font, buffer, features) {
    // features are not used yet
    exports.hb_shape(font.ptr, buffer.ptr, 0, 0);
  }

  return {
    createBlob: createBlob,
    createFace: createFace,
    createFont: createFont,
    createBuffer: createBuffer,
    shape: shape,
    glyphToSvg: glyphToSvg
  };
};

// Should be replaced with something more reliable
try { module.exports = hbjs; } catch(e) {}
