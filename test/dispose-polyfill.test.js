import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Run `fn` with a global Symbol that lacks Symbol.dispose until it is
// polyfilled, as in runtimes without it.
async function withoutSymbolDispose(fn) {
  const OriginalSymbol = globalThis.Symbol;
  globalThis.Symbol = new Proxy(function () {}, {
    apply: (target, thisArg, args) => OriginalSymbol(...args),
    get: (target, key) =>
      key === "dispose" ? target.dispose : Reflect.get(OriginalSymbol, key),
  });
  try {
    await fn();
  } finally {
    globalThis.Symbol = OriginalSymbol;
  }
}

// Compile `using` declarations the way TypeScript does for runtimes without
// them; its helper reads Symbol.dispose when the declaration runs.
function transpileUsing(body) {
  const { outputText } = ts.transpileModule(
    `export function run(hb, data) { ${body} }`,
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2021,
        module: ts.ModuleKind.CommonJS,
      },
    },
  );
  const exports = {};
  new Function("exports", outputText)(exports);
  return exports.run;
}

const data = fs.readFileSync(
  path.join(__dirname, "fonts/noto/NotoSans-Regular.ttf"),
);

it("works with Symbol.dispose polyfilled before the import", async function () {
  await withoutSymbolDispose(async () => {
    Symbol.dispose ??= Symbol("Symbol.dispose");
    // A query string gives a fresh copy of the module.
    const hb = await import("../dist/index.mjs?polyfilled-before-import");

    const blob = new hb.Blob(data);
    blob[Symbol.dispose]();
    expect(() => blob.ptr).to.throw("Blob has been disposed");

    const usingDeclarations = transpileUsing(
      `using blob = new hb.Blob(data);
      using face = new hb.Face(blob);
      return { blob, face, unicodes: [...face.collectUnicodes()] };`,
    );
    const result = usingDeclarations(hb, data);
    expect(result.unicodes).to.include("a".codePointAt(0));
    expect(() => result.blob.ptr).to.throw("Blob has been disposed");
    expect(() => result.face.ptr).to.throw("Face has been disposed");
  });
});

it("does not work with Symbol.dispose polyfilled after the import", async function () {
  await withoutSymbolDispose(async () => {
    const hb = await import("../dist/index.mjs?polyfilled-after-import");
    Symbol.dispose ??= Symbol("Symbol.dispose");

    const blob = new hb.Blob(data);
    expect(blob[Symbol.dispose]).to.equal(undefined);
  });
});
