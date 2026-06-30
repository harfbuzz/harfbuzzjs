import fs from "node:fs";
import path from "node:path";
import * as hb from "harfbuzzjs";

const nodeBuffer = fs.readFileSync(
  path.join(import.meta.dirname, "../test/fonts/noto/NotoSans-Regular.ttf"),
);

const blob = new hb.Blob(nodeBuffer);
const face = new hb.Face(blob);
const font = new hb.Font(face);

const buffer = new hb.Buffer();
buffer.addText("abc");
buffer.guessSegmentProperties();
hb.shape(font, buffer);

console.log(buffer.getGlyphInfosAndPositions());
