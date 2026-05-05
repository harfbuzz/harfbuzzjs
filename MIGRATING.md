# Migrating from v0.x to v1.x

This guide covers the API and packaging changes between v0.x and v1.x.

## Initialization and import

The package is now an ES module. WASM initialization happens at module load time via top-level await.

| v0.x                                        | v1.x                                         |
| ------------------------------------------- | -------------------------------------------- |
| `require("harfbuzzjs").then((hb) => …)`     | `import { Blob, Face, … } from "harfbuzzjs"` |

## Class-based constructors

Instead of using factory functions, we now export classes with constructors.

| v0.x                         | v1.x                        |
| ---------------------------- | --------------------------- |
| `hb.createBlob(…)`           | `new hb.Blob(…)`            |
| `hb.createFace(…)`           | `new hb.Face(…)`            |
| `hb.createFont(…)`           | `new hb.Font(…)`            |
| `hb.createFontFuncs(…)`      | `new hb.FontFuncs(…)`       |
| `hb.createBuffer(…)`         | `new hb.Buffer(…)`          |

## Automatic memory cleanup

Instead of manually calling `.destroy()`, WASM objects are now reclaimed automatically using `FinalizationRegistry`. There are no longer any `.destroy()` methods.

## String/number arguments replaced with enums

Several APIs that took string codes or magic numbers now take typed enum
values exported from the package.

| API                            | v0.x                                  | v1.x                                                                     |
| ------------------------------ | ------------------------------------- | ------------------------------------------------------------------------ |
| `Buffer.setDirection`          | `setDirection("ltr")`                 | `setDirection(Direction.LTR)`                                            |
| `Buffer.setFlags`              | `["BOT", "PRODUCE_UNSAFE_TO_CONCAT"]` | `BufferFlag.BOT \| BufferFlag.PRODUCE_UNSAFE_TO_CONCAT`                  |
| `Buffer.serialize` `format`    | `"JSON"`                              | `BufferSerializeFormat.JSON`                                             |
| `Buffer.serialize` `flags`     | `["NO_GLYPH_NAMES", "NO_ADVANCES"]`   | `BufferSerializeFlag.NO_GLYPH_NAMES \| BufferSerializeFlag.NO_ADVANCES`  |
| `Face.getGlyphClass` return    | `"BASE_GLYPH"`                        | `GlyphClass.BASE_GLYPH`                                                  |
| `shapeWithTrace` `stop_phase`  | `1`                                   | `TracePhase.GSUB`                                                        |

## Renames

| v0.x                            | v1.x                           |
| ------------------------------- | ------------------------------ |
| `face.reference_table(tag)`     | `face.referenceTable(tag)`     |
| `hb.version_string()`           | `hb.versionString()`           |
| `GlyphPosition.x_advance`       | `GlyphPosition.xAdvance`       |
| `GlyphPosition.y_advance`       | `GlyphPosition.yAdvance`       |
| `GlyphPosition.x_offset`        | `GlyphPosition.xOffset`        |
| `GlyphPosition.y_offset`        | `GlyphPosition.yOffset`        |

### `Buffer.json()` removed

The `Buffer.json()` shortcut has been removed. Use the typed accessors instead:

- `Buffer.getGlyphInfos()` for glyph IDs, clusters, and flags.
- `Buffer.getGlyphPositions()` for advances and offsets.
- `Buffer.getGlyphInfosAndPositions()` for both combined.

When you need the raw HarfBuzz JSON output (e.g. to capture all fields including glyph names), call `Buffer.serialize()` with `BufferSerializeFormat.JSON` and `JSON.parse()` the result yourself.

## `null` replaced with `undefined`

`null` is no longer used anywhere in the API. Anything that previously returned, accepted, or held `null` now uses `undefined` instead.

Affected APIs:

- `Buffer.serialize` now takes a single options object: `{ font, start, end, format, flags }` (all optional). The previous positional signature is gone.
- `shape` and `shapeWithTrace` now take `Feature[]` instead of a comma-separated string. Use the new `Feature` class (e.g. `new Feature("liga", 0)` or `Feature.fromString("-liga")`).
- `Font.setVariations` now takes `Variation[]` instead of `Record<string, number>`. Use the new `Variation` class (e.g. `font.setVariations([new Variation("wght", 700)])` or `Variation.fromString("wght=700")`).
- `Buffer.addText` / `Buffer.addCodePoints`: `itemLength` accepts `undefined` (or omission), instead of `null`.
- `Face.getFeatureNameIds`: returns `undefined` on failure, instead of `null`.
- `Font.glyphHOrigin` / `glyphVOrigin` / `glyphExtents` / `glyphFromName`: return `undefined` on failure, instead of `null`.
- `FontFuncs.set*Func` callbacks: return `undefined` on failure, instead of `null`.
- `FeatureNameIds` fields `uiLabelNameId`, `uiTooltipTextNameId`, `sampleTextNameId`: are now optional
