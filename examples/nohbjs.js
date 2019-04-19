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

    module._hb_font_create()
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

    var out = module._malloc(4096);
    module._hb_buffer_serialize_glyphs(
      buffer, 0, module._hb_buffer_get_length(buffer),
      out, 4096, 0, font, hb_tag('JSON'),
      4/*HB_BUFFER_SERIALIZE_FLAG_NO_GLYPH_NAMES*/
    );
    var result = module.HEAP8.slice(out, out+4096);
    var json = JSON.parse('[' + bufferToString(result) + ']');

    module._hb_buffer_destroy(buffer);
    module._hb_font_destroy(font);
    module._hb_face_destroy(face);
    module._hb_blob_create(blob);
    module._free(out);
    module._free(fontBuffer);

    document.body.innerText = JSON.stringify(json);
  });
});
