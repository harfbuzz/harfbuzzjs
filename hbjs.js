function hbjs(Module) {
  'use strict';

  var exports = Module.wasmExports;
  var utf8Decoder = new TextDecoder("utf8");
  let addFunction = Module.addFunction;
  let removeFunction = Module.removeFunction;

  var freeFuncPtr = addFunction(function (ptr) { exports.free(ptr); }, 'vi');

  var HB_MEMORY_MODE_WRITABLE = 2;
  var HB_SET_VALUE_INVALID = -1;
  var HB_BUFFER_CONTENT_TYPE_GLYPHS = 2;
  var DONT_STOP = 0;
  var GSUB_PHASE = 1;
  var GPOS_PHASE = 2;

  function hb_tag(s) {
    return (
      (s.charCodeAt(0) & 0xFF) << 24 |
      (s.charCodeAt(1) & 0xFF) << 16 |
      (s.charCodeAt(2) & 0xFF) <<  8 |
      (s.charCodeAt(3) & 0xFF) <<  0
    );
  }

  var HB_BUFFER_SERIALIZE_FORMAT_JSON	= hb_tag('JSON');
  var HB_BUFFER_SERIALIZE_FLAG_NO_GLYPH_NAMES	= 4;

  function _hb_untag(tag) {
    return [
      String.fromCharCode((tag >> 24) & 0xFF),
      String.fromCharCode((tag >> 16) & 0xFF),
      String.fromCharCode((tag >>  8) & 0xFF),
      String.fromCharCode((tag >>  0) & 0xFF)
    ].join('');
  }

  function _buffer_flag(s) {
    if (s == "BOT") { return 0x1; }
    if (s == "EOT") { return 0x2; }
    if (s == "PRESERVE_DEFAULT_IGNORABLES") { return 0x4; }
    if (s == "REMOVE_DEFAULT_IGNORABLES") { return 0x8; }
    if (s == "DO_NOT_INSERT_DOTTED_CIRCLE") { return 0x10; }
    if (s == "PRODUCE_UNSAFE_TO_CONCAT") { return 0x40; }
    return 0x0;
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
  function typedArrayFromSet(setPtr) {
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
      reference_table: function(table) {
        var blob = exports.hb_face_reference_table(ptr, hb_tag(table));
        var length = exports.hb_blob_get_length(blob);
        if (!length) { return; }
        var blobptr = exports.hb_blob_get_data(blob, null);
        var table_string = Module.HEAPU8.subarray(blobptr, blobptr+length);
        return table_string;
      },
      /**
       * Return variation axis infos
       */
      getAxisInfos: function() {
        var axis = exports.malloc(64 * 32);
        var c = exports.malloc(4);
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
        exports.free(c);
        exports.free(axis);
        return result;
      },
      /**
       * Return unicodes the face supports
       */
      collectUnicodes: function() {
        var unicodeSetPtr = exports.hb_set_create();
        exports.hb_face_collect_unicodes(ptr, unicodeSetPtr);
        var result = typedArrayFromSet(unicodeSetPtr);
        exports.hb_set_destroy(unicodeSetPtr);
        return result;
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

  var nameBufferSize = 256; // should be enough for most glyphs
  var nameBuffer = exports.malloc(nameBufferSize); // permanently allocated

  /**
  * Create an object representing a Harfbuzz font.
  * @param {object} blob An object returned from `createFace`.
  **/
  function createFont(face) {
    var ptr = exports.hb_font_create(face.ptr);
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
      exports.hb_font_glyph_to_string(
        ptr,
        glyphId,
        nameBuffer,
        nameBufferSize
      );
      var array = Module.HEAPU8.subarray(nameBuffer, nameBuffer + nameBufferSize);
      return utf8Decoder.decode(array.slice(0, array.indexOf(0)));
    }

    return {
      ptr: ptr,
      glyphName: glyphName,
      glyphToPath: glyphToPath,
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
          Module.HEAPU32[vars / 4 + i * 2 + 0] = hb_tag(entry[0]);
          Module.HEAPF32[vars / 4 + i * 2 + 1] = entry[1];
        });
        exports.hb_font_set_variations(ptr, vars, entries.length);
        exports.free(vars);
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
  * Use when you know the input range should be ASCII.
  * Faster than encoding to UTF-8
  **/
  function createAsciiString(text) {
    var ptr = exports.malloc(text.length + 1);
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

  function createJsString(text) {
    const ptr = exports.malloc(text.length * 2);
    const words = new Uint16Array(Module.wasmMemory.buffer, ptr, text.length);
    for (let i = 0; i < words.length; ++i) words[i] = text.charCodeAt(i);
    return {
      ptr: ptr,
      length: words.length,
      free: function () { exports.free(ptr); }
    };
  }

  /**
  * Create an object representing a Harfbuzz buffer.
  **/
  function createBuffer() {
    var ptr = exports.hb_buffer_create();
    return {
      ptr: ptr,
      /**
      * Add text to the buffer.
      * @param {string} text Text to be added to the buffer.
      **/
      addText: function (text) {
        const str = createJsString(text);
        exports.hb_buffer_add_utf16(ptr, str.ptr, str.length, 0, str.length);
        str.free();
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
      * "BOT"
      * "EOT"
      * "PRESERVE_DEFAULT_IGNORABLES"
      * "REMOVE_DEFAULT_IGNORABLES"
      * "DO_NOT_INSERT_DOTTED_CIRCLE"
      * "PRODUCE_UNSAFE_TO_CONCAT"
      */
      setFlags: function (flags) {
        var flagValue = 0
        flags.forEach(function (s) {
          flagValue |= _buffer_flag(s);
        })

        exports.hb_buffer_set_flags(ptr,flagValue);
      },
      /**
      * Set buffer language explicitly.
      * @param {string} language: The buffer language
      */
      setLanguage: function (language) {
        var str = createAsciiString(language);
        exports.hb_buffer_set_language(ptr, exports.hb_language_from_string(str.ptr,-1));
        str.free();
      },
      /**
      * Set buffer script explicitly.
      * @param {string} script: The buffer script
      */
      setScript: function (script) {
        var str = createAsciiString(script);
        exports.hb_buffer_set_script(ptr, exports.hb_script_from_string(str.ptr,-1));
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
        var length = exports.hb_buffer_get_length(ptr);
        var result = [];
        var infosPtr = exports.hb_buffer_get_glyph_infos(ptr, 0);
        var infosPtr32 = infosPtr / 4;
        var positionsPtr32 = exports.hb_buffer_get_glyph_positions(ptr, 0) / 4;
        var infos = Module.HEAPU32.subarray(infosPtr32, infosPtr32 + 5 * length);
        var positions = Module.HEAP32.subarray(positionsPtr32, positionsPtr32 + 5 * length);
        for (var i = 0; i < length; ++i) {
          result.push({
            g: infos[i * 5 + 0],
            cl: infos[i * 5 + 2],
            ax: positions[i * 5 + 0],
            ay: positions[i * 5 + 1],
            dx: positions[i * 5 + 2],
            dy: positions[i * 5 + 3],
            flags: exports.hb_glyph_info_get_glyph_flags(infosPtr + i * 20)
          });
        }
        return result;
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
        var str = createAsciiString(feature);
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
    var currentPhase = DONT_STOP;
    var stopping = false;
    var failure = false;

    var traceBufLen = 1024 * 1024;
    var traceBufPtr = exports.malloc(traceBufLen);

    var traceFunc = function (bufferPtr, fontPtr, messagePtr, user_data) {
      var message = utf8Decoder.decode(Module.HEAPU8.subarray(messagePtr, Module.HEAPU8.indexOf(0, messagePtr)));
      if (message.startsWith("start table GSUB"))
        currentPhase = GSUB_PHASE;
      else if (message.startsWith("start table GPOS"))
        currentPhase = GPOS_PHASE;

      if (currentPhase != stop_phase)
        stopping = false;

      if (failure)
        return 1;

      if (stop_phase != DONT_STOP && currentPhase == stop_phase && message.startsWith("end lookup " + stop_at))
        stopping = true;

      if (stopping)
        return 0;

      exports.hb_buffer_serialize_glyphs(
        bufferPtr,
        0, exports.hb_buffer_get_length(bufferPtr),
        traceBufPtr, traceBufLen, 0,
        fontPtr,
        HB_BUFFER_SERIALIZE_FORMAT_JSON,
        HB_BUFFER_SERIALIZE_FLAG_NO_GLYPH_NAMES);

      trace.push({
        m: message,
        t: JSON.parse(utf8Decoder.decode(Module.HEAPU8.subarray(traceBufPtr, Module.HEAPU8.indexOf(0, traceBufPtr)))),
        glyphs: exports.hb_buffer_get_content_type(bufferPtr) == HB_BUFFER_CONTENT_TYPE_GLYPHS,
      });

      return 1;
    }

    var traceFuncPtr = addFunction(traceFunc, 'iiiii');
    exports.hb_buffer_set_message_func(buffer.ptr, traceFuncPtr, 0, 0);
    shape(font, buffer, features, 0);
    exports.free(traceBufPtr);
    removeFunction(traceFuncPtr);

    return trace;
  }

  function version() {
    var versionPtr = exports.malloc(12);
    exports.hb_version(versionPtr, versionPtr + 4, versionPtr + 8);
    var version = {
      major: Module.HEAPU32[versionPtr / 4],
      minor: Module.HEAPU32[(versionPtr + 4) / 4],
      micro: Module.HEAPU32[(versionPtr + 8) / 4],
    };
    exports.free(versionPtr);
    return version;
  }

  function version_string() {
    var versionPtr = exports.hb_version_string();
    var version = utf8Decoder.decode(Module.HEAPU8.subarray(versionPtr, Module.HEAPU8.indexOf(0, versionPtr)));
    return version;
  }

  return {
    createBlob: createBlob,
    createFace: createFace,
    createFont: createFont,
    createBuffer: createBuffer,
    shape: shape,
    shapeWithTrace: shapeWithTrace,
    version: version,
    version_string: version_string,
  };
}

// Should be replaced with something more reliable
try {
  module.exports = hbjs;
} catch (e) {}
