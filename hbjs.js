const HB_MEMORY_MODE_WRITABLE = 2;
class HarfBuzzExports {
  constructor(exports) {
    this.heapu8 = new Uint8Array(exports.memory.buffer);
    this.heapu32 = new Uint32Array(exports.memory.buffer);
    this.heapi32 = new Int32Array(exports.memory.buffer);
    this.utf8Encoder = new TextEncoder();
    this.malloc = exports.malloc;
    this.free = exports.free;
    this.free_ptr = exports.free_ptr;
    this.hb_blob_destroy = exports.hb_blob_destroy;
    this.hb_blob_create = exports.hb_blob_create;
    this.hb_face_create = exports.hb_face_create;
    this.hb_face_get_upem = exports.hb_face_get_upem;
    this.hb_face_destroy = exports.hb_face_destroy;
    this.hb_font_create = exports.hb_font_create;
    this.hb_font_set_scale = exports.hb_font_set_scale;
    this.hb_font_destroy = exports.hb_font_destroy;
    this.hb_buffer_create = exports.hb_buffer_create;
    this.hb_buffer_add_utf8 = exports.hb_buffer_add_utf8;
    this.hb_buffer_guess_segment_properties = exports.hb_buffer_guess_segment_properties;
    this.hb_buffer_set_direction = exports.hb_buffer_set_direction;
    this.hb_shape = exports.hb_shape;
    this.hb_buffer_get_length = exports.hb_buffer_get_length;
    this.hb_buffer_get_glyph_infos = exports.hb_buffer_get_glyph_infos;
    this.hb_buffer_get_glyph_positions = exports.hb_buffer_get_glyph_positions;
    this.hb_buffer_destroy = exports.hb_buffer_destroy;
  }
}
let hb;
class CString {
  constructor(text) {
    var bytes = hb.utf8Encoder.encode(text);
    this.ptr = hb.malloc(bytes.byteLength);
    hb.heapu8.set(bytes, this.ptr);
    this.length = bytes.byteLength;
  }
  destroy() {
    hb.free(this.ptr);
  }
}
export class HarfBuzzBlob {
  constructor(data) {
    let blobPtr = hb.malloc(data.length);
    hb.heapu8.set(data, blobPtr);
    this.ptr = hb.hb_blob_create(blobPtr, data.byteLength, HB_MEMORY_MODE_WRITABLE, blobPtr, hb.free_ptr());
  }
  destroy() {
    hb.hb_blob_destroy(this.ptr);
  }
}
export class HarfBuzzFace {
  constructor(blob, index) {
    this.ptr = hb.hb_face_create(blob.ptr, index);
  }
  getUnitsPerEM() {
    return hb.hb_face_get_upem(this.ptr);
  }
  destroy() {
    hb.hb_face_destroy(this.ptr);
  }
}
export class HarfBuzzFont {
  constructor(face) {
    this.ptr = hb.hb_font_create(face.ptr);
    this.unitsPerEM = face.getUnitsPerEM();
  }
  setScale(xScale, yScale) {
    hb.hb_font_set_scale(this.ptr, xScale, yScale);
  }
  destroy() {
    hb.hb_font_destroy(this.ptr);
  }
}
export class HarfBuzzBuffer {
  constructor() {
    this.ptr = hb.hb_buffer_create();
  }
  addText(text) {
    let str = new CString(text);
    hb.hb_buffer_add_utf8(this.ptr, str.ptr, str.length, 0, str.length);
    str.destroy();
  }
  guessSegmentProperties() {
    hb.hb_buffer_guess_segment_properties(this.ptr);
  }
  setDirection(direction) {
    let d = { "ltr": 4, "rtl": 5, "ttb": 6, "btt": 7 }[direction];
    hb.hb_buffer_set_direction(this.ptr, d);
  }
  shape(font, features) {
    hb.hb_shape(font.ptr, this.ptr, 0, 0);
  }
  json() {
    var length = hb.hb_buffer_get_length(this.ptr);
    var result = [];
    var infosPtr32 = hb.hb_buffer_get_glyph_infos(this.ptr, 0) / 4;
    var positionsPtr32 = hb.hb_buffer_get_glyph_positions(this.ptr, 0) / 4;
    var infos = hb.heapu32.slice(infosPtr32, infosPtr32 + 5 * length);
    var positions = hb.heapi32.slice(positionsPtr32, positionsPtr32 + 5 * length);
    for (var i = 0; i < length; ++i) {
      result.push({
        GlyphId: infos[i * 5 + 0],
        Cluster: infos[i * 5 + 2],
        XAdvance: positions[i * 5 + 0],
        YAdvance: positions[i * 5 + 1],
        XOffset: positions[i * 5 + 2],
        YOffset: positions[i * 5 + 3]
      });
    }
    return result;
  }
  destroy() {
    hb.hb_buffer_destroy(this.ptr);
  }
}
export function shape(text, font, features) {
  let buffer = new HarfBuzzBuffer();
  buffer.addText(text);
  buffer.guessSegmentProperties();
  buffer.shape(font, features);
  let result = buffer.json();
  buffer.destroy();
  return result;
}
export function getWidth(text, font, fontSizeInPixel, features) {
  let scale = fontSizeInPixel / font.unitsPerEM;
  let shapeResult = shape(text, font, features);
  let totalWidth = shapeResult.map((glyphInformation) => {
    return glyphInformation.XAdvance;
  }).reduce((previous, current, i, arr) => {
    return previous + current;
  }, 0.0);
  return totalWidth * scale;
}
export const harfbuzzFonts = new Map();
export function loadHarfbuzz(webAssemblyUrl) {
  return fetch(webAssemblyUrl).then(response => {
    return response.arrayBuffer();
  }).then(wasm => {
    return WebAssembly.instantiate(wasm);
  }).then(result => {
    //@ts-ignore
    result.instance.exports.memory.grow(1000); // each page is 64kb in size => 64mb allowed for webassembly, maybe we need more... 
    hb = new HarfBuzzExports(result.instance.exports);
  });
}
export function loadAndCacheFont(fontName, fontUrl) {
  return fetch(fontUrl).then((response) => {
    return response.arrayBuffer().then((blob) => {
      let fontBlob = new Uint8Array(blob);
      let harfbuzzBlob = new HarfBuzzBlob(fontBlob);
      let harfbuzzFace = new HarfBuzzFace(harfbuzzBlob, 0);
      let harfbuzzFont = new HarfBuzzFont(harfbuzzFace);
      harfbuzzFonts.set(fontName, harfbuzzFont);
      harfbuzzFace.destroy();
      harfbuzzBlob.destroy();
    });
  });
}
//# sourceMappingURL=hbjs.js.map