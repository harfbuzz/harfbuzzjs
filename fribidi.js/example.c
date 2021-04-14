#include "fribidi/lib/fribidi.h"
#include "fribidi/lib/fribidi-char-sets-utf8.h"
#include <stdlib.h>
#include <stdio.h>

int main () {
  printf("FriBidiChar: %ld\n", sizeof (FriBidiChar));
  printf("FriBidiCharType: %ld\n", sizeof (FriBidiCharType));
  printf("FriBidiBracketType: %ld\n", sizeof (FriBidiBracketType));
  printf("FriBidiLevel: %ld\n", sizeof (FriBidiLevel));
  printf("FriBidiParType: %ld\n", sizeof (FriBidiParType));

  char utf8[] = "abcششa234 سیبسی ۲۳۴ سیشبسبbc";
  FriBidiChar* str = calloc(sizeof (utf8) * 4, sizeof (FriBidiChar));
  unsigned int str_len = fribidi_utf8_to_unicode(utf8, strlen(utf8), str);

  FriBidiParType *par_type = calloc (4, 1);
//   *par_type = FRIBIDI_PAR_ON;
  FriBidiCharType *types = calloc(str_len, sizeof (FriBidiCharType));
  FriBidiBracketType *btypes = calloc(str_len, sizeof (FriBidiBracketType));
  FriBidiLevel *levels = calloc(str_len, sizeof (FriBidiLevel));

  fribidi_get_bidi_types (str, str_len, types);
  fribidi_get_bracket_types (str, str_len, types, btypes);
  unsigned int max_level = fribidi_get_par_embedding_levels_ex(types, btypes, str_len,
    par_type, levels);

  printf("max_level: %d\n", max_level);

  for (unsigned int i = 0; i < str_len; ++i)
    printf("%d", levels[i]);

  free(types);
  free(btypes);
  free(levels);

//   var str = [0x61, 0x62, 0x63, 0x634, 0x633, 0x6cc, 0x61, 0x62, 0x63];
//   var text = new Uint32Array(str);
//   var text_ptr = exports.malloc(text.byteLength);
//   heapu8.set(text, text_ptr);

//   var types = exports.malloc(str.length * 4);
//   exports.fribidi_get_bidi_types(text_ptr, text.byteLength, types);

//   var par_type = exports.malloc(4);
//   heapu8[par_type] = 'L'.charCodeAt(0);
//   var levels = exports.malloc(text.byteLength);
//   console.log('max level', exports.fribidi_get_par_embedding_levels (types, text.byteLength, par_type, levels));
//   exports.free(text_ptr);

//   document.body.innerText = JSON.stringify([]);
//   console.log(heapu8.subarray(types, types + text.byteLength * 4));
//   console.log(heapu8.subarray(levels, levels + text.byteLength));
//   exports.free(types);
//   exports.free(levels);
//   exports.free(levels);
  return 0;
}