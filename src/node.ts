import { resolve } from 'path'
import { readFile } from 'fs/promises'
import { hb } from './hb'

export async function initHB() {
  const data = await readFile(resolve(__dirname, '../hb.wasm'))
  
  const wasm = await WebAssembly.instantiate(data)

  return hb(wasm.instance)
}

export * from './hb'