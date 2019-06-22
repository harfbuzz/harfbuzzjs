var utf8Decoder = new TextDecoder("utf8");
function bufferToString(buffer) {
  return utf8Decoder.decode(buffer.slice(0, buffer.indexOf(0)));
}

var utf8Encoder = new TextEncoder("utf8");

function hb_tag(tag) {
  return tag.split('').reduce((x, y) => (x << 8) + y.charCodeAt(0), 0);
}

Module().then(module => {
  window.module = module;

  fetch('DejaVuSans.ttf').then(res => res.arrayBuffer()).then(fontBlob => {
    var fontBuffer = module._malloc(fontBlob.byteLength);
    module.HEAPU8.set(new Uint8Array(fontBlob), fontBuffer);

    var blob = module._hb_blob_create(fontBuffer, fontBlob.byteLength, 2/*HB_MEMORY_MODE_WRITABLE*/, 0, 0);
    var face = module._hb_face_create(blob, 0);
    var font = module._hb_font_create(face);

    var buffer = module._hb_buffer_create();
    {
      var text = utf8Encoder.encode("سلام!");
      var text_ptr = module._malloc(text.byteLength);
      module.HEAPU8.set(text, text_ptr);
      module._hb_buffer_add_utf8(buffer, text_ptr, text.byteLength, 0, -1);
      module._free(text_ptr);
    }
    module._hb_buffer_guess_segment_properties(buffer);

    module._hb_shape(font, buffer, 0, 0);

    var length = module._hb_buffer_get_length(buffer);
    var result = [];
    var infosPtr32 = module._hb_buffer_get_glyph_infos(buffer, 0) / 4;
    var positionsPtr32 = module._hb_buffer_get_glyph_positions(buffer, 0) / 4;
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

    module._hb_buffer_destroy(buffer);
    module._hb_font_destroy(font);
    module._hb_face_destroy(face);
    module._hb_blob_create(blob);
    module._free(fontBuffer);

    document.body.innerText = JSON.stringify(result);
  });
});
