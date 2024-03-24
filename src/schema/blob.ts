import type { Pointer } from "./export"

export interface BlobInstace {
  ptr: Pointer
  destory(): void
}