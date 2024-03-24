export interface FontInstance {
  ptr: number
  glyphToPath(id: number): string
  glyphName(id: number): string
  glyphToJson(id: number): Array<{
    type: string
    values: number[]
  }>
  setScale(x: number, y: number): void
  setVariations (variations: Record<string, number>): void
  destroy(): void
}