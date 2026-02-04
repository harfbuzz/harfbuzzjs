function hbjs(Module) {
  'use strict';

  var exports = Module.wasmExports;
  var utf8Decoder = new TextDecoder("utf8");
  var utf8Encoder = new TextEncoder("utf8");
  let addFunction = Module.addFunction;
  let removeFunction = Module.removeFunction;
  let stackSave = Module.stackSave;
  let stackRestore = Module.stackRestore;
  let stackAlloc = Module.stackAlloc;

  var freeFuncPtr = addFunction(function (ptr) { exports.free(ptr); }, 'vi');

  const TRACE_PHASE_DONT_STOP = 0;
  const TRACE_PHASE_GSUB = 1;
  const TRACE_PHASE_GPOS = 2;

  const STATIC_ARRAY_SIZE = 128

  const HB_MEMORY_MODE_WRITABLE = 2;
  const HB_SET_VALUE_INVALID = -1;
  const HB_OT_NAME_ID_INVALID = 0xFFFF;

  const bufferContentType = {
    0: "INVALID",
    1: "UNICODE",
    2: "GLYPHS",
  };
  const bufferSerializeFlags = {
    "DEFAULT": 0x00000000,
    "NO_CLUSTERS": 0x00000001,
    "NO_POSITIONS": 0x00000002,
    "NO_GLYPH_NAMES": 0x00000004,
    "GLYPH_EXTENTS": 0x00000008,
    "GLYPH_FLAGS": 0x00000010,
    "NO_ADVANCES": 0x00000020,
  };

  const bufferFlags = {
    "DEFAULT": 0x00000000,
    "BOT": 0x00000001,
    "EOT": 0x00000002,
    "PRESERVE_DEFAULT_IGNORABLES": 0x00000004,
    "REMOVE_DEFAULT_IGNORABLES": 0x00000008,
    "DO_NOT_INSERT_DOTTED_CIRCLE": 0x00000010,
    "VERIFY": 0x00000020,
    "PRODUCE_UNSAFE_TO_CONCAT": 0x00000040,
    "PRODUCE_SAFE_TO_INSERT_TATWEEL": 0x00000080,
  };

  function _hb_tag(s) {
    return (
      (s.charCodeAt(0) & 0xFF) << 24 |
      (s.charCodeAt(1) & 0xFF) << 16 |
      (s.charCodeAt(2) & 0xFF) << 8 |
      (s.charCodeAt(3) & 0xFF) << 0
    );
  }

  function _hb_untag(tag) {
    return [
      String.fromCharCode((tag >> 24) & 0xFF),
      String.fromCharCode((tag >> 16) & 0xFF),
      String.fromCharCode((tag >> 8) & 0xFF),
      String.fromCharCode((tag >> 0) & 0xFF)
    ].join('');
  }

  function _utf8_ptr_to_string(ptr, length) {
    let end;
    if (length === undefined) end = Module.HEAPU8.indexOf(0, ptr);
    else end = ptr + length;
    return utf8Decoder.decode(Module.HEAPU8.subarray(ptr, end));
  }

  function _utf16_ptr_to_string(ptr, length) {
    let end = ptr / 2 + length;
    return String.fromCharCode.apply(null, Module.HEAPU16.subarray(ptr / 2, end));
  }

  /**
  * Use when you know the input range should be ASCII.
  * Faster than encoding to UTF-8
  **/
  function _string_to_ascii_ptr(text) {
    const ptr = exports.malloc(text.length + 1);
    for (let i = 0; i < text.length; ++i) {
      const char = text.charCodeAt(i);
      if (char > 127) throw new Error('Expected ASCII text');
      Module.HEAPU8[ptr + i] = char;
    }
    Module.HEAPU8[ptr + text.length] = 0;
    return {
      ptr: ptr,
      length: text.length,
      free: function () { exports.free(ptr); }
    };
  }

  function _string_to_utf8_ptr(text) {
    const ptr = exports.malloc(text.length);
    utf8Encoder.encodeInto(text, Module.HEAPU8.subarray(ptr, ptr + text.length));
    return {
      ptr: ptr,
      length: text.length,
      free: function () { exports.free(ptr); }
    };
  }

  function _string_to_utf16_ptr(text) {
    const ptr = exports.malloc(text.length * 2);
    const words = new Uint16Array(Module.wasmMemory.buffer, ptr, text.length);
    for (let i = 0; i < words.length; ++i) words[i] = text.charCodeAt(i);
    return {
      ptr: ptr,
      length: words.length,
      free: function () { exports.free(ptr); }
    };
  }

  function _language_to_string(language) {
    var ptr = exports.hb_language_to_string(language);
    return _utf8_ptr_to_string(ptr);
  }

  function _language_from_string(str) {
    var languageStr = _string_to_ascii_ptr(str);
    var languagePtr = exports.hb_language_from_string(languageStr.ptr, -1);
    languageStr.free();
    return languagePtr;
  }

  /**
  * Create an object representing a Harfbuzz blob.
  * @param {string} blob A blob of binary data (usually the contents of a font file).
  **/
  function createBlob(blob) {
    var blobPtr = exports.malloc(blob.byteLength);
    Module.HEAPU8.set(new Uint8Array(blob), blobPtr);
    var ptr = exports.hb_blob_create(blobPtr, blob.byteLength, HB_MEMORY_MODE_WRITABLE, blobPtr, freeFuncPtr);
    return {
      ptr: ptr,
      /**
      * Free the object.
      */
      destroy: function () { exports.hb_blob_destroy(ptr); }
    };
  }

  /**
   * Return the typed array of HarfBuzz set contents.
   * @param {number} setPtr Pointer of set
   * @returns {Uint32Array} Typed array instance
   */
  function _typed_array_from_set(setPtr) {
    const setCount = exports.hb_set_get_population(setPtr);
    const arrayPtr = exports.malloc(setCount << 2);
    const arrayOffset = arrayPtr >> 2;
    const array = Module.HEAPU32.subarray(arrayOffset, arrayOffset + setCount);
    Module.HEAPU32.set(array, arrayOffset);
    exports.hb_set_next_many(setPtr, HB_SET_VALUE_INVALID, arrayPtr, setCount);
    return array;
  }

  /**
  * Create an object representing a Harfbuzz face.
  * @param {object} blob An object returned from `createBlob`.
  * @param {number} index The index of the font in the blob. (0 for most files,
  *  or a 0-indexed font number if the `blob` came form a TTC/OTC file.)
  **/
  function createFace(blob, index) {
    var ptr = exports.hb_face_create(blob.ptr, index);
    const upem = exports.hb_face_get_upem(ptr);
    return {
      ptr: ptr,
      upem,
      /**
       * Return the binary contents of an OpenType table.
       * @param {string} table Table name
       */
      reference_table: function (table) {
        var blob = exports.hb_face_reference_table(ptr, _hb_tag(table));
        var length = exports.hb_blob_get_length(blob);
        if (!length) { return; }
        var blobptr = exports.hb_blob_get_data(blob, null);
        var table_string = Module.HEAPU8.subarray(blobptr, blobptr + length);
        return table_string;
      },
      /**
       * Return variation axis infos
       */
      getAxisInfos: function () {
        var sp = stackSave();
        var axis = stackAlloc(64 * 32);
        var c = stackAlloc(4);
        Module.HEAPU32[c / 4] = 64;
        exports.hb_ot_var_get_axis_infos(ptr, 0, c, axis);
        var result = {};
        Array.from({ length: Module.HEAPU32[c / 4] }).forEach(function (_, i) {
          result[_hb_untag(Module.HEAPU32[axis / 4 + i * 8 + 1])] = {
            min: Module.HEAPF32[axis / 4 + i * 8 + 4],
            default: Module.HEAPF32[axis / 4 + i * 8 + 5],
            max: Module.HEAPF32[axis / 4 + i * 8 + 6]
          };
        });
        stackRestore(sp);
        return result;
      },
      /**
       * Return unicodes the face supports
       */
      collectUnicodes: function () {
        var unicodeSetPtr = exports.hb_set_create();
        exports.hb_face_collect_unicodes(ptr, unicodeSetPtr);
        var result = _typed_array_from_set(unicodeSetPtr);
        exports.hb_set_destroy(unicodeSetPtr);
        return result;
      },
      /**
       * Return all scripts enumerated in the specified face's
       * GSUB table or GPOS table.
       * @param {string} table: The table to query, either "GSUB" or "GPOS".
       **/
      getTableScriptTags: function (table) {
        var sp = stackSave();
        var tableTag = _hb_tag(table);
        var startOffset = 0;
        var scriptCount = STATIC_ARRAY_SIZE;
        var scriptCountPtr = stackAlloc(4);
        var scriptTagsPtr = stackAlloc(STATIC_ARRAY_SIZE * 4);
        var tags = [];
        while (scriptCount == STATIC_ARRAY_SIZE) {
          Module.HEAPU32[scriptCountPtr / 4] = scriptCount;
          exports.hb_ot_layout_table_get_script_tags(ptr, tableTag, startOffset,
            scriptCountPtr, scriptTagsPtr);
          scriptCount = Module.HEAPU32[scriptCountPtr / 4];
          var scriptTags = Module.HEAPU32.subarray(scriptTagsPtr / 4,
            scriptTagsPtr / 4 + scriptCount);
          tags.push(...Array.from(scriptTags).map(_hb_untag));
          startOffset += scriptCount;
        }
        stackRestore(sp);
        return tags;
      },
      /**
       * Return all features enumerated in the specified face's
       * GSUB table or GPOS table.
       * @param {string} table: The table to query, either "GSUB" or "GPOS".
       **/
      getTableFeatureTags: function (table) {
        var sp = stackSave();
        var tableTag = _hb_tag(table);
        var startOffset = 0;
        var featureCount = STATIC_ARRAY_SIZE;
        var featureCountPtr = stackAlloc(4);
        var featureTagsPtr = stackAlloc(STATIC_ARRAY_SIZE * 4);
        var tags = [];
        while (featureCount == STATIC_ARRAY_SIZE) {
          Module.HEAPU32[featureCountPtr / 4] = featureCount;
          exports.hb_ot_layout_table_get_feature_tags(ptr, tableTag, startOffset,
            featureCountPtr, featureTagsPtr);
          featureCount = Module.HEAPU32[featureCountPtr / 4];
          var scriptTags = Module.HEAPU32.subarray(featureTagsPtr / 4,
            featureTagsPtr / 4 + featureCount);
          tags.push(...Array.from(scriptTags).map(_hb_untag));
          startOffset += featureCount;
        }
        stackRestore(sp);
        return tags;

      },
      /**
       * Return language tags in the given face's GSUB or GPOS table, underneath
       * the specified script index.
       * @param {string} table: The table to query, either "GSUB" or "GPOS".
       * @param {number} scriptIndex: The index of the script to query.
       **/
      getScriptLanguageTags: function (table, scriptIndex) {
        var sp = stackSave();
        var tableTag = _hb_tag(table);
        var startOffset = 0;
        var languageCount = STATIC_ARRAY_SIZE;
        var languageCountPtr = stackAlloc(4);
        var languageTagsPtr = stackAlloc(STATIC_ARRAY_SIZE * 4);
        var tags = [];
        while (languageCount == STATIC_ARRAY_SIZE) {
          Module.HEAPU32[languageCountPtr / 4] = languageCount;
          exports.hb_ot_layout_script_get_language_tags(ptr, tableTag, scriptIndex, startOffset,
            languageCountPtr, languageTagsPtr);
          languageCount = Module.HEAPU32[languageCountPtr / 4];
          var languageTags = Module.HEAPU32.subarray(languageTagsPtr / 4,
            languageTagsPtr / 4 + languageCount);
          tags.push(...Array.from(languageTags).map(_hb_untag));
          startOffset += languageCount;
        }
        stackRestore(sp);
        return tags;
      },
      /**
       * Return all features in the specified face's GSUB table or GPOS table,
       * underneath the specified script and language.
       * @param {string} table: The table to query, either "GSUB" or "GPOS".
       * @param {number} scriptIndex: The index of the script to query.
       * @param {number} languageIndex: The index of the language to query.
       **/
      getLanguageFeatureTags: function (table, scriptIndex, languageIndex) {
        var sp = stackSave();
        var tableTag = _hb_tag(table);
        var startOffset = 0;
        var featureCount = STATIC_ARRAY_SIZE;
        var featureCountPtr = stackAlloc(4);
        var featureTagsPtr = stackAlloc(STATIC_ARRAY_SIZE * 4);
        var tags = [];
        while (featureCount == STATIC_ARRAY_SIZE) {
          Module.HEAPU32[featureCountPtr / 4] = featureCount;
          exports.hb_ot_layout_language_get_feature_tags(ptr, tableTag, scriptIndex, languageIndex, startOffset,
            featureCountPtr, featureTagsPtr);
          featureCount = Module.HEAPU32[featureCountPtr / 4];
          var featureTags = Module.HEAPU32.subarray(featureTagsPtr / 4,
            featureTagsPtr / 4 + featureCount);
          tags.push(...Array.from(featureTags).map(_hb_untag));
          startOffset += featureCount;
        }
        stackRestore(sp);
        return tags;
      },
      /**
       * Return all names in the specified face's name table.
       **/
      listNames: function () {
        var sp = stackSave();
        var numEntriesPtr = stackAlloc(4);
        var entriesPtr = exports.hb_ot_name_list_names(ptr, numEntriesPtr);
        var numEntries = Module.HEAPU32[numEntriesPtr / 4];
        var entries = [];
        for (var i = 0; i < numEntries; i++) {
          // FIXME: this depends on the struct memory layout.
          // A more robust way would involve ading helper C functions to access
          // the struct and use them here.
          entries.push({
            nameId: Module.HEAPU32[(entriesPtr / 4) + (i * 3)],
            language: _language_to_string(Module.HEAPU32[(entriesPtr / 4) + (i * 3) + 2])
          });
        }
        stackRestore(sp);
        return entries;
      },
      /**
       * Get the name of the specified face.
       * @param {number} nameId The ID of the name to get.
       * @param {string} language The language of the name to get.
       **/
      getName: function (nameId, language) {
        var sp = stackSave();
        var languagePtr = _language_from_string(language);
        var nameLen = exports.hb_ot_name_get_utf16(ptr, nameId, languagePtr, 0, 0) + 1;
        var textSizePtr = stackAlloc(4);
        var textPtr = exports.malloc(nameLen * 2);
        Module.HEAPU32[textSizePtr / 4] = nameLen;
        exports.hb_ot_name_get_utf16(ptr, nameId, languagePtr, textSizePtr, textPtr);
        var name = _utf16_ptr_to_string(textPtr, nameLen - 1);
        exports.free(textPtr);
        stackRestore(sp);
        return name;
      },
      /**
       * Get the name IDs of the specified feature.
       * @param {string} table The table to query, either "GSUB" or "GPOS".
       * @param {number} featureIndex The index of the feature to query.
       **/
      getFeatureNameIds: function (table, featureIndex) {
        var sp = stackSave();
        var tableTag = _hb_tag(table);
        var labelIdPtr = stackAlloc(4);
        var tooltipIdPtr = stackAlloc(4);
        var sampleIdPtr = stackAlloc(4);
        var numNamedParametersPtr = stackAlloc(4);
        var firstParameterIdPtr = stackAlloc(4);

        var found = exports.hb_ot_layout_feature_get_name_ids(ptr, tableTag, featureIndex,
          labelIdPtr, tooltipIdPtr, sampleIdPtr, numNamedParametersPtr, firstParameterIdPtr);

        var names = null;
        if (found) {
          let uiLabelNameId = Module.HEAPU32[labelIdPtr / 4];
          let uiTooltipTextNameId = Module.HEAPU32[tooltipIdPtr / 4];
          let sampleTextNameId = Module.HEAPU32[sampleIdPtr / 4];
          let numNamedParameters = Module.HEAPU32[numNamedParametersPtr / 4];
          let firstParameterId = Module.HEAPU32[firstParameterIdPtr / 4];
          let paramUiLabelNameIds = Array(numNamedParameters).fill().map((_, i) => firstParameterId + i);
          names = {
            uiLabelNameId: uiLabelNameId == HB_OT_NAME_ID_INVALID ? null : uiLabelNameId,
            uiTooltipTextNameId: uiTooltipTextNameId == HB_OT_NAME_ID_INVALID ? null : uiTooltipTextNameId,
            sampleTextNameId: sampleTextNameId == HB_OT_NAME_ID_INVALID ? null : sampleTextNameId,
            paramUiLabelNameIds: paramUiLabelNameIds
          };
        }

        stackRestore(sp);
        return names;
      },
      /**
       * Free the object.
       */
      destroy: function () {
        exports.hb_face_destroy(ptr);
      },
    };
  }

  var pathBuffer = "";

  /**
  * Create an object representing a Harfbuzz font.
  * @param {object} blob An object returned from `createFace`.
  * @param {number} ptr Optional pointer to an existing font.
  **/
  function createFont(face, ptr) {
    var ptr = ptr ? exports.hb_font_reference(ptr) : exports.hb_font_create(face.ptr);
    var drawFuncsPtr = null;
    var moveToPtr = null;
    var lineToPtr = null;
    var cubicToPtr = null;
    var quadToPtr = null;
    var closePathPtr = null;

    /**
    * Return a glyph as an SVG path string.
    * @param {number} glyphId ID of the requested glyph in the font.
    **/
    function glyphToPath(glyphId) {
      if (!drawFuncsPtr) {
        var moveTo = function (dfuncs, draw_data, draw_state, to_x, to_y, user_data) {
          pathBuffer += `M${to_x},${to_y}`;
        }
        var lineTo = function (dfuncs, draw_data, draw_state, to_x, to_y, user_data) {
          pathBuffer += `L${to_x},${to_y}`;
        }
        var cubicTo = function (dfuncs, draw_data, draw_state, c1_x, c1_y, c2_x, c2_y, to_x, to_y, user_data) {
          pathBuffer += `C${c1_x},${c1_y} ${c2_x},${c2_y} ${to_x},${to_y}`;
        }
        var quadTo = function (dfuncs, draw_data, draw_state, c_x, c_y, to_x, to_y, user_data) {
          pathBuffer += `Q${c_x},${c_y} ${to_x},${to_y}`;
        }
        var closePath = function (dfuncs, draw_data, draw_state, user_data) {
          pathBuffer += 'Z';
        }

        moveToPtr = addFunction(moveTo, 'viiiffi');
        lineToPtr = addFunction(lineTo, 'viiiffi');
        cubicToPtr = addFunction(cubicTo, 'viiiffffffi');
        quadToPtr = addFunction(quadTo, 'viiiffffi');
        closePathPtr = addFunction(closePath, 'viiii');
        drawFuncsPtr = exports.hb_draw_funcs_create();
        exports.hb_draw_funcs_set_move_to_func(drawFuncsPtr, moveToPtr, 0, 0);
        exports.hb_draw_funcs_set_line_to_func(drawFuncsPtr, lineToPtr, 0, 0);
        exports.hb_draw_funcs_set_cubic_to_func(drawFuncsPtr, cubicToPtr, 0, 0);
        exports.hb_draw_funcs_set_quadratic_to_func(drawFuncsPtr, quadToPtr, 0, 0);
        exports.hb_draw_funcs_set_close_path_func(drawFuncsPtr, closePathPtr, 0, 0);
      }

      pathBuffer = "";
      exports.hb_font_draw_glyph(ptr, glyphId, drawFuncsPtr, 0);
      return pathBuffer;
    }

    /**
     * Return glyph name.
     * @param {number} glyphId ID of the requested glyph in the font.
     **/
    function glyphName(glyphId) {
      var sp = stackSave();
      var strSize = 256;
      var strPtr = stackAlloc(strSize);
      exports.hb_font_glyph_to_string(ptr, glyphId, strPtr, strSize);
      var name = _utf8_ptr_to_string(strPtr);
      stackRestore(sp);
      return name;
    }

    return {
      ptr: ptr,
      /**
       * Create a sub font.
       * @returns {object} Object representing the sub font.
       **/
      subFont: function () {
        return createFont(null, exports.hb_font_create_sub_font(ptr));
      },
      /**
       * Return font horizontal extents.
       * @returns {object} Object with ascender, descender, and lineGap properties.
       **/
      hExtents: function () {
        var sp = stackSave();
        var extentsPtr = stackAlloc(12);
        exports.hb_font_get_h_extents(ptr, extentsPtr);
        var extents = {
          ascender: Module.HEAP32[extentsPtr / 4],
          descender: Module.HEAP32[extentsPtr / 4 + 1],
          lineGap: Module.HEAP32[extentsPtr / 4 + 2],
        };
        stackRestore(sp);
        return extents;
      },
      /**
       * Return font vertical extents.
       * @returns {object} Object with ascender, descender, and lineGap properties.
       **/
      vExtents: function () {
        var sp = stackSave();
        var extentsPtr = stackAlloc(12);
        exports.hb_font_get_v_extents(ptr, extentsPtr);
        var extents = {
          ascender: Module.HEAP32[extentsPtr / 4],
          descender: Module.HEAP32[extentsPtr / 4 + 1],
          lineGap: Module.HEAP32[extentsPtr / 4 + 2],
        };
        stackRestore(sp);
        return extents;
      },
      glyphName: glyphName,
      glyphToPath: glyphToPath,
      /**
       * Return glyph horizontal advance.
       * @param {number} glyphId ID of the requested glyph in the font.
       **/
      glyphHAdvance: function (glyphId) {
        return exports.hb_font_get_glyph_h_advance(ptr, glyphId);
      },
      /**
       * Return glyph vertical advance.
       * @param {number} glyphId ID of the requested glyph in the font.
       **/
      glyphVAdvance: function (glyphId) {
        return exports.hb_font_get_glyph_v_advance(ptr, glyphId);
      },
      /**
       * Return glyph horizontal origin.
       * @param {number} glyphId ID of the requested glyph in the font.
       **/
      glyphHOrigin: function (glyphId) {
        var sp = stackSave();
        let xPtr = stackAlloc(4);
        let yPtr = stackAlloc(4);
        let origin = null;
        if (exports.hb_font_get_glyph_h_origin(ptr, glyphId, xPtr, yPtr)) {
          origin = [Module.HEAP32[xPtr / 4], Module.HEAP32[yPtr / 4]];
        }
        stackRestore(sp);
        return origin;
      },
      /**
       * Return glyph vertical origin.
       * @param {number} glyphId ID of the requested glyph in the font.
       **/
      glyphVOrigin: function (glyphId) {
        var sp = stackSave();
        let xPtr = stackAlloc(4);
        let yPtr = stackAlloc(4);
        let origin = null;
        if (exports.hb_font_get_glyph_v_origin(ptr, glyphId, xPtr, yPtr)) {
          origin = [Module.HEAP32[xPtr / 4], Module.HEAP32[yPtr / 4]];
        }
        stackRestore(sp);
        return origin;
      },
      /**
       * Return glyph extents.
       * @param {number} glyphId ID of the requested glyph in the font.
       **/
      glyphExtents: function (glyphId) {
        var sp = stackSave();
        var extentsPtr = stackAlloc(16);
        var extents = null;
        if (exports.hb_font_get_glyph_extents(ptr, glyphId, extentsPtr)) {
          extents = {
            xBearing: Module.HEAP32[extentsPtr / 4],
            yBearing: Module.HEAP32[extentsPtr / 4 + 1],
            width: Module.HEAP32[extentsPtr / 4 + 2],
            height: Module.HEAP32[extentsPtr / 4 + 3]
          };
        }
        stackRestore(sp);
        return extents;
      },
      /**
       * Return glyph ID from name.
       * @param {string} name Name of the requested glyph in the font.
       **/
      glyphFromName: function (name) {
        var sp = stackSave();
        var glyphIdPtr = stackAlloc(4);
        var namePtr = _string_to_utf8_ptr(name);
        var glyphId = null;
        if (exports.hb_font_get_glyph_from_name(ptr, namePtr.ptr, namePtr.length, glyphIdPtr)) {
          glyphId = Module.HEAPU32[glyphIdPtr / 4];
        }
        namePtr.free();
        stackRestore(sp);
        return glyphId;
      },
      /**
      * Return a glyph as a JSON path string
      * based on format described on https://svgwg.org/specs/paths/#InterfaceSVGPathSegment
      * @param {number} glyphId ID of the requested glyph in the font.
      **/
      glyphToJson: function (glyphId) {
        var path = glyphToPath(glyphId);
        return path.replace(/([MLQCZ])/g, '|$1 ').split('|').filter(function (x) { return x.length; }).map(function (x) {
          var row = x.split(/[ ,]/g);
          return { type: row[0], values: row.slice(1).filter(function (x) { return x.length; }).map(function (x) { return +x; }) };
        });
      },
      /**
      * Set the font's scale factor, affecting the position values returned from
      * shaping.
      * @param {number} xScale Units to scale in the X dimension.
      * @param {number} yScale Units to scale in the Y dimension.
      **/
      setScale: function (xScale, yScale) {
        exports.hb_font_set_scale(ptr, xScale, yScale);
      },
      /**
       * Set the font's variations.
       * @param {object} variations Dictionary of variations to set
       **/
      setVariations: function (variations) {
        var entries = Object.entries(variations);
        var vars = exports.malloc(8 * entries.length);
        entries.forEach(function (entry, i) {
          Module.HEAPU32[vars / 4 + i * 2 + 0] = _hb_tag(entry[0]);
          Module.HEAPF32[vars / 4 + i * 2 + 1] = entry[1];
        });
        exports.hb_font_set_variations(ptr, vars, entries.length);
        exports.free(vars);
      },
      /**
      * Set the font's font functions.
      * @param {object} fontFuncs The font functions.
      **/
      setFuncs: function (fontFuncs) {
        exports.hb_font_set_funcs(ptr, fontFuncs.ptr);
      },
      /**
      * Free the object.
      */
      destroy: function () {
        exports.hb_font_destroy(ptr);
        if (drawFuncsPtr) {
          exports.hb_draw_funcs_destroy(drawFuncsPtr);
          drawFuncsPtr = null;
          removeFunction(moveToPtr);
          removeFunction(lineToPtr);
          removeFunction(cubicToPtr);
          removeFunction(quadToPtr);
          removeFunction(closePathPtr);
        }
      }
    };
  }

  /**
  * Create a object representing a HarfBuzz font functions.
  **/
  function createFontFuncs() {
    var ptr = exports.hb_font_funcs_create();
    return {
      ptr: ptr,
      /**
      * Set the font's glyph extents function.
      * @param {function} func The function to set.
      *
      * The function takes the following arguments:
      * @param {object} font The font.
      * @param {number} glyph The glyph ID.
      *
      * The function should return an object with the following properties, or null on failure:
      * @param {number} xBearing The x bearing of the glyph.
      * @param {number} yBearing The y bearing of the glyph.
      * @param {number} width The width of the glyph.
      * @param {number} height The height of the glyph.
      **/
      setGlyphExtentsFunc: function (func) {
        let funcPtr = addFunction(function (fontPtr, font_data, glyph, extentsPtr, user_data) {
          let font = createFont(null, fontPtr);
          let extents = func(font, glyph);
          font.destroy();
          if (extents) {
            Module.HEAP32[extentsPtr / 4] = extents.xBearing;
            Module.HEAP32[extentsPtr / 4 + 1] = extents.yBearing;
            Module.HEAP32[extentsPtr / 4 + 2] = extents.width;
            Module.HEAP32[extentsPtr / 4 + 3] = extents.height;
            return 1;
          }
          return 0;
        }, 'ippipp');
        exports.hb_font_funcs_set_glyph_extents_func(ptr, funcPtr, 0, 0);
      },
      /**
      * Set the font's glyph from name function.
      * @param {function} func The function to set.
      *
      * The function takes the following arguments:
      * @param {object} font The font.
      * @param {string} name The glyph name.
      *
      * The function should return an object with the following properties, or null on failure:
      * @param {number} glyph The glyph ID.
      **/
      setGlyphFromNameFunc: function (func) {
        let funcPtr = addFunction(function (fontPtr, font_data, namePtr, len, glyphPtr, user_data) {
          let font = createFont(null, fontPtr);
          let name = _utf8_ptr_to_string(namePtr, len);
          let glyph = func(font, name);
          font.destroy();
          if (glyph) {
            Module.HEAPU32[glyphPtr / 4] = glyph;
            return 1;
          }
          return 0;
        }, 'ipppipp');
        exports.hb_font_funcs_set_glyph_from_name_func(ptr, funcPtr, 0, 0);
      },
      /**
      * Set the font's glyph horizontal advance function.
      * @param {function} func The function to set.
      *
      * The function takes the following arguments:
      * @param {object} font The font.
      * @param {number} glyph The glyph ID.
      *
      * The function should return the horizontal advance of the glyph.
      **/
      setGlyphHAdvanceFunc: function (func) {
        let funcPtr = addFunction(function (fontPtr, font_data, glyph, user_data) {
          let font = createFont(null, fontPtr);
          let advance = func(font, glyph);
          font.destroy();
          return advance;
        }, 'ippip');
        exports.hb_font_funcs_set_glyph_h_advance_func(ptr, funcPtr, 0, 0);
      },
      /**
      * Set the font's glyph vertical advance function.
      * @param {function} func The function to set.
      *
      * The function takes the following arguments:
      * @param {object} font The font.
      * @param {number} glyph The glyph ID.
      *
      * The function should return the vertical advance of the glyph.
      **/
      setGlyphVAdvanceFunc: function (func) {
        let funcPtr = addFunction(function (fontPtr, font_data, glyph, user_data) {
          let font = createFont(null, fontPtr);
          let advance = func(font, glyph);
          font.destroy();
          return advance;
        }, 'ippip');
        exports.hb_font_funcs_set_glyph_v_advance_func(ptr, funcPtr, 0, 0);
      },
      /**
      * Set the font's glyph horizontal origin function.
      * @param {function} func The function to set.
      *
      * The function takes the following arguments:
      * @param {object} font The font.
      * @param {number} glyph The glyph ID.
      *
      * The function should return the x and y horizontal origin of the glyph, or null on failure.
      **/
      setGlyphHOriginFunc: function (func) {
        let funcPtr = addFunction(function (fontPtr, font_data, glyph, xPtr, yPtr, user_data) {
          let font = createFont(null, fontPtr);
          let origin = func(font, glyph);
          font.destroy();
          if (origin) {
            Module.HEAP32[xPtr / 4] = origin[0];
            Module.HEAP32[yPtr / 4] = origin[1];
            return 1;
          }
          return 0;
        }, 'ippippp');
        exports.hb_font_funcs_set_glyph_h_origin_func(ptr, funcPtr, 0, 0);
      },
      /**
      * Set the font's glyph vertical origin function.
      * @param {function} func The function to set.
      *
      * The function takes the following arguments:
      * @param {object} font The font.
      * @param {number} glyph The glyph ID.
      *
      * The function should return the x and y vertical origin of the glyph, or null on failure.
      **/
      setGlyphVOriginFunc: function (func) {
        let funcPtr = addFunction(function (fontPtr, font_data, glyph, xPtr, yPtr, user_data) {
          let font = createFont(null, fontPtr);
          let origin = func(font, glyph);
          font.destroy();
          if (origin) {
            Module.HEAP32[xPtr / 4] = origin[0];
            Module.HEAP32[yPtr / 4] = origin[1];
            return 1;
          }
          return 0;
        }, 'ippippp');
        exports.hb_font_funcs_set_glyph_v_origin_func(ptr, funcPtr, 0, 0);
      },
      /**
      * Set the font's glyph horizontal kerning function.
      * @param {function} func The function to set.
      *
      * The function takes the following arguments:
      * @param {object} font The font.
      * @param {number} firstGlyph The first glyph ID.
      * @param {number} secondGlyph The second glyph ID.
      *
      * The function should return the horizontal kerning of the glyphs.
      **/
      setGlyphHKerningFunc: function (func) {
        let funcPtr = addFunction(function (fontPtr, font_data, firstGlyph, secondGlyph, user_data) {
          let font = createFont(null, fontPtr);
          let kerning = func(font, firstGlyph, secondGlyph);
          font.destroy();
          return kerning;
        }, 'ippiip');
        exports.hb_font_funcs_set_glyph_h_kerning_func(ptr, funcPtr, 0, 0);
      },
      /**
      * Set the font's glyph name function.
      * @param {function} func The function to set.
      *
      * The function takes the following arguments:
      * @param {object} font The font.
      * @param {number} glyph The glyph ID.
      *
      * The function should return the name of the glyph, or null on failure.
      **/
      setGlyphNameFunc: function (func) {
        let funcPtr = addFunction(function (fontPtr, font_data, glyph, namePtr, size, user_data) {
          let font = createFont(null, fontPtr);
          let name = func(font, glyph);
          font.destroy();
          if (name) {
            utf8Encoder.encodeInto(name, Module.HEAPU8.subarray(namePtr, namePtr + size));
            return 1;
          }
          return 0;
        }, 'ippipip');
        exports.hb_font_funcs_set_glyph_name_func(ptr, funcPtr, 0, 0);
      },
      /**
      * Set the font's nominal glyph function.
      * @param {function} func The function to set.
      *
      * The function takes the following arguments:
      * @param {object} font The font.
      * @param {number} unicode The unicode.
      *
      * The function should return the nominal glyph of the unicode, or null on failure.
      **/
      setNominalGlyphFunc: function (func) {
        let funcPtr = addFunction(function (fontPtr, font_data, unicode, glyphPtr, user_data) {
          let font = createFont(null, fontPtr);
          let glyph = func(font, unicode);
          font.destroy();
          if (glyph) {
            Module.HEAPU32[glyphPtr / 4] = glyph;
            return 1;
          }
          return 0;
        }, 'ippipp');
        exports.hb_font_funcs_set_nominal_glyph_func(ptr, funcPtr, 0, 0);
      },
      /**
      * Set the font's variation glyph function.
      * @param {function} func The function to set.
      *
      * The function takes the following arguments:
      * @param {object} font The font.
      * @param {number} unicode The unicode.
      * @param {number} variationSelector The variation selector.
      *
      * The function should return the variation glyph of the unicode, or null on failure.
      **/
      setVariationGlyphFunc: function (func) {
        let funcPtr = addFunction(function (fontPtr, font_data, unicode, variationSelector, glyphPtr, user_data) {
          let font = createFont(null, fontPtr);
          let glyph = func(font, unicode, variationSelector);
          font.destroy();
          if (glyph) {
            Module.HEAPU32[glyphPtr / 4] = glyph;
            return 1;
          }
          return 0;
        }, 'ippiipp');
        exports.hb_font_funcs_set_variation_glyph_func(ptr, funcPtr, 0, 0);
      },
      /**
      * Set the font's horizontal extents function.
      * @param {function} func The function to set.
      *
      * The function takes the following arguments:
      * @param {object} font The font.
      *
      * The function should return an object with the following properties, or null on failure:
      * @param {number} ascender The ascender of the font.
      * @param {number} descender The descender of the font.
      * @param {number} lineGap The line gap of the font.
      **/
      setFontHExtentsFunc: function (func) {
        let funcPtr = addFunction(function (fontPtr, font_data, extentsPtr, user_data) {
          let font = createFont(null, fontPtr);
          let extents = func(font);
          font.destroy();
          if (extents) {
            Module.HEAP32[extentsPtr / 4] = extents.ascender;
            Module.HEAP32[extentsPtr / 4 + 1] = extents.descender;
            Module.HEAP32[extentsPtr / 4 + 2] = extents.lineGap;
            return 1;
          }
          return 0;
        }, 'ipppp');
        exports.hb_font_funcs_set_font_h_extents_func(ptr, funcPtr, 0, 0);
      },
      /**
      * Set the font's vertical extents function.
      * @param {function} func The function to set.
      *
      * The function takes the following arguments:
      * @param {object} font The font.
      *
      * The function should return an object with the following properties, or null on failure:
      * @param {number} ascender The ascender of the font.
      * @param {number} descender The descender of the font.
      * @param {number} lineGap The line gap of the font.
      **/
      setFontVExtentsFunc: function (func) {
        let funcPtr = addFunction(function (fontPtr, font_data, extentsPtr, user_data) {
          let font = createFont(null, fontPtr);
          let extents = func(font);
          font.destroy();
          if (extents) {
            Module.HEAP32[extentsPtr / 4] = extents.ascender;
            Module.HEAP32[extentsPtr / 4 + 1] = extents.descender;
            Module.HEAP32[extentsPtr / 4 + 2] = extents.lineGap;
            return 1;
          }
          return 0;
        }, 'ipppp');
        exports.hb_font_funcs_set_font_v_extents_func(ptr, funcPtr, 0, 0);
      },
      destroy: function () {
        exports.hb_font_funcs_destroy(ptr);
      }
    };
  }

  /**
  * Create an object representing a Harfbuzz buffer.
  * @param {number} ptr Optional. The pointer to the buffer.
  **/
  function createBuffer(ptr) {
    var ptr = ptr ? exports.hb_buffer_reference(ptr) : exports.hb_buffer_create();
    return {
      ptr: ptr,
      /**
      * Add text to the buffer.
      * @param {string} text Text to be added to the buffer.
      * @param {number} itemOffset Optional. The offset of the first character to add to the buffer.
      * @param {number} itemLength Optional. The number of characters to add to the buffer, or null for the end of text.
      **/
      addText: function (text, itemOffset = 0, itemLength = null) {
        const str = _string_to_utf16_ptr(text);
        if (itemLength == null) itemLength = str.length;
        exports.hb_buffer_add_utf16(ptr, str.ptr, str.length, itemOffset, itemLength);
        str.free();
      },
      /**
      * Add code points to the buffer.
      * @param {number[]} codePoints Array of code points to be added to the buffer.
      * @param {number} itemOffset Optional. The offset of the first code point to add to the buffer.
      * @param {number} itemLength Optional. The number of code points to add to the buffer, or null for the end of the array.
      */
      addCodePoints: function (codePoints, itemOffset = 0, itemLength = null) {
        let codePointsPtr = exports.malloc(codePoints.length * 4);
        let codePointsArray = new Uint32Array(Module.wasmMemory.buffer, codePointsPtr, codePoints.length);
        codePointsArray.set(codePoints);
        if (itemLength == null) itemLength = codePoints.length;
        exports.hb_buffer_add_codepoints(ptr, codePointsPtr, codePoints.length, itemOffset, itemLength);
        exports.free(codePointsPtr);
      },
      /**
      * Set buffer script, language and direction.
      *
      * This needs to be done before shaping.
      **/
      guessSegmentProperties: function () {
        return exports.hb_buffer_guess_segment_properties(ptr);
      },
      /**
      * Set buffer direction explicitly.
      * @param {string} direction: One of "ltr", "rtl", "ttb" or "btt"
      */
      setDirection: function (dir) {
        exports.hb_buffer_set_direction(ptr, {
          ltr: 4,
          rtl: 5,
          ttb: 6,
          btt: 7
        }[dir] || 0);
      },
      /**
      * Set buffer flags explicitly.
      * @param {string[]} flags: A list of strings which may be either:
      * "DEFAULT"
      * "BOT"
      * "EOT"
      * "PRESERVE_DEFAULT_IGNORABLES"
      * "REMOVE_DEFAULT_IGNORABLES"
      * "DO_NOT_INSERT_DOTTED_CIRCLE"
      * "VERIFY"
      * "PRODUCE_UNSAFE_TO_CONCAT"
      * "PRODUCE_SAFE_TO_INSERT_TATWEEL"
      */
      setFlags: function (flags) {
        var flagsValue = 0
        flags.forEach(s => flagsValue |= bufferFlags[s] || 0);
        exports.hb_buffer_set_flags(ptr, flagsValue);
      },
      /**
      * Set buffer language explicitly.
      * @param {string} language: The buffer language
      */
      setLanguage: function (language) {
        var str = _string_to_ascii_ptr(language);
        exports.hb_buffer_set_language(ptr, exports.hb_language_from_string(str.ptr, -1));
        str.free();
      },
      /**
      * Set buffer script explicitly.
      * @param {string} script: The buffer script
      */
      setScript: function (script) {
        var str = _string_to_ascii_ptr(script);
        exports.hb_buffer_set_script(ptr, exports.hb_script_from_string(str.ptr, -1));
        str.free();
      },
      /**
      * Set the Harfbuzz clustering level.
      *
      * Affects the cluster values returned from shaping.
      * @param {number} level: Clustering level. See the Harfbuzz manual chapter
      * on Clusters.
      **/
      setClusterLevel: function (level) {
        exports.hb_buffer_set_cluster_level(ptr, level)
      },
      /**
      * Reset the buffer to its initial status.
      **/
      reset: function () {
        exports.hb_buffer_reset(ptr);
      },
      /**
      * Similar to reset(), but does not clear the Unicode functions and the
      * replacement code point.
      **/
      clearContents: function () {
        exports.hb_buffer_clear_contents(ptr);
      },
      /**
      * Set message func.
      * @param {function} func The function to set.
      *
      * The function should accept three arguments:
      * @param {object} buffer The buffer
      * @param {object} font The font
      * @param {string} message The message
      *
      * Returning false from this function will skip this shaping step and move to the next one.
      */
      setMessageFunc: function (func) {
        var traceFunc = function (bufferPtr, fontPtr, messagePtr, user_data) {
          var message = _utf8_ptr_to_string(messagePtr);
          var buffer = createBuffer(bufferPtr);
          var font = createFont(null, fontPtr);
          var result = func(buffer, font, message);
          buffer.destroy();
          font.destroy();
          return result ? 1 : 0;
        }
        var traceFuncPtr = addFunction(traceFunc, 'iiiii');
        exports.hb_buffer_set_message_func(ptr, traceFuncPtr, 0, 0);
      },
      /**
      * Get the the number of items in the buffer.
      * @returns {number} The buffer length.
      */
      getLength: function () {
        return exports.hb_buffer_get_length(ptr);
      },
      /**
      * Get the glyph information from the buffer.
      * @returns {object[]} The glyph information.
      *
      * The glyph information is returned as an array of objects with the
      * following properties:
      * @param {number} codepoint either a Unicode code point (before shaping) or a glyph index (after shaping).
      * @param {number} cluster The cluster index of the glyph.
      */
      getGlyphInfos: function () {
        var infosPtr32 = exports.hb_buffer_get_glyph_infos(ptr, 0) / 4;
        // hb_glyph_info_t struct: { codepoint, mask, cluster, var1, var2 } (5 uint32s)
        var infosArray = Module.HEAPU32.subarray(infosPtr32, infosPtr32 + this.getLength() * 5);
        var infos = [];
        for (var i = 0; i < infosArray.length; i += 5) {
          infos.push({
            codepoint: infosArray[i],
            cluster: infosArray[i + 2],
          });
        }
        return infos;
      },
      /**
      * Get the glyph positions from the buffer.
      * @returns {object[]} The glyph positions.
      *
      * The glyph positions are returned as an array of objects with the
      * following properties:
      * @param {number} x_advance The x advance of the glyph.
      * @param {number} y_advance The y advance of the glyph.
      * @param {number} x_offset The x offset of the glyph.
      * @param {number} y_offset The y offset of the glyph.
      *
      */
      getGlyphPositions: function () {
        var positionsPtr32 = exports.hb_buffer_get_glyph_positions(ptr, 0) / 4;
        if (positionsPtr32 == 0) {
          return [];
        }
        // hb_glyph_position_t struct: { x_advance, y_advance, x_offset, y_offset, var } (5 int32s)
        var positionsArray = Module.HEAP32.subarray(positionsPtr32, positionsPtr32 + this.getLength() * 5);
        var positions = [];
        for (var i = 0; i < positionsArray.length; i += 5) {
          positions.push({
            x_advance: positionsArray[i],
            y_advance: positionsArray[i + 1],
            x_offset: positionsArray[i + 2],
            y_offset: positionsArray[i + 3],
          });
        }
        return positions;
      },
      /**
      * Serialize the buffer contents to a string.
      * @param {object} font Optional. The font to use for serialization.
      * @param {number} start Optional. The starting index of the glyphs to serialize.
      * @param {number} end Optional. The ending index of the glyphs to serialize.
      * @param {string} format Optional. The format to serialize the buffer contents to.
      * @param {string[]} flags Optional. The flags to use for serialization. A list of strings which may be either:
      * "DEFAULT"
      * "NO_CLUSTERS"
      * "NO_POSITIONS"
      * "NO_GLYPH_NAMES"
      * "GLYPH_EXTENTS"
      * "GLYPH_FLAGS"
      * "NO_ADVANCES"
      *
      * @returns {string} The serialized buffer contents.
      */
      serialize: function (font, start = 0, end = null, format = "TEXT", flags = []) {
        var sp = stackSave();
        if (end == null) end = this.getLength();
        var bufLen = 32 * 1024;
        var bufPtr = exports.malloc(bufLen);
        var bufConsumedPtr = stackAlloc(4);
        var flagsValue = 0;
        flags.forEach(flag => flagsValue |= bufferSerializeFlags[flag] || 0);
        var result = "";
        while (start < end) {
          start += exports.hb_buffer_serialize(ptr, start, end,
            bufPtr, bufLen, bufConsumedPtr,
            font ? font.ptr : 0, _hb_tag(format), flagsValue);
          var bufConsumed = Module.HEAPU32[bufConsumedPtr / 4];
          if (bufConsumed == 0) break;
          result += _utf8_ptr_to_string(bufPtr, bufConsumed);
        }
        exports.free(bufPtr);
        stackRestore(sp);
        return result;
      },
      /**
      * Return the buffer content type.
      *
      * @returns {string} The buffer content type. One of:
      * "INVALID"
      * "UNICODE"
      * "GLYPHS"
      */
      getContentType: function () {
        return bufferContentType[exports.hb_buffer_get_content_type(ptr)];
      },
      /**
      * Return the buffer contents as a JSON object.
      *
      * After shaping, this function will return an array of glyph information
      * objects. Each object will have the following attributes:
      *
      *   - g: The glyph ID
      *   - cl: The cluster ID
      *   - ax: Advance width (width to advance after this glyph is painted)
      *   - ay: Advance height (height to advance after this glyph is painted)
      *   - dx: X displacement (adjustment in X dimension when painting this glyph)
      *   - dy: Y displacement (adjustment in Y dimension when painting this glyph)
      *   - flags: Glyph flags like `HB_GLYPH_FLAG_UNSAFE_TO_BREAK` (0x1)
      **/
      json: function () {
        var buf = this.serialize(null, 0, null, "JSON", ["NO_GLYPH_NAMES", "GLYPH_FLAGS"]);
        var json = JSON.parse(buf);
        // For backward compatibility, as harfbuzz uses 'fl' for flags but earlier
        // we were doing the serialization ourselves and used 'flags'.
        json.forEach(function (glyph) {
          glyph.flags = glyph.fl || 0;
          delete glyph.fl;
        });
        return json;
      },
      /**
      * Free the object.
      */
      destroy: function () { exports.hb_buffer_destroy(ptr); }
    };
  }

  /**
  * Shape a buffer with a given font.
  *
  * This returns nothing, but modifies the buffer.
  *
  * @param {object} font: A font returned from `createFont`
  * @param {object} buffer: A buffer returned from `createBuffer` and suitably
  *   prepared.
  * @param {object} features: A string of comma-separated OpenType features to apply.
  */
  function shape(font, buffer, features) {
    var featuresPtr = 0;
    var featuresLen = 0;
    if (features) {
      features = features.split(",");
      featuresPtr = exports.malloc(16 * features.length);
      features.forEach(function (feature, i) {
        var str = _string_to_ascii_ptr(feature);
        if (exports.hb_feature_from_string(str.ptr, -1, featuresPtr + featuresLen * 16))
          featuresLen++;
        str.free();
      });
    }

    exports.hb_shape(font.ptr, buffer.ptr, featuresPtr, featuresLen);
    if (featuresPtr)
      exports.free(featuresPtr);
  }

  /**
  * Shape a buffer with a given font, returning a JSON trace of the shaping process.
  *
  * This function supports "partial shaping", where the shaping process is
  * terminated after a given lookup ID is reached. If the user requests the function
  * to terminate shaping after an ID in the GSUB phase, GPOS table lookups will be
  * processed as normal.
  *
  * @param {object} font: A font returned from `createFont`
  * @param {object} buffer: A buffer returned from `createBuffer` and suitably
  *   prepared.
  * @param {object} features: A string of comma-separated OpenType features to apply.
  * @param {number} stop_at: A lookup ID at which to terminate shaping.
  * @param {number} stop_phase: Either 0 (don't terminate shaping), 1 (`stop_at`
      refers to a lookup ID in the GSUB table), 2 (`stop_at` refers to a lookup
      ID in the GPOS table).
  */
  function shapeWithTrace(font, buffer, features, stop_at, stop_phase) {
    var trace = [];
    var currentPhase = TRACE_PHASE_DONT_STOP;
    var stopping = false;
    var failure = false;

    buffer.setMessageFunc((buffer, font, message) => {
      if (message.startsWith("start table GSUB"))
        currentPhase = TRACE_PHASE_GSUB;
      else if (message.startsWith("start table GPOS"))
        currentPhase = TRACE_PHASE_GPOS;

      if (currentPhase != stop_phase)
        stopping = false;

      if (failure)
        return true;

      if (stop_phase != TRACE_PHASE_DONT_STOP && currentPhase == stop_phase && message.startsWith("end lookup " + stop_at))
        stopping = true;

      if (stopping)
        return false;

      var traceBuf = buffer.serialize(font, 0, null, "JSON", ["NO_GLYPH_NAMES"]);

      trace.push({
        m: message,
        t: JSON.parse(traceBuf),
        glyphs: buffer.getContentType() == "GLYPHS",
      });

      return true;
    });

    shape(font, buffer, features, 0);
    return trace;
  }

  function version() {
    var sp = stackSave();
    var versionPtr = stackAlloc(12);
    exports.hb_version(versionPtr, versionPtr + 4, versionPtr + 8);
    var version = {
      major: Module.HEAPU32[versionPtr / 4],
      minor: Module.HEAPU32[(versionPtr + 4) / 4],
      micro: Module.HEAPU32[(versionPtr + 8) / 4],
    };
    stackRestore(sp);
    return version;
  }

  function version_string() {
    var versionPtr = exports.hb_version_string();
    return _utf8_ptr_to_string(versionPtr);
  }

  /**
   * Convert an OpenType script tag to HarfBuzz script.
   * @param {string} tag: The tag to convert.
   * @returns {string}: The script.
   */
  function otTagToScript(tag) {
    var hbTag = _hb_tag(tag);
    var script = exports.hb_ot_tag_to_script(hbTag);
    return _hb_untag(script);
  }

  /**
   * Convert an OpenType language tag to HarfBuzz language.
   * @param {string} tag: The tag to convert.
   * @returns {string}: The language.
   */
  function otTagToLanguage(tag) {
    var hbTag = _hb_tag(tag);
    var language = exports.hb_ot_tag_to_language(hbTag);
    return _language_to_string(language);
  }

  return {
    createBlob: createBlob,
    createFace: createFace,
    createFont: createFont,
    createFontFuncs: createFontFuncs,
    createBuffer: createBuffer,
    shape: shape,
    shapeWithTrace: shapeWithTrace,
    version: version,
    version_string: version_string,
    otTagToScript: otTagToScript,
    otTagToLanguage: otTagToLanguage,
  };
}

// Should be replaced with something more reliable
try {
  module.exports = hbjs;
} catch (e) { }
