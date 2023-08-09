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

describe('Font', () => {
  it('glyphName returns names for glyph ids', () => {
    globalThis.blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSans-Regular.ttf')))
    globalThis.face = hb.createFace(globalThis.blob, 0)
    globalThis.font = hb.createFont(globalThis.face)
    expect(globalThis.font.glyphName(20)).to.equal('one')
  })

  it('setScale affects advances', () => {
    globalThis.blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSans-Regular.ttf')))
    globalThis.face = hb.createFace(globalThis.blob, 0)
    globalThis.font = hb.createFont(globalThis.face)
    globalThis.buffer = hb.createBuffer()
    globalThis.buffer.addText('a')
    globalThis.buffer.guessSegmentProperties()
    globalThis.font.setScale(1000 * 2, 1000 * 2)
    hb.shape(globalThis.font, globalThis.buffer)
    const glyphs = globalThis.buffer.json()
    expect(glyphs[0].ax).to.equal(561 * 2)
  })

  it('setVariations affects advances', () => {
    globalThis.blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSansArabic-Variable.ttf')))
    globalThis.face = hb.createFace(globalThis.blob, 0)
    globalThis.font = hb.createFont(globalThis.face)
    globalThis.font.setVariations({ wght: 789 })
    globalThis.buffer = hb.createBuffer()
    globalThis.buffer.addText('آلو')
    globalThis.buffer.guessSegmentProperties()
    hb.shape(globalThis.font, globalThis.buffer)
    const glyphs = globalThis.buffer.json()
    expect(glyphs[0].ax).to.equal(526)
  })
})