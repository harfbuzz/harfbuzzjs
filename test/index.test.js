import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, describe, it } from "vitest";
import * as hb from "../dist/index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("Face", function () {
  it("collectUnicodes reflects codepoints supported by the font", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    const codepoints = [...face.collectUnicodes()];
    expect(codepoints).to.include("a".codePointAt(0));
    expect(codepoints).not.to.include("ا".codePointAt(0));
  });

  it("exposes upem", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    expect(face.upem).to.equal(1000);
  });

  it("getAxisInfos returns details of a variable font", function () {
    let blob = new hb.Blob(
      fs.readFileSync(
        path.join(__dirname, "fonts/noto/NotoSansArabic-Variable.ttf"),
      ),
    );
    let face = new hb.Face(blob);
    expect(face.getAxisInfos()).to.deep.equal({
      wght: { min: 100, default: 400, max: 900 },
      wdth: { min: 62.5, default: 100, max: 100 },
    });
  });

  it("getAxisInfos returns an empty object for a non-variable font", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    expect(Object.keys(face.getAxisInfos())).to.have.lengthOf(0);
  });

  it("getTableScriptTags returns tags for a font", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    expect(face.getTableScriptTags("GSUB")).to.deep.equal([
      "DFLT",
      "cyrl",
      "dev2",
      "deva",
      "grek",
      "latn",
    ]);
    expect(face.getTableScriptTags("GPOS")).to.deep.equal([
      "DFLT",
      "cyrl",
      "dev2",
      "deva",
      "grek",
      "latn",
    ]);
  });

  it("getTableFeatureTags returns tags for a font", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    expect(face.getTableFeatureTags("GSUB")).to.deep.equal([
      "aalt",
      "abvs",
      "akhn",
      "blwf",
      "blwf",
      "blws",
      "c2sc",
      "case",
      "ccmp",
      "ccmp",
      "ccmp",
      "ccmp",
      "cjct",
      "cjct",
      "dnom",
      "frac",
      "half",
      "half",
      "half",
      "half",
      "haln",
      "liga",
      "lnum",
      "locl",
      "locl",
      "locl",
      "locl",
      "locl",
      "locl",
      "locl",
      "locl",
      "locl",
      "locl",
      "locl",
      "locl",
      "nukt",
      "numr",
      "onum",
      "ordn",
      "pnum",
      "pres",
      "pres",
      "psts",
      "rkrf",
      "rphf",
      "rtlm",
      "salt",
      "sinf",
      "smcp",
      "ss03",
      "ss04",
      "ss06",
      "ss07",
      "subs",
      "sups",
      "tnum",
      "vatu",
      "zero",
    ]);
    expect(face.getTableFeatureTags("GPOS")).to.deep.equal([
      "abvm",
      "blwm",
      "dist",
      "kern",
      "mark",
      "mkmk",
    ]);
  });

  it("getScriptLanguageTags returns tags for a font", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    expect(face.getScriptLanguageTags("GSUB", 1)).to.deep.equal([
      "MKD ",
      "SRB ",
    ]);
    expect(face.getScriptLanguageTags("GPOS", 5)).to.deep.equal([]);
  });

  it("getScriptLanguageTags returns tags for GPOS table", function () {
    let blob = new hb.Blob(
      fs.readFileSync(
        path.join(__dirname, "fonts/noto/NotoSansDevanagari-Regular.otf"),
      ),
    );
    let face = new hb.Face(blob);
    expect(face.getScriptLanguageTags("GPOS", 1)).to.deep.equal([
      "MAR ",
      "NEP ",
      "SAN ",
      "SAT ",
    ]);
  });

  it("getLanguageFeatureTags returns tags for a font", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    expect(face.getLanguageFeatureTags("GSUB", 1, 1)).to.deep.equal([
      "aalt",
      "c2sc",
      "case",
      "ccmp",
      "dnom",
      "frac",
      "liga",
      "lnum",
      "locl",
      "numr",
      "onum",
      "ordn",
      "pnum",
      "rtlm",
      "sinf",
      "smcp",
      "ss03",
      "ss06",
      "ss07",
      "subs",
      "sups",
      "tnum",
      "zero",
    ]);
    expect(face.getLanguageFeatureTags("GPOS", 5, 5)).to.deep.equal([]);
  });

  it("getTableScriptTags, getScriptLanguageTags, and getLanguageFeatureTags all together", function () {
    let blob = new hb.Blob(
      fs.readFileSync(
        path.join(__dirname, "fonts/noto/NotoSansArabic-Variable.ttf"),
      ),
    );
    let face = new hb.Face(blob);
    let result = {};
    face.getTableScriptTags("GSUB").forEach((script, scriptIndex) => {
      result[script] = {
        dflt: face.getLanguageFeatureTags("GSUB", scriptIndex, 0xffff),
      };
      face
        .getScriptLanguageTags("GSUB", scriptIndex)
        .forEach((language, languageIndex) => {
          result[script][language] = face.getLanguageFeatureTags(
            "GSUB",
            scriptIndex,
            languageIndex,
          );
        });
    });
    expect(result).to.deep.equal({
      DFLT: {
        dflt: ["aalt", "ccmp", "dlig", "fina", "init", "isol", "medi"],
      },
      arab: {
        dflt: ["aalt", "ccmp", "dlig", "fina", "init", "isol", "medi", "rlig"],
        "URD ": [
          "aalt",
          "ccmp",
          "dlig",
          "fina",
          "init",
          "isol",
          "locl",
          "medi",
        ],
      },
    });
  });

  it("getGlyphClass returns the class of a glyph", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    expect(face.getGlyphClass(0)).to.equal(hb.GlyphClass.UNCLASSIFIED);
    expect(face.getGlyphClass(font.glyphFromName("w"))).to.equal(
      hb.GlyphClass.BASE_GLYPH,
    );
    expect(face.getGlyphClass(font.glyphFromName("fi"))).to.equal(
      hb.GlyphClass.LIGATURE,
    );
    expect(face.getGlyphClass(font.glyphFromName("gravecomb"))).to.equal(
      hb.GlyphClass.MARK,
    );
  });

  it("listNames fetches all names", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let names = face.listNames();
    expect(names.length).to.equal(38);
    expect(names[0].nameId).to.equal(0);
    expect(names[0].language.toString()).to.equal("en");
    expect(names[37].nameId).to.equal(278);
    expect(names[37].language.toString()).to.equal("en");
  });

  it("getName fetches a name", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    expect(face.getName(1, new hb.Language("en"))).to.equal("Noto Sans");
    expect(face.getName(256, new hb.Language("en"))).to.equal("florin symbol");
  });

  it("getFeatureNameIds returns valid name Ids for ssNN features", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    expect(
      face.getFeatureNameIds(
        "GSUB",
        face.getTableFeatureTags("GSUB").indexOf("ss03"),
      ),
    ).to.deep.equal({
      uiLabelNameId: 256,
      paramUiLabelNameIds: [],
    });
  });

  it("getFeatureNameIds with getName", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    expect(
      face.getName(
        face.getFeatureNameIds(
          "GSUB",
          face.getTableFeatureTags("GSUB").indexOf("ss03"),
        ).uiLabelNameId,
        new hb.Language("en"),
      ),
    ).to.equal("florin symbol");
  });

  it("getFeatureNameIds not found", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    expect(
      face.getFeatureNameIds(
        "GSUB",
        face.getTableFeatureTags("GSUB").indexOf("salt"),
      ),
    ).to.equal(undefined);
  });

  it("getFeatureNameIds returns valid name Ids for cvNN features", function () {
    let blob = new hb.Blob(
      fs.readFileSync(
        path.join(__dirname, "../harfbuzz/test/api/fonts/cv01.otf"),
      ),
    );
    let face = new hb.Face(blob);
    expect(
      face.getFeatureNameIds(
        "GSUB",
        face.getTableFeatureTags("GSUB").indexOf("cv01"),
      ),
    ).to.deep.equal({
      uiLabelNameId: 256,
      uiTooltipTextNameId: 257,
      sampleTextNameId: 258,
      paramUiLabelNameIds: [259, 260],
    });
  });
});

describe("Font", function () {
  it("subFont creates a sub font", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    let subFont = font.subFont();
    expect(subFont.ptr).to.not.equal(font.ptr);
  });

  it("subFont font funcs fallback to parent", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    let subFont = font.subFont();
    expect(subFont.ptr).to.not.equal(font.ptr);

    let fontFuncs = new hb.FontFuncs();
    fontFuncs.setGlyphNameFunc(function (font_, glyph) {
      expect(font_.ptr).to.equal(subFont.ptr);
      return undefined;
    });
    subFont.setFuncs(fontFuncs);

    expect(subFont.glyphName(20)).to.equal("gid20");
    expect(subFont.glyphHAdvance(20)).to.equal(font.glyphHAdvance(20));
  });

  it("hExtents returns extents for the font", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    expect(font.hExtents()).to.deep.equal({
      ascender: 1069,
      descender: -293,
      lineGap: 0,
    });
  });

  it("vExtents returns extents for the font", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    expect(font.vExtents()).to.deep.equal({
      ascender: 0,
      descender: 0,
      lineGap: 0,
    });
  });

  it("glyphName returns names for glyph ids", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    expect(font.glyphName(20)).to.equal("one");
  });

  it("setScale affects advances", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    let buffer = new hb.Buffer();
    buffer.addText("a");
    buffer.guessSegmentProperties();
    font.setScale(1000 * 2, 1000 * 2);
    hb.shape(font, buffer);
    const positions = buffer.getGlyphPositions();
    expect(positions[0].xAdvance).to.equal(561 * 2);
  });

  it("glyphExtents returns extents for glyph ids", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    expect(font.glyphExtents(20)).to.deep.equal({
      xBearing: 89,
      yBearing: 714,
      width: 266,
      height: -714,
    });
  });

  it("glyphHAdvance returns advances for glyph ids", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    expect(font.glyphHAdvance(20)).to.equal(572);
  });

  it("glyphVAdvance returns advances for glyph ids", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    expect(font.glyphVAdvance(20)).to.equal(-1000);
  });

  it("glyphHOrigin returns origins for glyph ids", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    expect(font.glyphHOrigin(20)).to.deep.equal([0, 0]);
  });

  it("glyphVOrigin returns origins for glyph ids", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    expect(font.glyphVOrigin(20)).to.equal(undefined);
  });

  it("glyphFromName returns ids for glyph names", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    expect(font.glyphFromName("one")).to.equal(20);
    expect(font.glyphFromName("NonExistentGlyph")).to.equal(undefined);
  });

  it("setVariations affects advances", function () {
    let blob = new hb.Blob(
      fs.readFileSync(
        path.join(__dirname, "fonts/noto/NotoSansArabic-Variable.ttf"),
      ),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    font.setVariations([new hb.Variation("wght", 789)]);
    let buffer = new hb.Buffer();
    buffer.addText("آلو");
    buffer.guessSegmentProperties();
    hb.shape(font, buffer);
    const positions = buffer.getGlyphPositions();
    expect(positions[0].xAdvance).to.equal(526);
  });

  it("glyphToPath converts quadratic glyph to path", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    const expected21 =
      "M520,0L48,0L48,73L235,262Q289,316 326,358Q363,400 382,440.5Q401,481 401,529Q401,\
588 366,618.5Q331,649 275,649Q223,649 183.5,631Q144,613 103,581L56,640Q98,675 152.5,699.5Q207,724 275,\
724Q375,724 433,673.5Q491,623 491,534Q491,478 468,429Q445,380 404,332.5Q363,285 308,231L159,84L159,80L520,80L520,0Z";
    expect(font.glyphToPath(21)).to.equal(expected21);
    const expected22 =
      "M493,547Q493,475 453,432.5Q413,390 345,376L345,372Q431,362 473,318Q515,274 515,203Q515,\
141 486,92.5Q457,44 396.5,17Q336,-10 241,-10Q185,-10 137,-1.5Q89,7 45,29L45,111Q90,89 142,76.5Q194,64 242,64Q338,\
64 380.5,101.5Q423,139 423,205Q423,272 370.5,301.5Q318,331 223,331L154,331L154,406L224,406Q312,406 357.5,443Q403,\
480 403,541Q403,593 368,621.5Q333,650 273,650Q215,650 174,633Q133,616 93,590L49,650Q87,680 143.5,702Q200,724 272,\
724Q384,724 438.5,674Q493,624 493,547Z";
    expect(font.glyphToPath(22)).to.equal(expected22);
  });

  it("glyphToPath converts cubic glyph to path", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.otf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    const expected21 =
      "M520,0L520,80L159,80L159,84L308,231C418,338 491,422 491,534C491,652 408,724 275,724C184,724 112,\
687 56,640L103,581C158,624 205,649 275,649C350,649 401,607 401,529C401,432 342,370 235,262L48,73L48,0L520,0Z";
    expect(font.glyphToPath(21)).to.equal(expected21);
    const expected22 =
      "M493,547C493,649 421,724 272,724C176,724 100,690 49,650L93,590C146,625 196,650 273,650C353,\
650 403,610 403,541C403,460 341,406 224,406L154,406L154,331L223,331C349,331 423,294 423,205C423,117 370,64 242,64C178,\
64 105,81 45,111L45,29C104,0 166,-10 241,-10C430,-10 515,78 515,203C515,297 459,358 345,372L345,376C435,394 493,451 493,547Z";
    expect(font.glyphToPath(22)).to.equal(expected22);
  });
});

describe("FontFuncs", function () {
  it("setGlyphExtentsFunc", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    let fontFuncs = new hb.FontFuncs();
    fontFuncs.setGlyphExtentsFunc(function (font_, glyph) {
      expect(font_.ptr).to.equal(font.ptr);
      return {
        xBearing: glyph,
        yBearing: 0,
        width: 100 * glyph,
        height: 100,
      };
    });
    font.setFuncs(fontFuncs);
    expect(font.glyphExtents(0)).to.deep.equal({
      xBearing: 0,
      yBearing: 0,
      width: 0,
      height: 100,
    });
    expect(font.glyphExtents(20)).to.deep.equal({
      xBearing: 20,
      yBearing: 0,
      width: 2000,
      height: 100,
    });
  });

  it("setGlyphFromNameFunc", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    let fontFuncs = new hb.FontFuncs();
    fontFuncs.setGlyphFromNameFunc(function (font_, name) {
      expect(font_.ptr).to.equal(font.ptr);
      return name == "one" ? 20 : undefined;
    });
    font.setFuncs(fontFuncs);
    expect(font.glyphFromName("one")).to.equal(20);
    expect(font.glyphFromName("two")).to.equal(undefined);
  });

  it("setGlyphHAdvanceFunc", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    let fontFuncs = new hb.FontFuncs();
    fontFuncs.setGlyphHAdvanceFunc(function (font_, glyph) {
      expect(font_.ptr).to.equal(font.ptr);
      return glyph == 20 ? 100 : 200;
    });
    font.setFuncs(fontFuncs);
    expect(font.glyphHAdvance(20)).to.equal(100);
    expect(font.glyphHAdvance(21)).to.equal(200);
  });

  it("setGlyphVAdvanceFunc", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    let fontFuncs = new hb.FontFuncs();
    fontFuncs.setGlyphVAdvanceFunc(function (font_, glyph) {
      expect(font_.ptr).to.equal(font.ptr);
      return glyph == 20 ? 100 : 200;
    });
    font.setFuncs(fontFuncs);
    expect(font.glyphVAdvance(20)).to.equal(100);
    expect(font.glyphVAdvance(21)).to.equal(200);
  });

  it("setGlyphHOriginFunc", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    let fontFuncs = new hb.FontFuncs();
    fontFuncs.setGlyphHOriginFunc(function (font_, glyph) {
      expect(font_.ptr).to.equal(font.ptr);
      return glyph == 20 ? [100, 200] : [300, 400];
    });
    font.setFuncs(fontFuncs);
    expect(font.glyphHOrigin(20)).to.deep.equal([100, 200]);
    expect(font.glyphHOrigin(21)).to.deep.equal([300, 400]);
  });

  it("setGlyphVOriginFunc", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    let fontFuncs = new hb.FontFuncs();
    fontFuncs.setGlyphVOriginFunc(function (font_, glyph) {
      expect(font_.ptr).to.equal(font.ptr);
      return glyph == 20 ? [100, 200] : [300, 400];
    });
    font.setFuncs(fontFuncs);
    expect(font.glyphVOrigin(20)).to.deep.equal([100, 200]);
    expect(font.glyphVOrigin(21)).to.deep.equal([300, 400]);
  });

  it("setGlyphNameFunc", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    let fontFuncs = new hb.FontFuncs();
    fontFuncs.setGlyphNameFunc(function (font_, glyph) {
      expect(font_.ptr).to.equal(font.ptr);
      return glyph == 20 ? "one" : undefined;
    });
    font.setFuncs(fontFuncs);
    expect(font.glyphName(20)).to.equal("one");
    expect(font.glyphName(21)).to.equal("gid21");
  });

  it("setNominalGlyphFunc", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    let fontFuncs = new hb.FontFuncs();
    fontFuncs.setNominalGlyphFunc(function (font_, unicode) {
      expect(font_.ptr).to.equal(font.ptr);
      return unicode == 49 ? 21 : 22;
    });
    font.setFuncs(fontFuncs);
    let buffer = new hb.Buffer();
    buffer.addText("12");
    buffer.guessSegmentProperties();
    hb.shape(font, buffer);
    const infos = buffer.getGlyphInfos();
    expect(infos[0].codepoint).to.equal(21);
    expect(infos[1].codepoint).to.equal(22);
  });

  it("setVariationGlyphFunc", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    let fontFuncs = new hb.FontFuncs();
    fontFuncs.setNominalGlyphFunc(function (font_, unicode) {
      expect(font_.ptr).to.equal(font.ptr);
      return unicode == 49 ? 21 : 22;
    });
    fontFuncs.setVariationGlyphFunc(
      function (font_, unicode, variationSelector) {
        expect(font_.ptr).to.equal(font.ptr);
        return unicode == 49 ? 23 : undefined;
      },
    );
    font.setFuncs(fontFuncs);
    let buffer = new hb.Buffer();
    buffer.addText("11\uFE002\uFE00");
    buffer.guessSegmentProperties();
    hb.shape(font, buffer);
    const infos = buffer.getGlyphInfos();
    expect(infos[0].codepoint).to.equal(21);
    expect(infos[1].codepoint).to.equal(23);
    expect(infos[2].codepoint).to.equal(22);
  });

  it("setFontHExtentsFunc", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    let fontFuncs = new hb.FontFuncs();
    fontFuncs.setFontHExtentsFunc(function (font_) {
      expect(font_.ptr).to.equal(font.ptr);
      return {
        ascender: 100,
        descender: 200,
        lineGap: 300,
      };
    });
    font.setFuncs(fontFuncs);
    expect(font.hExtents()).to.deep.equal({
      ascender: 100,
      descender: 200,
      lineGap: 300,
    });
  });

  it("setFontVExtentsFunc", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    let fontFuncs = new hb.FontFuncs();
    fontFuncs.setFontVExtentsFunc(function (font_) {
      expect(font_.ptr).to.equal(font.ptr);
      return {
        ascender: 100,
        descender: 200,
        lineGap: 300,
      };
    });
    font.setFuncs(fontFuncs);
    expect(font.vExtents()).to.deep.equal({
      ascender: 100,
      descender: 200,
      lineGap: 300,
    });
  });
});

describe("Buffer", function () {
  it("setDirection controls direction of glyphs", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    let buffer = new hb.Buffer();
    buffer.addText("rtl");
    buffer.setDirection(hb.Direction.RTL);
    hb.shape(font, buffer);
    const infos = buffer.getGlyphInfos();
    expect(infos[0].codepoint).to.equal(79); // l
    expect(infos[1].codepoint).to.equal(87); // t
    expect(infos[2].codepoint).to.equal(85); // r
  });

  it("setClusterLevel affects cluster merging", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    let buffer = new hb.Buffer();
    buffer.setClusterLevel(hb.ClusterLevel.MONOTONE_CHARACTERS);
    buffer.addText("x́");
    buffer.guessSegmentProperties();
    hb.shape(font, buffer);
    const infos = buffer.getGlyphInfos();
    expect(infos[0].cluster).to.equal(0);
    expect(infos[1].cluster).to.equal(1);
  });

  it("setFlags with PRESERVE_DEFAULT_IGNORABLES affects glyph ids", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    let buffer = new hb.Buffer();
    buffer.addText("\u200dhi");
    buffer.setFlags(hb.BufferFlag.PRESERVE_DEFAULT_IGNORABLES);
    buffer.guessSegmentProperties();
    hb.shape(font, buffer);
    const infos = buffer.getGlyphInfos();
    expect(infos[0].codepoint).not.to.equal(3); // space
  });

  it("setFlags ignores invalid flags", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    let buffer = new hb.Buffer();
    buffer.addText("abc");
    buffer.setFlags(0);
    buffer.guessSegmentProperties();
    hb.shape(font, buffer);
    const infos = buffer.getGlyphInfos();
    expect(infos[0].codepoint).to.equal(68); // a
  });

  it("setFlags with PRODUCE_SAFE_TO_INSERT_TATWEEL affects glyph flags", function () {
    let blob = new hb.Blob(
      fs.readFileSync(
        path.join(__dirname, "fonts/noto/NotoSansArabic-Variable.ttf"),
      ),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    let buffer = new hb.Buffer();
    buffer.addText("بلا");
    buffer.setFlags(hb.BufferFlag.PRODUCE_SAFE_TO_INSERT_TATWEEL);
    buffer.guessSegmentProperties();
    hb.shape(font, buffer);
    const flags = buffer.getGlyphInfos().map((g) => g.flags);
    expect(flags).to.deep.equal([5, 0]);

    buffer.clearContents();
    buffer.addText("بلا");
    buffer.setFlags(0);
    buffer.guessSegmentProperties();
    hb.shape(font, buffer);
    const flags2 = buffer.getGlyphInfos().map((g) => g.flags);
    expect(flags2).to.deep.equal([1, 0]);
  });

  it("serialize ignores invalid flags", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    let buffer = new hb.Buffer();
    buffer.addText("abc");
    buffer.guessSegmentProperties();
    hb.shape(font, buffer);
    const glyphs = buffer.serialize({
      font,
      format: hb.BufferSerializeFormat.TEXT,
    });
    expect(glyphs).to.deep.equal("[a=0+561|b=1+615|c=2+480]");
  });

  it("reset resets the buffer", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    let buffer = new hb.Buffer();
    buffer.addText("abc");
    buffer.guessSegmentProperties();
    expect(buffer.getContentType()).to.equal(hb.BufferContentType.UNICODE);
    hb.shape(font, buffer);
    expect(buffer.getContentType()).to.equal(hb.BufferContentType.GLYPHS);
    buffer.reset();
    expect(buffer.getContentType()).to.equal(hb.BufferContentType.INVALID);
  });

  it("getLength gets the length before and after shaping", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    let buffer = new hb.Buffer();
    buffer.addText("fi");
    expect(buffer.getLength()).to.equal(2);
    buffer.guessSegmentProperties();
    hb.shape(font, buffer);
    expect(buffer.getLength()).to.equal(1);
  });

  it("getInfos and getPositions return empty arrays for empty buffer", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    let buffer = new hb.Buffer();
    expect(buffer.getGlyphInfos()).to.deep.equal([]);
    expect(buffer.getGlyphPositions()).to.deep.equal([]);
    expect(buffer.getGlyphInfosAndPositions()).to.deep.equal([]);
  });

  it("getInfos and getPositions return non empty arrays for non empty buffer", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    let buffer = new hb.Buffer();
    buffer.addText("x\u0300fi"); // combining mark and ligature to make the test more interesting
    buffer.guessSegmentProperties();

    // before shaping
    let infos = buffer.getGlyphInfos();
    let positions = buffer.getGlyphPositions();
    let infosAndPositions = buffer.getGlyphInfosAndPositions();

    expect(infos).to.deep.equal([
      { codepoint: 120, cluster: 0, flags: 0 },
      { codepoint: 768, cluster: 1, flags: 0 },
      { codepoint: 102, cluster: 2, flags: 0 },
      { codepoint: 105, cluster: 3, flags: 0 },
    ]);
    expect(positions).to.deep.equal([
      { xAdvance: 0, yAdvance: 0, xOffset: 0, yOffset: 0 },
      { xAdvance: 0, yAdvance: 0, xOffset: 0, yOffset: 0 },
      { xAdvance: 0, yAdvance: 0, xOffset: 0, yOffset: 0 },
      { xAdvance: 0, yAdvance: 0, xOffset: 0, yOffset: 0 },
    ]);

    for (let i = 0; i < infosAndPositions.length; i++) {
      expect(infosAndPositions[i]).to.deep.equal({
        ...infos[i],
        ...positions[i],
      });
    }

    hb.shape(font, buffer);
    // after shaping
    infos = buffer.getGlyphInfos();
    positions = buffer.getGlyphPositions();
    infosAndPositions = buffer.getGlyphInfosAndPositions();

    expect(infos).to.deep.equal([
      { codepoint: 91, cluster: 0, flags: 0 },
      { codepoint: 2662, cluster: 0, flags: 0 },
      { codepoint: 1652, cluster: 2, flags: 0 },
    ]);
    expect(positions).to.deep.equal([
      { xAdvance: 529, yAdvance: 0, xOffset: 0, yOffset: 0 },
      { xAdvance: 0, yAdvance: 0, xOffset: 97, yOffset: 0 },
      { xAdvance: 602, yAdvance: 0, xOffset: 0, yOffset: 0 },
    ]);
    for (let i = 0; i < infosAndPositions.length; i++) {
      expect(infosAndPositions[i]).to.deep.equal({
        ...infos[i],
        ...positions[i],
      });
    }
  });

  it("glyph infos and positions have private properties", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    let buffer = new hb.Buffer();
    buffer.addText("fi");
    buffer.guessSegmentProperties();
    hb.shape(font, buffer);
    const infosAndPositions = buffer.getGlyphInfosAndPositions();

    expect(infosAndPositions.length).to.equal(1);
    expect(Object.keys(infosAndPositions[0])).to.deep.equal([
      "codepoint",
      "cluster",
      "flags",
      "xAdvance",
      "yAdvance",
      "xOffset",
      "yOffset",
    ]);
    expect(infosAndPositions[0].mask).to.not.be.undefined;
    expect(infosAndPositions[0].var1).to.not.be.undefined;
    expect(infosAndPositions[0].var2).to.not.be.undefined;
    expect(infosAndPositions[0].var).to.not.be.undefined;
  });

  it("getPositions returns empty array for buffer without positions", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    let buffer = new hb.Buffer();
    buffer.addText("abc");
    buffer.guessSegmentProperties();
    var currentPhase = "";
    buffer.setMessageFunc((buffer, font, message) => {
      if (message.startsWith("start table GSUB")) currentPhase = "GSUB";
      else if (message.startsWith("start table GPOS")) currentPhase = "GPOS";

      if (currentPhase === "GSUB")
        expect(buffer.getGlyphPositions()).to.deep.equal([]);
      else if (currentPhase === "GPOS")
        expect(buffer.getGlyphPositions()).to.not.deep.equal([]);

      return true;
    });
    hb.shape(font, buffer);
  });

  it("updateGlyphPositions updates the glyph positions", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    let buffer = new hb.Buffer();

    // text with a base glyph and two marks to test mkmk after manually updating glyph positions
    var text = "x\u0302\u0300";

    // without updateGlyphPositions
    buffer.addText(text);
    buffer.guessSegmentProperties();
    hb.shape(font, buffer);
    var positions = buffer.getGlyphPositions();
    expect(positions[1].yOffset).to.equal(0);
    expect(positions[2].yOffset).to.equal(229);

    // with updateGlyphPositions inside buffer message callback
    buffer.clearContents();
    buffer.addText(text);
    buffer.guessSegmentProperties();
    var currentPhase = "";
    buffer.setMessageFunc((buffer, font, message) => {
      if (message.startsWith("start table GSUB")) currentPhase = "GSUB";
      else if (message.startsWith("start table GPOS")) currentPhase = "GPOS";

      // modify the 2nd glyph yOffset after the last mark lookup and before mkmk lookups
      if (
        currentPhase === "GPOS" &&
        message.startsWith("end lookup 4 feature 'mark'")
      ) {
        var positions = buffer.getGlyphPositions();
        expect(positions[1].yOffset).to.equal(0);
        expect(positions[2].yOffset).to.equal(0);
        positions[1].yOffset += 10;
        buffer.updateGlyphPositions(positions);
      }

      return true;
    });

    hb.shape(font, buffer);
    var positions = buffer.getGlyphPositions();

    // both mark glyphs now be offset vertically by 10, since the second mark attaches to the first mark
    expect(positions[1].yOffset).to.equal(10);
    expect(positions[2].yOffset).to.equal(239);
  });
});

describe("Direction", function () {
  it("toString returns the lowercase direction name", function () {
    expect(hb.Direction.LTR.toString()).to.equal("ltr");
    expect(hb.Direction.RTL.toString()).to.equal("rtl");
    expect(hb.Direction.TTB.toString()).to.equal("ttb");
    expect(hb.Direction.BTT.toString()).to.equal("btt");
    expect(hb.Direction.INVALID.toString()).to.equal("invalid");
  });

  it("string constructor parses the direction name", function () {
    expect(new hb.Direction("ltr")).to.deep.equal(hb.Direction.LTR);
    expect(new hb.Direction("RTL")).to.deep.equal(hb.Direction.RTL);
  });
});

describe("Script", function () {
  it("toString returns the ISO 15924 tag", function () {
    expect(hb.Script.LATIN.toString()).to.equal("Latn");
    expect(hb.Script.ARABIC.toString()).to.equal("Arab");
  });

  it("normalizes script variants to their canonical script", function () {
    // ISO 15924 variants alias to a canonical script (see hb_script_from_iso15924_tag).
    expect(new hb.Script("Aran")).to.deep.equal(hb.Script.ARABIC);
    expect(new hb.Script("Hans")).to.deep.equal(hb.Script.HAN);
    expect(new hb.Script("Hant")).to.deep.equal(hb.Script.HAN);
  });
});

describe("Language", function () {
  it("toString returns the BCP 47 tag", function () {
    expect(new hb.Language("en").toString()).to.equal("en");
    expect(new hb.Language("fa-IR").toString()).to.equal("fa-ir");
  });

  it("interns by tag", function () {
    expect(new hb.Language("en").ptr).to.equal(new hb.Language("en").ptr);
    expect(new hb.Language("en").ptr).to.not.equal(new hb.Language("fr").ptr);
  });
});

describe("Variation", function () {
  it("fromString parses tag=value", function () {
    expect(hb.Variation.fromString("wght=500")).to.deep.equal(
      new hb.Variation("wght", 500),
    );
    expect(hb.Variation.fromString("slnt=-7.5")).to.deep.equal(
      new hb.Variation("slnt", -7.5),
    );
  });

  it("fromString returns undefined for invalid input", function () {
    expect(hb.Variation.fromString("not a variation")).to.equal(undefined);
  });

  it("toString round-trips", function () {
    expect(new hb.Variation("wght", 500).toString()).to.equal("wght=500");
    expect(new hb.Variation("slnt", -7.5).toString()).to.equal("slnt=-7.5");
  });
});

describe("Feature", function () {
  it("fromString parses simple tags", function () {
    expect(hb.Feature.fromString("liga")).to.deep.equal(
      new hb.Feature("liga", 1, 0, 0xffffffff),
    );
    expect(hb.Feature.fromString("-kern")).to.deep.equal(
      new hb.Feature("kern", 0, 0, 0xffffffff),
    );
  });

  it("fromString parses values and ranges", function () {
    expect(hb.Feature.fromString("salt=2")).to.deep.equal(
      new hb.Feature("salt", 2, 0, 0xffffffff),
    );
    expect(hb.Feature.fromString("aalt[3:5]=2")).to.deep.equal(
      new hb.Feature("aalt", 2, 3, 5),
    );
  });

  it("fromString returns undefined for invalid input", function () {
    expect(hb.Feature.fromString("not a feature")).to.equal(undefined);
  });

  it("toString round-trips canonical forms", function () {
    for (const str of ["liga", "-kern", "salt=2", "aalt[3:5]=2"]) {
      expect(hb.Feature.fromString(str).toString()).to.equal(str);
    }
  });

  it("toString uses default range and value", function () {
    expect(new hb.Feature("liga").toString()).to.equal("liga");
    expect(new hb.Feature("kern", 0).toString()).to.equal("-kern");
    expect(new hb.Feature("salt", 2).toString()).to.equal("salt=2");
  });
});

describe("shape", function () {
  it("shape Latin string", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    let buffer = new hb.Buffer();
    buffer.addText("abc");
    buffer.guessSegmentProperties();
    hb.shape(font, buffer);
    const glyphs = JSON.parse(
      buffer.serialize({
        font,
        format: hb.BufferSerializeFormat.JSON,
        flags:
          hb.BufferSerializeFlag.NO_GLYPH_NAMES |
          hb.BufferSerializeFlag.GLYPH_FLAGS,
      }),
    );
    expect(glyphs[0]).to.deep.equal(
      { cl: 0, g: 68, ax: 561, ay: 0, dx: 0, dy: 0 } /* a */,
    );
    expect(glyphs[1]).to.deep.equal(
      { cl: 1, g: 69, ax: 615, ay: 0, dx: 0, dy: 0 } /* b */,
    );
    expect(glyphs[2]).to.deep.equal(
      { cl: 2, g: 70, ax: 480, ay: 0, dx: 0, dy: 0 } /* c */,
    );
  });

  it("add appends a single code point with cluster", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    let buffer = new hb.Buffer();
    buffer.add("a".codePointAt(0), 5);
    buffer.add("b".codePointAt(0), 7);
    buffer.guessSegmentProperties();
    hb.shape(font, buffer);
    const infos = buffer.getGlyphInfos();
    expect(infos).to.have.lengthOf(2);
    expect(infos[0].cluster).to.equal(5);
    expect(infos[1].cluster).to.equal(7);
  });

  it("shape Latin string code points", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    let buffer = new hb.Buffer();
    buffer.addCodePoints([..."abc"].map((c) => c.codePointAt(0)));
    buffer.guessSegmentProperties();
    hb.shape(font, buffer);
    const glyphs = JSON.parse(
      buffer.serialize({
        font,
        format: hb.BufferSerializeFormat.JSON,
        flags:
          hb.BufferSerializeFlag.NO_GLYPH_NAMES |
          hb.BufferSerializeFlag.GLYPH_FLAGS,
      }),
    );
    expect(glyphs[0]).to.deep.equal(
      { cl: 0, g: 68, ax: 561, ay: 0, dx: 0, dy: 0 } /* a */,
    );
    expect(glyphs[1]).to.deep.equal(
      { cl: 1, g: 69, ax: 615, ay: 0, dx: 0, dy: 0 } /* b */,
    );
    expect(glyphs[2]).to.deep.equal(
      { cl: 2, g: 70, ax: 480, ay: 0, dx: 0, dy: 0 } /* c */,
    );
  });

  it("shape Arabic string", function () {
    let blob = new hb.Blob(
      fs.readFileSync(
        path.join(__dirname, "fonts/noto/NotoSansArabic-Variable.ttf"),
      ),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    let buffer = new hb.Buffer();
    buffer.addText("أبجد");
    buffer.guessSegmentProperties();
    hb.shape(font, buffer);
    const glyphs = JSON.parse(
      buffer.serialize({
        font,
        format: hb.BufferSerializeFormat.JSON,
        flags:
          hb.BufferSerializeFlag.NO_GLYPH_NAMES |
          hb.BufferSerializeFlag.GLYPH_FLAGS,
      }),
    );
    expect(glyphs[0]).to.deep.equal(
      { cl: 3, g: 213, ax: 532, ay: 0, dx: 0, dy: 0, fl: 1 } /* د */,
    );
    expect(glyphs[1]).to.deep.equal(
      { cl: 2, g: 529, ax: 637, ay: 0, dx: 0, dy: 0, fl: 1 } /* ج */,
    );
    expect(glyphs[2]).to.deep.equal(
      { cl: 1, g: 101, ax: 269, ay: 0, dx: 0, dy: 0 } /* ب */,
    );
    expect(glyphs[3]).to.deep.equal(
      { cl: 0, g: 50, ax: 235, ay: 0, dx: 0, dy: 0 } /* أ */,
    );
  });

  it("shape Arabic string item", function () {
    let blob = new hb.Blob(
      fs.readFileSync(
        path.join(__dirname, "fonts/noto/NotoSansArabic-Variable.ttf"),
      ),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    let buffer = new hb.Buffer();
    buffer.addText("أبجد", 1, 2);
    buffer.guessSegmentProperties();
    hb.shape(font, buffer);
    const glyphs = JSON.parse(
      buffer.serialize({
        font,
        format: hb.BufferSerializeFormat.JSON,
        flags:
          hb.BufferSerializeFlag.NO_GLYPH_NAMES |
          hb.BufferSerializeFlag.GLYPH_FLAGS,
      }),
    );
    expect(glyphs[0]).to.deep.equal(
      { cl: 2, g: 529, ax: 637, ay: 0, dx: 0, dy: 0, fl: 1 } /* ج */,
    );
    expect(glyphs[1]).to.deep.equal(
      { cl: 1, g: 101, ax: 269, ay: 0, dx: 0, dy: 0 } /* ب */,
    );
  });

  it("shape Arabic code points item", function () {
    let blob = new hb.Blob(
      fs.readFileSync(
        path.join(__dirname, "fonts/noto/NotoSansArabic-Variable.ttf"),
      ),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    let buffer = new hb.Buffer();
    buffer.addCodePoints(
      [..."أبجد"].map((c) => c.codePointAt(0)),
      1,
      2,
    );
    buffer.guessSegmentProperties();
    hb.shape(font, buffer);
    const glyphs = JSON.parse(
      buffer.serialize({
        font,
        format: hb.BufferSerializeFormat.JSON,
        flags:
          hb.BufferSerializeFlag.NO_GLYPH_NAMES |
          hb.BufferSerializeFlag.GLYPH_FLAGS,
      }),
    );
    expect(glyphs[0]).to.deep.equal(
      { cl: 2, g: 529, ax: 637, ay: 0, dx: 0, dy: 0, fl: 1 } /* ج */,
    );
    expect(glyphs[1]).to.deep.equal(
      { cl: 1, g: 101, ax: 269, ay: 0, dx: 0, dy: 0 } /* ب */,
    );
  });

  it("shape with tracing", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    let buffer = new hb.Buffer();
    buffer.addText("abc");
    buffer.guessSegmentProperties();
    const result = hb.shapeWithTrace(
      font,
      buffer,
      [],
      0,
      hb.TracePhase.DONT_STOP,
    );
    expect(result).to.have.lengthOf(59);
    expect(result[2]).to.deep.equal({
      m: "start table GSUB script tag 'latn'",
      glyphs: true,
      t: [
        { cl: 0, g: 68 },
        { cl: 1, g: 69 },
        { cl: 2, g: 70 },
      ],
    });
    expect(result[58]).to.deep.equal({
      m: "end table GPOS script tag 'latn'",
      glyphs: true,
      t: [
        { cl: 0, g: 68, ax: 561, ay: 0, dx: 0, dy: 0 },
        { cl: 1, g: 69, ax: 615, ay: 0, dx: 0, dy: 0 },
        { cl: 2, g: 70, ax: 480, ay: 0, dx: 0, dy: 0 },
      ],
    });
  });

  it("shape with tracing and features", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    let buffer = new hb.Buffer();
    buffer.addText("fi AV");
    buffer.guessSegmentProperties();
    const result = hb.shapeWithTrace(
      font,
      buffer,
      [new hb.Feature("liga", 0), new hb.Feature("kern", 0)],
      0,
      hb.TracePhase.DONT_STOP,
    );
    expect(result).to.have.lengthOf(46);
    expect(result[2]).to.deep.equal({
      m: "start table GSUB script tag 'latn'",
      glyphs: true,
      t: [
        { cl: 0, g: 73 },
        { cl: 1, g: 76 },
        { cl: 2, g: 3 },
        { cl: 3, g: 36 },
        { cl: 4, g: 57 },
      ],
    });
    expect(result[45]).to.deep.equal({
      m: "end table GPOS script tag 'latn'",
      glyphs: true,
      t: [
        { cl: 0, g: 73, ax: 344, ay: 0, dx: 0, dy: 0 },
        { cl: 1, g: 76, ax: 258, ay: 0, dx: 0, dy: 0 },
        { cl: 2, g: 3, ax: 260, ay: 0, dx: 0, dy: 0 },
        { cl: 3, g: 36, ax: 639, ay: 0, dx: 0, dy: 0 },
        { cl: 4, g: 57, ax: 600, ay: 0, dx: 0, dy: 0 },
      ],
    });
  });

  it("shape with 3-letter languae tag", function () {
    let blob = new hb.Blob(
      fs.readFileSync(
        path.join(__dirname, "fonts/noto/NotoSansDevanagari-Regular.otf"),
      ),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    let buffer = new hb.Buffer();
    buffer.addText("५ल");
    buffer.guessSegmentProperties();
    hb.shape(font, buffer);
    var infos = buffer.getGlyphInfos();
    expect(infos).to.have.lengthOf(2);
    expect(infos[0].codepoint).to.equal(118);

    buffer.clearContents();
    buffer.addText("५ल");
    buffer.setLanguage(new hb.Language("dty"));
    buffer.guessSegmentProperties();
    hb.shape(font, buffer);
    var infos = buffer.getGlyphInfos();
    expect(infos).to.have.lengthOf(2);
    expect(infos[0].codepoint).to.equal(123);
  });

  it("shape with OpenType language tag", function () {
    let blob = new hb.Blob(
      fs.readFileSync(
        path.join(__dirname, "fonts/noto/NotoSansDevanagari-Regular.otf"),
      ),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    let buffer = new hb.Buffer();
    buffer.addText("५ल");
    buffer.guessSegmentProperties();
    hb.shape(font, buffer);
    var infos = buffer.getGlyphInfos();
    expect(infos).to.have.lengthOf(2);
    expect(infos[0].codepoint).to.equal(118);

    buffer.clearContents();
    buffer.addText("५ल");
    buffer.setLanguage(new hb.Language("x-hbot-4e455020")); // 'NEP '
    buffer.guessSegmentProperties();
    hb.shape(font, buffer);
    var infos = buffer.getGlyphInfos();
    expect(infos).to.have.lengthOf(2);
    expect(infos[0].codepoint).to.equal(123);
  });
});

describe("misc", function () {
  it("get version", function () {
    const version = hb.version();
    expect(version).to.have.property("major").that.is.a("number");
    expect(version).to.have.property("minor").that.is.a("number");
    expect(version).to.have.property("micro").that.is.a("number");
    expect(version.major).to.be.at.least(10);
  });

  it("get version string", function () {
    const versionString = hb.versionString();
    expect(versionString).to.match(/^\d+\.\d+\.\d+$/);
  });

  it("convert OpenType tag to script", function () {
    expect(hb.otTagToScript("arab").toString()).to.equal("Arab");
    expect(hb.otTagToScript("latn").toString()).to.equal("Latn");
    expect(hb.otTagToScript("dev2").toString()).to.equal("Deva");
    expect(hb.otTagToScript("nko ").toString()).to.equal("Nkoo");
    expect(hb.otTagToScript("DFLT").toString()).to.equal("\0\0\0\0");
  });

  it("convert OpenType tag to language", function () {
    expect(hb.otTagToLanguage("ARA ").toString()).to.equal("ar");
    expect(hb.otTagToLanguage("ENG ").toString()).to.equal("en");
    expect(hb.otTagToLanguage("BAD0").toString()).to.equal("bad");
    expect(hb.otTagToLanguage("SYRE").toString()).to.equal("und-syre");
  });

  it("test that calling functions repeatedly doesn't exhaust memory", function () {
    let blob = new hb.Blob(
      fs.readFileSync(path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf")),
    );
    let face = new hb.Face(blob);
    let font = new hb.Font(face);
    for (let i = 0; i < 10000; i++) {
      expect(face.listNames()).to.not.be.undefined;
      expect(face.getName(0, new hb.Language("en"))).to.not.be.undefined;
      expect(font.hExtents()).to.not.be.undefined;
      expect(font.vExtents()).to.not.be.undefined;
      expect(font.glyphHOrigin(0)).to.not.be.undefined;
      expect(font.glyphVOrigin(0)).to.be.undefined;
      expect(font.glyphExtents(0)).to.not.be.undefined;
      expect(font.glyphFromName("a")).to.not.be.undefined;
      for (let tableTag of ["GSUB", "GPOS"]) {
        expect(face.getTableFeatureTags(tableTag)).to.not.be.undefined;
        expect(face.getTableScriptTags(tableTag)).to.not.be.undefined;
        expect(face.getScriptLanguageTags(tableTag, 0)).to.not.be.undefined;
        expect(face.getLanguageFeatureTags(tableTag, 0, 0)).to.not.be.undefined;
        if (tableTag === "GSUB") {
          expect(face.getFeatureNameIds(tableTag, 50)).to.not.be.undefined;
        } else {
          expect(face.getFeatureNameIds(tableTag, 50)).to.be.undefined;
        }
      }
    }
  });
});
