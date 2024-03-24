import { hb as hbjs } from 'harfbuzzjs/client'
import init from './assets/hb.wasm?init'
import fontUrl from './assets/NotoSans-Regular.ttf?url'

export async function render () {
  const wasm = await init({})
  const res = await fetch(fontUrl)
  const data = await res.arrayBuffer()
  return JSON.stringify(
    preview(hbjs(wasm), new Uint8Array(data), ''),
    undefined,
    2
  )
}

function preview (hb: Awaited<ReturnType<typeof hbjs>>, data: ArrayBuffer, text: string) {
  const blob = hb.createBlob(data)
  const face = hb.createFace(blob, 0)
  const font = hb.createFont(face)
  font.setScale(1000, 1000)
  const buffer = hb.createBuffer()
  buffer.addText(text || 'abc')
  buffer.guessSegmentProperties()
  hb.shape(font, buffer)
  const shape = buffer.json()
  const glyphs = shape
    .reduce<{
      [p: number]: {
        name: string
        path: string
        json: {
          type: string
          values: number[]
        }[]
      }
    }>((res, item) => {
      if (item.g) return res

      res[item.g] = {
        name: font.glyphName(item.g),
        path: font.glyphToPath(item.g),
        json: font.glyphToJson(item.g)
      }
      return res
    }, {})

  const unicodes = face.collectUnicodes()

  return {
    shape,
    glyphs,
    unicodes
  }
}