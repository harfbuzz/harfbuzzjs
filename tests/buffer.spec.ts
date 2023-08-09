import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as path from 'path'
import * as fs from 'fs'
import { initHB, hb as hbjs } from '../src/index'

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

describe('Buffer', () => {
  it('setDirection controls direction of glyphs', () => {
    globalThis.blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSans-Regular.ttf')))
    globalThis.face = hb.createFace(globalThis.blob, 0)
    globalThis.font = hb.createFont(globalThis.face)
    globalThis.buffer = hb.createBuffer()
    globalThis.buffer.addText('rtl')
    globalThis.buffer.setDirection('rtl')
    hb.shape(globalThis.font, globalThis.buffer)
    const glyphs = globalThis.buffer.json()

    expect(glyphs[0].g).to.equal(79) // l
    expect(glyphs[1].g).to.equal(87) // t
    expect(glyphs[2].g).to.equal(85) // r
  })

  it('setClusterLevel affects cluster merging', () => {
    globalThis.blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSans-Regular.ttf')))
    globalThis.face = hb.createFace(globalThis.blob, 0)
    globalThis.font = hb.createFont(globalThis.face)
    globalThis.buffer = hb.createBuffer()
    globalThis.buffer.setClusterLevel(1)
    globalThis.buffer.addText('x́')
    globalThis.buffer.guessSegmentProperties()
    hb.shape(globalThis.font, globalThis.buffer)
    const glyphs = globalThis.buffer.json()
    expect(glyphs[0].cl).to.equal(0)
    expect(glyphs[1].cl).to.equal(1)
  })

  it('setFlags with PRESERVE_DEFAULT_IGNORABLES affects glyph ids', () => {
    globalThis.blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSans-Regular.ttf')))
    globalThis.face = hb.createFace(globalThis.blob, 0)
    globalThis.font = hb.createFont(globalThis.face)
    globalThis.buffer = hb.createBuffer()
    globalThis.buffer.addText('\u200dhi')
    globalThis.buffer.setFlags(['REMOVE_DEFAULT_IGNORABLES'])
    globalThis.buffer.guessSegmentProperties()
    hb.shape(globalThis.font, globalThis.buffer)
    const glyphs = globalThis.buffer.json()
    expect(glyphs[0].g).not.to.equal(3 /* space */)
  })
})