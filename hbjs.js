function hbjs(module) {
  'use strict';
  
  var HB_MEMORY_MODE_WRITABLE = 2;

  function createBlob(blob) {
    var blobPtr = module._malloc(blob.byteLength);
    module.HEAPU8.set(blob, blobPtr);
    var ptr = module._hb_blob_create(blobPtr, blob.byteLength, HB_MEMORY_MODE_WRITABLE, 0, 0);
    return {
      ptr: ptr,
      free: function () {
        module._hb_blob_destroy(ptr);
        module._free(blobPtr);
      }
    };
  }
  
  function createFace(blob, index) {
    var ptr = module._hb_face_create(blob.ptr, index);
    return {
      ptr: ptr,
      free: function () { module._hb_face_destroy(ptr); }
    };
  }

  function createFont(face) {
    var ptr = module._hb_font_create(face.ptr);
    return {
      ptr: ptr,
      setScale: function (xScale, yScale) {
        module._hb_font_set_scale(ptr, xScale, yScale);
      },
      free: function () { module._hb_font_destroy(ptr); }
    };
  }

  var utf8Encoder = new TextEncoder("utf8");
  function createCString(text) {
    var bytes = utf8Encoder.encode(text);
    var ptr = module._malloc(text.byteLength);
    module.HEAPU8.set(bytes, ptr);
    return {
      ptr: ptr,
      length: bytes.byteLength,
      free: function () { module._free(ptr); }
    };
  }
  
  function hb_tag(tag) {
    return tag.split('').reduce((x, y) => (x << 8) + y.charCodeAt(0), 0);
  }

  function createBuffer() {
    var ptr = module._hb_buffer_create();
    return {
      ptr: ptr,
      addText: function (text) {
        var str = createCString(text);
        module._hb_buffer_add_utf8(ptr, str.ptr, str.length, 0, str.length);
        str.free();
      },
      guessSegmentProperties: function () {
        return module._hb_buffer_guess_segment_properties(ptr);
      },
      setDirection: function (dir) {
        var str = createCString(dir);
        var hbDirection = module._hb_direction_from_string(str.ptr, str.length);
        module._hb_buffer_set_direction(ptr, hbDirection);
        str.free();
      },
      shape: function (font, features) {
        // features are not used yet
        module._hb_shape(font.ptr, ptr, 0, 0);
      },
      json: function (font) {
        var length = module._hb_buffer_get_length(ptr);
        var result = [];
        var infosPtr32 = module._hb_buffer_get_glyph_infos(ptr, 0) / 4;
        var positionsPtr32 = module._hb_buffer_get_glyph_positions(ptr, 0) / 4;
        var infos = module.HEAPU32.slice(infosPtr32, infosPtr32 + 5 * length);
        var positions = module.HEAP32.slice(positionsPtr32, positionsPtr32 + 5 * length);
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
      free: function () { module._hb_buffer_destroy(ptr); }
    };
  }

  return {
    createBlob: createBlob,
    createFace: createFace,
    createFont: createFont,
    createBuffer: createBuffer,
    _module: module
  };
};

// Should be replaced with something more reliable
try { module.exports = hbjs; } catch(e) {}