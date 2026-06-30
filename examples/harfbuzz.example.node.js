import fs from "node:fs";
import path from "node:path";
import * as hb from "harfbuzzjs";

// Load data from a font file:
const nodeBuffer = fs.readFileSync(
  path.join(import.meta.dirname, "../test/fonts/noto/NotoSans-Regular.ttf"),
);

// Create a HarfBuzz font object from the data:
const blob = new hb.Blob(nodeBuffer);
const face = new hb.Face(blob);
const font = new hb.Font(face);

// Shape text in a HarfBuzz buffer with the font:
const buffer = new hb.Buffer();
buffer.addText("abc");
buffer.guessSegmentProperties();
hb.shape(font, buffer);

// Enumerate the resulted glyphs in the buffer:
const infos = buffer.getGlyphInfos();
const positions = buffer.getGlyphPositions();
for (const [index, glyph] of infos.entries()) {
  const gid = glyph.codepoint; // Glyph ID despite the property name
  console.log(
    font.glyphToPath(gid), // SVG path
    positions[index], // xAdvance, yAdvance, xOffset, yOffset
  );
}
