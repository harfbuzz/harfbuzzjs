export type HBBlob = {
  ptr: number;
  destroy: () => void;
};

export type HBFace = {
  ptr: number;
  upem: number;
  reference_table: (name: string) => Uint8Array;
  getAxisInfos: () => Record<
    string,
    { min: number; default: number; max: number }
  >;
  collectUnicodes: () => Uint32Array;
  destroy: () => void;
};

export type SvgPathCommand =
  | { type: "M"; values: [number, number] }
  | { type: "L"; values: [number, number] }
  | { type: "Q"; values: [number, number, number, number] }
  | { type: "C"; values: [number, number, number, number, number, number] }
  | { type: "Z"; values: [] };

export type HBVariations = Record<string, number>;

export type HBFont = {
  ptr: number;
  glyphName: (glyphId: number) => string;
  glyphToPath: (glyphId: number) => string;
  glyphToJson: (glyphId: number) => SvgPathCommand[];
  setScale: (xScale: number, yScale: number) => void;
  setVariations: (variations: HBVariations) => void;
  destroy: () => void;
};

export type HBFlag =
  | "BOT"
  | "EOT"
  | "PRESERVE_DEFAULT_IGNORABLES"
  | "REMOVE_DEFAULT_IGNORABLES"
  | "DO_NOT_INSERT_DOTTED_CIRCLE"
  | "PRODUCE_UNSAFE_TO_CONCAT";

export type HBDir = "ltr" | "rtl" | "ttb" | "btt";

export type HBJson = {
  g: number;
  cl: number;
  ax: number;
  ay: number;
  dx: number;
  dy: number;
  flags: number;
};

export type HBBuffer = {
  ptr: number;
  addText: (text: string) => void;
  guessSegmentProperties: () => void;
  setDirection: (dir: HBDir) => void;
  setFlags: (flags: HBFlag[]) => void;
  setLanguage: (language: string) => void;
  setScript: (script: string) => void;
  setClusterLevel: (level: number) => void;
  json: () => HBJson[];
  destroy: () => void;
};

export type HBHandle = {
  createBlob: (blob: Uint8Array) => HBBlob;
  createFace: (blob: HBBlob, index: number) => HBFace;
  createFont: (face: HBFace) => HBFont;
  createBuffer: () => HBBuffer;
  shape: (font: HBFont, buffer: HBBuffer, features: string) => void;
};

export type HBModule = {
  wasmExports: WebAssembly.Exports;
  wasmMemory: WebAssembly.Memory;
  HEAPU8: Uint8Array;
  HEAPU16: Uint16Array;
  HEAPU32: Uint32Array;
  addFunction: (fn: Function, signature: string) => number;
  removeFunction: (ptr: number) => void;
  stackSave: () => number;
  stackRestore: (ptr: number) => void;
  stackAlloc: (size: number) => number;
};
