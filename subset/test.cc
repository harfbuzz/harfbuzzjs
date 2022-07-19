// clang test.cc -o test -I ../harfbuzz/src/ -fno-rtti -fno-exceptions -lm && ./test
#include <stdio.h>
#include <stdlib.h>

#include <harfbuzz.cc>
#include <hb-subset.cc>
#include <hb-subset-cff1.cc>
#include <hb-subset-cff2.cc>
#include <hb-subset-cff-common.cc>
#include <hb-subset-input.cc>
#include <hb-subset-plan.cc>

int main() {
    hb_blob_t *blob = hb_blob_create_from_file ("roboto-black.ttf");
    hb_face_t *face = hb_face_create (blob, 0/*this is ttcIndex*/);
    hb_blob_destroy (blob); /* face keeps a reference of to it so you can destroy it here */

    /* Add your glyph indices here and subset */
    hb_set_t *glyphs = hb_set_create ();
    hb_set_add (glyphs, 'a');
    hb_set_add (glyphs, 'b');
    hb_set_add (glyphs, 'c');

    hb_subset_input_t *input = hb_subset_input_create_or_fail ();
    hb_set_t *input_glyphs = hb_subset_input_unicode_set (input);
    hb_set_union (input_glyphs, glyphs);
    hb_set_destroy (glyphs);
    //hb_subset_input_set_drop_hints (input, true);
    hb_face_t *subset = hb_subset_or_fail (face, input);

    /* Clean up */
    hb_subset_input_destroy (input);

    if (!subset)
    {
      hb_face_destroy (face);
      return 1;
    }

    /* Get result blob */
    hb_blob_t *result = hb_face_reference_blob (subset);
    unsigned int length = hb_blob_get_length (result);
    const char *data = hb_blob_get_data (result, 0);

    /* Write. If you like! */
    FILE *f = fopen ("roboto-black-subset-c.ttf", "wb");
    fwrite (data, 1, length, f);
    fclose (f);

    /* Clean up */
    hb_blob_destroy (result);
    hb_face_destroy (subset);
    hb_face_destroy (face);

    return 0;
}
