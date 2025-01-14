/**
 * @fileoverview Created manually by @tomasdev using:
 * ```
 * npx -p typescript tsc hbjs.js --declaration --allowJs --emitDeclarationOnly
 * ```
 * And then renaming the output to re-use types, and fix types (i.e. updating
 * the type if comment documentation had it as _object_ but in reality it was
 * _string_) to remove all `any` usages.
 */

declare type HarfbuzzPointer = string;
declare type HarfbuzzModule = WebAssembly.Instance;
declare interface HarfbuzzBlob {
  ptr: HarfbuzzPointer;
  destroy: () => void;
}
declare interface HarfbuzzAxis {
  min: number;
  default: number;
  max: number;
}
declare interface HarfbuzzFace {
  ptr: HarfbuzzPointer;
  reference_table: (table: string) => Uint8Array;
  getAxisInfos: () => Record<string, HarfbuzzAxis>;
  destroy: () => void;
}
declare interface HarfbuzzVariations {
  [axisName: string]: number;
}
declare interface HarfbuzzFont {
  ptr: HarfbuzzPointer;
  glyphToPath: (glyphId: number) => string;
  glyphToJson: (glyphId: number) => Array<{type: string; values: number[];}>;
  setScale: (xScale: number, yScale: number) => void;
  setVariations: (variations: HarfbuzzVariations) => void;
  destroy: () => void;
}
declare type HarfbuzzDirection = 'ltr' | 'rtl' | 'ttb' | 'btt';
declare type HarfbuzzFlag = 'BOT' | 'EOT' | 'PRESERVE_DEFAULT_IGNORABLES' |
    'REMOVE_DEFAULT_IGNORABLES' | 'DO_NOT_INSERT_DOTTED_CIRCLE';
declare interface HarfbuzzBuffer {
  ptr: HarfbuzzPointer;
  addText: (text: string) => void;
  guessSegmentProperties: () =>
      any;  // any = return of exports.hb_buffer_guess_segment_properties(ptr)
  setDirection: (dir: HarfbuzzDirection) => void;
  setFlags: (flags: HarfbuzzFlag[]) => void;
  setLanguage: (language: string) => void;
  setScript: (script: string) => void;
  setClusterLevel: (level: number) => void;
  json: (font?: HarfbuzzFont) => {
    g: number;
    cl: number;
    ax: number;
    ay: number;
    dx: number;
    dy: number;
  }[];
  destroy: () => void;
}
declare type HarfbuzzJson = object;
declare interface HarfbuzzJs {
  createBlob: (blob: ArrayBufferLike) => HarfbuzzBlob;
  createFace: (blob: HarfbuzzBlob, index: number) => HarfbuzzFace;
  createFont: (face: HarfbuzzFace) => HarfbuzzFont;
  createBuffer: () => HarfbuzzBuffer;
  shape:
      (font: HarfbuzzFont, buffer: HarfbuzzBuffer, features?: string) => void;
  shapeWithTrace:
      (font: HarfbuzzFont, buffer: HarfbuzzBuffer, features: string,
       stop_at: number, stop_phase: number) => HarfbuzzJson;
}
declare function hbjs(instance: HarfbuzzModule): HarfbuzzJs;
