// Empty, just to see what we can do with it, the following should be put
// at the beginning of a file to use this definitions.
// /// <reference path="harfbuzzjs.d.ts" />

interface hb_face_t { }

interface hb_font_t { }

interface Module {
  _hb_font_create(face: hb_face_t): hb_font_t;
}

declare var module: Module;
