const fs = require('fs');
const path = require('path');
const { expect } = require('chai');
let hb;
let blob, face, font, buffer;

before(async function () {
  hb = await require('..');
});

afterEach(function () {
  if (blob) blob.destroy();
  if (face) face.destroy();
  if (font) font.destroy();
  if (buffer) buffer.destroy();
  blob = face = font = buffer = undefined;
});

describe('Face', function () {
  it('collectUnicodes reflects codepoints supported by the font', function () {
    blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSans-Regular.ttf')));
    face = hb.createFace(blob);
    const codepoints = [...face.collectUnicodes()];
    expect(codepoints).to.include('a'.codePointAt(0));
    expect(codepoints).not.to.include('ا'.codePointAt(0));
  });

  it('exposes upem', function () {
    blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSans-Regular.ttf')));
    face = hb.createFace(blob);
    expect(face.upem).to.equal(1000);
  });

  it('getAxisInfos returns details of a variable font', function () {
    blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSansArabic-Variable.ttf')));
    face = hb.createFace(blob);
    expect(face.getAxisInfos()).to.deep.equal({
      wght: { min: 100, default: 400, max: 900 },
      wdth: { min: 62.5, default: 100, max: 100 }
    });
  });

  it('getAxisInfos returns an empty object for a non-variable font', function () {
    blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSans-Regular.ttf')));
    face = hb.createFace(blob);
    expect(Object.keys(face.getAxisInfos())).to.have.lengthOf(0);
  });
});

describe('Font', function () {
  it('glyphName returns names for glyph ids', function () {
    blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSans-Regular.ttf')));
    face = hb.createFace(blob);
    font = hb.createFont(face);
    expect(font.glyphName(20)).to.equal('one');
  });

  it('setScale affects advances', function () {
    blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSans-Regular.ttf')));
    face = hb.createFace(blob);
    font = hb.createFont(face);
    buffer = hb.createBuffer();
    buffer.addText('a');
    buffer.guessSegmentProperties();
    font.setScale(1000 * 2, 1000 * 2);
    hb.shape(font, buffer)
    const glyphs = buffer.json();
    expect(glyphs[0].ax).to.equal(561 * 2);
  });

  it('setVariations affects advances', function () {
    blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSansArabic-Variable.ttf')));
    face = hb.createFace(blob);
    font = hb.createFont(face);
    font.setVariations({ 'wght': 789 });
    buffer = hb.createBuffer();
    buffer.addText('آلو');
    buffer.guessSegmentProperties();
    hb.shape(font, buffer)
    const glyphs = buffer.json();
    expect(glyphs[0].ax).to.equal(526);
  });

  it('glyphToPath converts quadratic glyph to path', function () {
    blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSans-Regular.ttf')));
    face = hb.createFace(blob);
    font = hb.createFont(face);
    const expected21 = 'M520,0L48,0L48,73L235,262Q289,316 326,358Q363,400 382,440.5Q401,481 401,529Q401,\
588 366,618.5Q331,649 275,649Q223,649 183.5,631Q144,613 103,581L56,640Q98,675 152.5,699.5Q207,724 275,\
724Q375,724 433,673.5Q491,623 491,534Q491,478 468,429Q445,380 404,332.5Q363,285 308,231L159,84L159,80L520,80L520,0Z';
    expect(font.glyphToPath(21)).to.equal(expected21);
    const expected22 = 'M493,547Q493,475 453,432.5Q413,390 345,376L345,372Q431,362 473,318Q515,274 515,203Q515,\
141 486,92.5Q457,44 396.5,17Q336,-10 241,-10Q185,-10 137,-1.5Q89,7 45,29L45,111Q90,89 142,76.5Q194,64 242,64Q338,\
64 380.5,101.5Q423,139 423,205Q423,272 370.5,301.5Q318,331 223,331L154,331L154,406L224,406Q312,406 357.5,443Q403,\
480 403,541Q403,593 368,621.5Q333,650 273,650Q215,650 174,633Q133,616 93,590L49,650Q87,680 143.5,702Q200,724 272,\
724Q384,724 438.5,674Q493,624 493,547Z';
    expect(font.glyphToPath(22)).to.equal(expected22);
  });

  it('glyphToPath converts cubic glyph to path', function () {
    blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSans-Regular.otf')));
    face = hb.createFace(blob);
    font = hb.createFont(face);
    const expected21 = 'M520,0L520,80L159,80L159,84L308,231C418,338 491,422 491,534C491,652 408,724 275,724C184,724 112,\
687 56,640L103,581C158,624 205,649 275,649C350,649 401,607 401,529C401,432 342,370 235,262L48,73L48,0L520,0Z';
    expect(font.glyphToPath(21)).to.equal(expected21);
    const expected22 = 'M493,547C493,649 421,724 272,724C176,724 100,690 49,650L93,590C146,625 196,650 273,650C353,\
650 403,610 403,541C403,460 341,406 224,406L154,406L154,331L223,331C349,331 423,294 423,205C423,117 370,64 242,64C178,\
64 105,81 45,111L45,29C104,0 166,-10 241,-10C430,-10 515,78 515,203C515,297 459,358 345,372L345,376C435,394 493,451 493,547Z';
    expect(font.glyphToPath(22)).to.equal(expected22);
  });
});

describe('Buffer', function () {
  it('setDirection controls direction of glyphs', function () {
    blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSans-Regular.ttf')));
    face = hb.createFace(blob);
    font = hb.createFont(face);
    buffer = hb.createBuffer();
    buffer.addText('rtl');
    buffer.setDirection('rtl');
    hb.shape(font, buffer)
    const glyphs = buffer.json();
    expect(glyphs[0].g).to.equal(79); // l
    expect(glyphs[1].g).to.equal(87); // t
    expect(glyphs[2].g).to.equal(85); // r
  });

  it('setClusterLevel affects cluster merging', function () {
    blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSans-Regular.ttf')));
    face = hb.createFace(blob);
    font = hb.createFont(face);
    buffer = hb.createBuffer();
    buffer.setClusterLevel(1);
    buffer.addText('x́');
    buffer.guessSegmentProperties();
    hb.shape(font, buffer)
    const glyphs = buffer.json();
    expect(glyphs[0].cl).to.equal(0);
    expect(glyphs[1].cl).to.equal(1);
  });

  it('setFlags with PRESERVE_DEFAULT_IGNORABLES affects glyph ids', function () {
    blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSans-Regular.ttf')));
    face = hb.createFace(blob);
    font = hb.createFont(face);
    buffer = hb.createBuffer();
    buffer.addText('\u200dhi');
    buffer.setFlags(['PRESERVE_DEFAULT_IGNORABLES']);
    buffer.guessSegmentProperties();
    hb.shape(font, buffer)
    const glyphs = buffer.json();
    expect(glyphs[0].g).not.to.equal(3 /* space */);
  });
});

describe('shape', function () {
  it('shape Latin string', function () {
    blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSans-Regular.ttf')));
    face = hb.createFace(blob);
    font = hb.createFont(face);
    buffer = hb.createBuffer();
    buffer.addText('abc');
    buffer.guessSegmentProperties();
    hb.shape(font, buffer)
    const glyphs = buffer.json();
    expect(glyphs[0]).to.deep.equal({ cl: 0, g: 68, ax: 561, ay: 0, dx: 0, dy: 0, flags: 0 } /* a */);
    expect(glyphs[1]).to.deep.equal({ cl: 1, g: 69, ax: 615, ay: 0, dx: 0, dy: 0, flags: 0 } /* b */);
    expect(glyphs[2]).to.deep.equal({ cl: 2, g: 70, ax: 480, ay: 0, dx: 0, dy: 0, flags: 0 } /* c */);
  });

  it('shape Arabic string', function () {
    blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSansArabic-Variable.ttf')));
    face = hb.createFace(blob);
    font = hb.createFont(face);
    buffer = hb.createBuffer();
    buffer.addText('أبجد');
    buffer.guessSegmentProperties();
    hb.shape(font, buffer)
    const glyphs = buffer.json();
    expect(glyphs[0]).to.deep.equal({ cl: 3, g: 213, ax: 532, ay: 0, dx: 0, dy: 0, flags: 1 } /* د */);
    expect(glyphs[1]).to.deep.equal({ cl: 2, g: 529, ax: 637, ay: 0, dx: 0, dy: 0, flags: 1 } /* ج */);
    expect(glyphs[2]).to.deep.equal({ cl: 1, g: 101, ax: 269, ay: 0, dx: 0, dy: 0, flags: 0 } /* ب */);
    expect(glyphs[3]).to.deep.equal({ cl: 0, g: 50, ax: 235, ay: 0, dx: 0, dy: 0, flags: 0 } /* أ */);
  });

  it('shape with tracing', function () {
    blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSans-Regular.ttf')));
    face = hb.createFace(blob);
    font = hb.createFont(face);
    buffer = hb.createBuffer();
    buffer.addText('abc');
    buffer.guessSegmentProperties();
    const result = hb.shapeWithTrace(font, buffer, "", 0, 0)
    expect(result).to.have.lengthOf(42);
    expect(result[0]).to.deep.equal({
      "m": "start table GSUB script tag 'latn'",
      "glyphs": true,
      "t": [
        { cl: 0, g: 68 },
        { cl: 1, g: 69 },
        { cl: 2, g: 70 },
      ],
    });
    expect(result[41]).to.deep.equal({
      "m": "end table GPOS script tag 'latn'",
      "glyphs": true,
      "t": [
        { cl: 0, g: 68, ax: 561, ay: 0, dx: 0, dy: 0 },
        { cl: 1, g: 69, ax: 615, ay: 0, dx: 0, dy: 0 },
        { cl: 2, g: 70, ax: 480, ay: 0, dx: 0, dy: 0 },
      ],
    });
  });

  it('shape with tracing and features', function () {
    blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSans-Regular.ttf')));
    face = hb.createFace(blob);
    font = hb.createFont(face);
    buffer = hb.createBuffer();
    buffer.addText('fi AV');
    buffer.guessSegmentProperties();
    const result = hb.shapeWithTrace(font, buffer, "-liga,-kern", 0, 0)
    expect(result).to.have.lengthOf(29);
    expect(result[0]).to.deep.equal({
      "m": "start table GSUB script tag 'latn'",
      "glyphs": true,
      "t": [
        { cl: 0, g: 73 },
        { cl: 1, g: 76 },
        { cl: 2, g: 3 },
        { cl: 3, g: 36 },
        { cl: 4, g: 57 },
      ],
    });
    expect(result[28]).to.deep.equal({
      "m": "end table GPOS script tag 'latn'",
      "glyphs": true,
      "t": [
        { cl: 0, g: 73, ax: 344, ay: 0, dx: 0, dy: 0 },
        { cl: 1, g: 76, ax: 258, ay: 0, dx: 0, dy: 0 },
        { cl: 2, g: 3, ax: 260, ay: 0, dx: 0, dy: 0 },
        { cl: 3, g: 36, ax: 639, ay: 0, dx: 0, dy: 0 },
        { cl: 4, g: 57, ax: 600, ay: 0, dx: 0, dy: 0 },
      ],
    });
  });

  it('shape with 3-letter languae tag', function () {
    blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSansDevanagari-Regular.otf')));
    face = hb.createFace(blob);
    font = hb.createFont(face);
    buffer = hb.createBuffer();
    buffer.addText('५ल');
    buffer.guessSegmentProperties();
    hb.shape(font, buffer)
    var glyphs = buffer.json();
    expect(glyphs).to.have.lengthOf(2);
    expect(glyphs[0].g).to.equal(118);
    buffer.destroy();

    buffer = hb.createBuffer();
    buffer.addText('५ल');
    buffer.setLanguage('dty');
    buffer.guessSegmentProperties();
    hb.shape(font, buffer)
    var glyphs = buffer.json();
    expect(glyphs).to.have.lengthOf(2);
    expect(glyphs[0].g).to.equal(123);
  });

  it('shape with OpenType language tag', function () {
    blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSansDevanagari-Regular.otf')));
    face = hb.createFace(blob);
    font = hb.createFont(face);
    buffer = hb.createBuffer();
    buffer.addText('५ल');
    buffer.guessSegmentProperties();
    hb.shape(font, buffer)
    var glyphs = buffer.json();
    expect(glyphs).to.have.lengthOf(2);
    expect(glyphs[0].g).to.equal(118);
    buffer.destroy();

    buffer = hb.createBuffer();
    buffer.addText('५ल');
    buffer.setLanguage('x-hbot-4e455020'); // 'NEP '
    buffer.guessSegmentProperties();
    hb.shape(font, buffer)
    var glyphs = buffer.json();
    expect(glyphs).to.have.lengthOf(2);
    expect(glyphs[0].g).to.equal(123);
  });
});

describe('misc', function () {
  it('get version', function () {
    const version = hb.version();
    expect(version).to.have.property('major').that.is.a('number');
    expect(version).to.have.property('minor').that.is.a('number');
    expect(version).to.have.property('micro').that.is.a('number');
    expect(version.major).to.be.at.least(10);
  });
  it('get version string', function () {
    const version_string = hb.version_string();
    expect(version_string).to.match(/^\d+\.\d+\.\d+$/);
  });
});
