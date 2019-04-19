function hbjs(module) {
  'use strict';
  
  var HB_MEMORY_MODE_WRITABLE = 2;

  function createBlob(blob) {
    var blobPtr = module._malloc(blob.byteLength);
    module.HEAPU8.set(blob, blobPtr);
    var ptr = module._hb_blob_create(blobPtr, blob.byteLength, 2, 0, 0);
    return {
      ptr: ptr,
      free: function () {
        module._hb_blob_destroy(ptr);
        module._free(blobPtr);
      }
    };
  }
  
  function createFace(blob, index) {
    var ptr = module._hb_face_create(blob.ptr || blob, index || 0);
    return {
      ptr: ptr,
      free: function () { module._hb_face_destroy(ptr); }
    };
  }

  function createFont(face) {
    var ptr = module._hb_font_create(face.ptr || face);
    return {
      ptr: ptr,
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
  var HB_BUFFER_SERIALIZE_FORMAT_JSON = hb_tag('JSON');

  var utf8Decoder = new TextDecoder("utf8");
  function bufferToString(buffer) {
    return utf8Decoder.decode(buffer.slice(0, buffer.indexOf(0)));
  }
  
  var HB_BUFFER_SERIALIZE_FLAG_NO_GLYPH_NAMES = 4;

  function createBuffer() {
    var ptr = module._hb_buffer_create();
    return {
      ptr: ptr,
      addText: function (text) {
        var str = createCString(text);
        module._hb_buffer_add_utf8(ptr, str.ptr, -1, 0, -1);
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
        // features is not used yet
        module._hb_shape(font.ptr, ptr, 0, 0);
      },
      json: function (font) {
        var bufferLength = module._hb_buffer_get_length(ptr);
        var serializeMaxLength = bufferLength * 100;
        var out = module._malloc(serializeMaxLength);
        module._hb_buffer_serialize_glyphs(
          ptr, 0, module._hb_buffer_get_length(ptr),
          out, serializeMaxLength, 0, font.ptr, HB_BUFFER_SERIALIZE_FORMAT_JSON,
          HB_BUFFER_SERIALIZE_FLAG_NO_GLYPH_NAMES
        );
        var result = JSON.parse('[' + bufferToString(
          module.HEAP8.slice(out, out+serializeMaxLength)
        ) + ']');
        module._free(out);
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