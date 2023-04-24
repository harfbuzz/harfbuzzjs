const fs = require('fs');
const path = require('path');
const {expect} = require('chai');
let hb;

before(async function () {
  hb = await require('..');
});

afterEach(function () {
  if (this.blob) this.blob.destroy();
  if (this.face) this.face.destroy();
  if (this.font) this.font.destroy();
  if (this.buffer) this.buffer.destroy();
  this.blob = this.face = this.font = this.buffer = null;
});

describe('Face', function () {
  it('collectUnicodes reflects codepoints supported by the font', function () {
    this.blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSans-Regular.ttf')));
    this.face = hb.createFace(this.blob);
    const codepoints = [...this.face.collectUnicodes()];
    expect(codepoints).to.include('a'.codePointAt(0));
    expect(codepoints).not.to.include('ا'.codePointAt(0));
  });

  it('exposes upem', function () {
    this.blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSans-Regular.ttf')));
    this.face = hb.createFace(this.blob);
    expect(this.face.upem).to.equal(1000);
  });

  it('getAxisInfos returns details of a variable font', function () {
    this.blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSansArabic-Variable.ttf')));
    this.face = hb.createFace(this.blob);
    expect(this.face.getAxisInfos()).to.deep.equal({
      wght: {min: 100, default: 400, max: 900},
      wdth: {min: 62.5, default: 100, max: 100}
    });
  });

  it('getAxisInfos returns an empty object for a non-variable font', function () {
    this.blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSans-Regular.ttf')));
    this.face = hb.createFace(this.blob);
    expect(Object.keys(this.face.getAxisInfos())).to.have.lengthOf(0);
  });
});

describe('Font', function () {
  it('glyphName returns names for glyph ids', function () {
    this.blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSans-Regular.ttf')));
    this.face = hb.createFace(this.blob);
    this.font = hb.createFont(this.face);
    expect(this.font.glyphName(20)).to.equal('one');
  });

  it('setScale affects advances', function () {
    this.blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSans-Regular.ttf')));
    this.face = hb.createFace(this.blob);
    this.font = hb.createFont(this.face);
    this.buffer = hb.createBuffer();
    this.buffer.addText('a');
    this.buffer.guessSegmentProperties();
    this.font.setScale(1000 * 2, 1000 * 2);
    hb.shape(this.font, this.buffer)
    const glyphs = this.buffer.json();
    expect(glyphs[0].ax).to.equal(561 * 2);
  });

  it('setVariations affects advances', function () {
    this.blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSansArabic-Variable.ttf')));
    this.face = hb.createFace(this.blob);
    this.font = hb.createFont(this.face);
    this.font.setVariations({'wght': 789});
    this.buffer = hb.createBuffer();
    this.buffer.addText('آلو');
    this.buffer.guessSegmentProperties();
    hb.shape(this.font, this.buffer)
    const glyphs = this.buffer.json();
    expect(glyphs[0].ax).to.equal(526);
  });
});

describe('Buffer', function () {
  it('setDirection controls direction of glyphs', function () {
    this.blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSans-Regular.ttf')));
    this.face = hb.createFace(this.blob);
    this.font = hb.createFont(this.face);
    this.buffer = hb.createBuffer();
    this.buffer.addText('rtl');
    this.buffer.setDirection('rtl');
    hb.shape(this.font, this.buffer)
    const glyphs = this.buffer.json();
    expect(glyphs[0].g).to.equal(79); // l
    expect(glyphs[1].g).to.equal(87); // t
    expect(glyphs[2].g).to.equal(85); // r
  });

  it('setClusterLevel affects cluster merging', function () {
    this.blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSans-Regular.ttf')));
    this.face = hb.createFace(this.blob);
    this.font = hb.createFont(this.face);
    this.buffer = hb.createBuffer();
    this.buffer.setClusterLevel(1);
    this.buffer.addText('x́');
    this.buffer.guessSegmentProperties();
    hb.shape(this.font, this.buffer)
    const glyphs = this.buffer.json();
    expect(glyphs[0].cl).to.equal(0);
    expect(glyphs[1].cl).to.equal(1);
  });

  it('setFlags with PRESERVE_DEFAULT_IGNORABLES affects glyph ids', function () {
    this.blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSans-Regular.ttf')));
    this.face = hb.createFace(this.blob);
    this.font = hb.createFont(this.face);
    this.buffer = hb.createBuffer();
    this.buffer.addText('\u200dhi');
    this.buffer.setFlags(['PRESERVE_DEFAULT_IGNORABLES']);
    this.buffer.guessSegmentProperties();
    hb.shape(this.font, this.buffer)
    const glyphs = this.buffer.json();
    expect(glyphs[0].g).not.to.equal(3 /* space */);
  });
});
