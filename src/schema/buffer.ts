import { GlyphFlag } from "./export"

export interface BufferInstance {
  ptr: number
  addText(text: string): void
  guessSegmentProperties(): void
  setDirection(dir: 'ltr' | 'rtl' | 'ttb' | 'btt'): void
  setFlags(flags: Array<'BOT' | 'EOT' | 'PRESERVE_DEFAULT_IGNORABLES' | 'REMOVE_DEFAULT_IGNORABLES' | 'DO_NOT_INSERT_DOTTED_CIRCLE' | 'PRODUCE_UNSAFE_TO_CONCAT'>): void
  setLanguage(language: string): void
  setScript(script: string): void
  setClusterLevel(level: number): void
  json(): Array<{
    g: number
    cl: number
    ax: number
    ay: number
    dx: number
    dy: number
    flags: GlyphFlag
  }>
}