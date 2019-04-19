function example(hb, fontBlob) {
  var blob = hb.createBlob(fontBlob);
  var face = hb.createFace(blob, 0);
  var font = hb.createFont(face);

  var buffer = hb.createBuffer();
  buffer.addText('سلام');
  buffer.guessSegmentProperties();
  buffer.setDirection('ltr');
  buffer.shape(font, []);
  var result = buffer.json(font);

  buffer.free();
  font.free();
  face.free();
  blob.free();

  return result;
}

// Should be replaced with something more reliable
try { module.exports = example; } catch(e) {}