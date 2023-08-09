import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as path from 'path'
import * as fs from 'fs'
import { initHB, hb as hbjs } from '~/node'

type HB = ReturnType<typeof hbjs>
type Nullable<T> = T | undefined | null
declare global {
  var blob: Nullable<ReturnType<HB['createBlob']>>
  var face: Nullable<ReturnType<HB['createFace']>>
  var font: Nullable<ReturnType<HB['createFont']>>
  var buffer: Nullable<ReturnType<HB['createBuffer']>>
}
let hb: HB
beforeEach(async () => {
  hb = await initHB()
})

afterEach(() => {
  if (globalThis.buffer) globalThis.buffer.destroy()
  if (globalThis.font) globalThis.font.destroy()
  if (globalThis.face) globalThis.face.destory()
  if (globalThis.blob) globalThis.blob.destory()
  globalThis.blob = globalThis.face = globalThis.font = globalThis.buffer = null
})

describe('shape', () => {
  it('shape Latin string', () => {
    globalThis.blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSans-Regular.ttf')))
    globalThis.face = hb.createFace(globalThis.blob, 0)
    globalThis.font = hb.createFont(globalThis.face)
    globalThis.buffer = hb.createBuffer()
    globalThis.buffer.addText('abc')
    globalThis.buffer.guessSegmentProperties()
    hb.shape(globalThis.font, globalThis.buffer)
    const glyphs = globalThis.buffer.json()
    expect(glyphs[0]).to.deep.equal({cl: 0, g: 68, ax: 561, ay: 0, dx: 0, dy: 0, flags: 0} /* a */);
    expect(glyphs[1]).to.deep.equal({cl: 1, g: 69, ax: 615, ay: 0, dx: 0, dy: 0, flags: 0} /* b */);
    expect(glyphs[2]).to.deep.equal({cl: 2, g: 70, ax: 480, ay: 0, dx: 0, dy: 0, flags: 0} /* c */);
  })

  it('shape Arabic string', () => {
    globalThis.blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSansArabic-Variable.ttf')))
    globalThis.face = hb.createFace(globalThis.blob, 0)
    globalThis.font = hb.createFont(globalThis.face)
    globalThis.buffer = hb.createBuffer()
    globalThis.buffer.addText('أبجد')
    globalThis.buffer.guessSegmentProperties()
    hb.shape(globalThis.font, globalThis.buffer)
    const glyphs = globalThis.buffer.json()
    expect(glyphs[0]).to.deep.equal({cl: 3, g: 213, ax: 532, ay: 0, dx: 0, dy: 0, flags: 1} /* د */)
    expect(glyphs[1]).to.deep.equal({cl: 2, g: 529, ax: 637, ay: 0, dx: 0, dy: 0, flags: 1} /* ج */)
    expect(glyphs[2]).to.deep.equal({cl: 1, g: 101, ax: 269, ay: 0, dx: 0, dy: 0, flags: 0} /* ب */)
    expect(glyphs[3]).to.deep.equal({cl: 0, g:  50, ax: 235, ay: 0, dx: 0, dy: 0, flags: 0} /* أ */)
  })

  it('shape with tracing', () => {
    globalThis.blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSans-Regular.ttf')))
    globalThis.face = hb.createFace(globalThis.blob, 0)
    globalThis.font = hb.createFont(globalThis.face)
    globalThis.buffer = hb.createBuffer()
    globalThis.buffer.addText('abc')
    globalThis.buffer.guessSegmentProperties()
    const result = hb.shapeWithTrace(globalThis.font, globalThis.buffer, '', 0, 0)
    expect(result).to.have.lengthOf(42)
    expect(result[0]).to.deep.equal({
      "m": "start table GSUB script tag 'latn'",
      "glyphs": true,
      "t": [
        {cl: 0, g: 68},
        {cl: 1, g: 69},
        {cl: 2, g: 70},
      ],
    })
    expect(result[41]).to.deep.equal({
      "m": "end table GPOS script tag 'latn'",
      "glyphs": true,
      "t": [
        {cl: 0, g: 68, ax: 561, ay: 0, dx: 0, dy: 0},
        {cl: 1, g: 69, ax: 615, ay: 0, dx: 0, dy: 0},
        {cl: 2, g: 70, ax: 480, ay: 0, dx: 0, dy: 0},
      ],
    })
  })
})