import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Blob, Face, Font, Buffer, shape } from '../dist/index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function example(fontPath, text) {
  var blob = new Blob(fs.readFileSync(fontPath));
  var face = new Face(blob, 0);
  var font = new Font(face);

  var buffer = new Buffer();
  buffer.addText(text || 'abc');
  buffer.guessSegmentProperties();
  shape(font, buffer);
  var result = buffer.json(font);

  return result;
}

console.log(example(path.resolve(__dirname, '../test/fonts/noto/NotoSans-Regular.ttf')));
console.log(example(path.resolve(__dirname, '../test/fonts/noto/NotoSansArabic-Variable.ttf'), "أبجد"));
