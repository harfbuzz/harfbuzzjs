import type { Pointer } from "./export";

export interface FaceInstance {
  ptr: Pointer
  upem: Pointer
  reference_table(table: string): Uint8Array | undefined
  getAxisInfos(): {
    [p: string]: {
      min: number
      default: number
      max: number
    }
  }
  collectUnicodes(): Uint32Array
  destory(): void
}