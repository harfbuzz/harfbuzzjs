import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import harfbuzz from '../dist/index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const hb = await harfbuzz;

function example(fontPath, text) {
  var blob = new hb.Blob(fs.readFileSync(fontPath));
  var face = new hb.Face(blob, 0);
  var font = new hb.Font(face);

  var buffer = new hb.Buffer();
  buffer.addText(text || 'abc');
  buffer.guessSegmentProperties();
  hb.shape(font, buffer);
  var result = buffer.json(font);

  return result;
}

console.log(example(path.resolve(__dirname, '../test/fonts/noto/NotoSans-Regular.ttf')));
console.log(example(path.resolve(__dirname, '../test/fonts/noto/NotoSansArabic-Variable.ttf'), "أبجد"));
