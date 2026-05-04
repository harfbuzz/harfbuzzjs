function example(hb, fontBlob, text) {
  var blob = new hb.Blob(fontBlob);
  var face = new hb.Face(blob, 0);
  // console.log(face.getAxisInfos());
  var font = new hb.Font(face);
  // font.setVariations({ wdth: 200, wght: 700 });
  font.setScale(1000, 1000); // Optional, if not given will be in font upem

  var buffer = new hb.Buffer();
  buffer.addText(text || "abc");
  buffer.guessSegmentProperties();
  // buffer.setDirection(hb.Direction.LTR); // optional as can be set by guessSegmentProperties also
  hb.shape(font, buffer);
  var result = buffer.getGlyphInfosAndPositions();

  // returns glyphs paths, totally optional
  var glyphs = {};
  result.forEach(function (x) {
    if (glyphs[x.codepoint]) return;
    glyphs[x.codepoint] = {
      name: font.glyphName(x.codepoint),
      path: font.glyphToPath(x.codepoint),
      json: font.glyphToJson(x.codepoint),
    };
  });

  var unicodes = face.collectUnicodes();

  return { shape: result, glyphs: glyphs, unicodes: unicodes };
}

// Should be replaced with something more reliable
try {
  module.exports = example;
} catch (e) {}
