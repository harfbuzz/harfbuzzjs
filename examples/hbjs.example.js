function example(hb, fontBlob) {
  var blob = hb.createBlob(fontBlob);
  var face = hb.createFace(blob, 0);
  var font = hb.createFont(face);
  font.setScale(1000, 1000); // Optional, if not given will be in font upem

  var buffer = hb.createBuffer();
  buffer.addText('سلام');
  buffer.guessSegmentProperties();
  buffer.setDirection('ltr'); // optional as can be by guessSegmentProperties also
  buffer.shape(font); // features are not supported yet
  var result = buffer.json(font);

  buffer.free();
  font.free();
  face.free();
  blob.free();

  return result;
}

// Should be replaced with something more reliable
try { module.exports = example; } catch(e) {}