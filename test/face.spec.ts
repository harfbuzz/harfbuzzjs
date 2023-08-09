import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as path from 'path'
import * as fs from 'fs'
import { initHB, hb as hbjs } from '../src/index'

type HB = ReturnType<typeof hbjs>
type Nullable<T> = T | undefined | null
declare global {
  var blob: Nullable<ReturnType<HB['createBlob']>>
  var face: Nullable<ReturnType<HB['createFace']>>
}
let hb: HB
beforeEach(async () => {
  hb = await initHB()
})

afterEach(() => {
  if (globalThis.blob) globalThis.blob.destory()
  if (globalThis.face) globalThis.face.destory()
  globalThis.blob = globalThis.face = null
})

describe('Face', () => {
  it('collectUnicodes reflects codepoints supported by the font', () => {
    globalThis.blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSans-Regular.ttf')))
    globalThis.face = hb.createFace(globalThis.blob, 0)
    const codepoints = [
      ...globalThis.face.collectUnicodes()
    ]
    expect(codepoints).to.include('a'.codePointAt(0))
    expect(codepoints).to.not.include('ا'.codePointAt(0))
  })

  it('expose upem', () => {
    globalThis.blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSans-Regular.ttf')))
    globalThis.face = hb.createFace(globalThis.blob, 0)
    expect(globalThis.face.upem).to.equal(1000)
  })

  it('getAxisInfos returns details of a variable font', () => {
    globalThis.blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSansArabic-Variable.ttf')))
    globalThis.face = hb.createFace(globalThis.blob, 0)
    expect(globalThis.face.getAxisInfos()).to.deep.equal({
      wght: { min: 100, default: 400, max: 900 },
      wdth: { min: 62.5, default: 100, max: 100 }
    })
  })

  it('getAxisInfos returns an empty object for a non-variable font', () => {
    globalThis.blob = hb.createBlob(fs.readFileSync(path.join(__dirname, 'fonts/noto/NotoSans-Regular.ttf')))
    globalThis.face = hb.createFace(globalThis.blob, 0)
    expect(Object.keys(globalThis.face.getAxisInfos())).to.have.length(0)
  })
})