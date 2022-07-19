#include "harfbuzz/src/harfbuzz.cc"

HB_BEGIN_DECLS

int
hbjs_glyph_svg (hb_font_t *font, hb_codepoint_t glyph, char *buf, unsigned buf_size);

unsigned
hbjs_shape_with_trace (hb_font_t *font, hb_buffer_t* buf,
                       char* featurestring,
                       unsigned int stop_at, unsigned int stop_phase,
                       char *outbuf, unsigned buf_size);

void *free_ptr(void);

HB_END_DECLS


void *free_ptr(void) { return (void *) free; }

enum {
  HB_SHAPE_DONT_STOP,
  HB_SHAPE_GSUB_PHASE,
  HB_SHAPE_GPOS_PHASE
};

typedef struct user_data_t {
  char *str;
  unsigned size;
  unsigned consumed;
  hb_bool_t failure;
  unsigned int stop_at;
  unsigned int stop_phase;
  hb_bool_t stopping;
  unsigned int current_phase;
} user_data_t;


/* Our modified iota, why not using libc's? it is going to be used
   in harfbuzzjs where libc isn't available */
static void _hb_reverse (char *buf, unsigned int len)
{
  unsigned start = 0, end = len - 1;
  while (start < end)
  {
    char c = buf[end];
    buf[end] = buf[start];
    buf[start] = c;
    start++; end--;
  }
}
static unsigned _hb_itoa (int32_t num, char *buf)
{
  unsigned int i = 0;
  hb_bool_t is_negative = num < 0;
  if (is_negative) num = -num;
  do
  {
    buf[i++] = '0' + num % 10;
    num /= 10;
  } while (num);
  if (is_negative) buf[i++] = '-';
  _hb_reverse (buf, i);
  buf[i] = '\0';
  return i;
}

static void _append(user_data_t *draw_data, char x) {
  if (draw_data->consumed >= draw_data->size) {
    draw_data->failure = 1;
    return;
  }
  draw_data->str[draw_data->consumed++] = x;
}

static void _strcat(user_data_t *draw_data, const char *s) {
  while (*s) {
    _append(draw_data, *s++);
  }
}

#define ITOA_BUF_SIZE 12 // 10 digits in int32, 1 for negative sign, 1 for \0

static void
move_to (hb_draw_funcs_t *dfuncs, user_data_t *draw_data, hb_draw_state_t *,
	 float to_x, float to_y,
	 void *)
{
  /* 4 = command character space + comma + array starts with 0 index + nul character space */
  if (draw_data->consumed + 2 * ITOA_BUF_SIZE + 4 > draw_data->size) return;
  _append(draw_data, 'M');
  draw_data->consumed += _hb_itoa (to_x, draw_data->str + draw_data->consumed);
  _append(draw_data, ',');
  draw_data->consumed += _hb_itoa (to_y, draw_data->str + draw_data->consumed);
}

static void
line_to (hb_draw_funcs_t *dfuncs, user_data_t *draw_data, hb_draw_state_t *,
	 float to_x, float to_y,
	 void *)
{
  if (draw_data->consumed + 2 * ITOA_BUF_SIZE + 4 > draw_data->size) return;
  _append(draw_data, 'L');
  draw_data->consumed += _hb_itoa (to_x, draw_data->str + draw_data->consumed);
  _append(draw_data, ',');
  draw_data->consumed += _hb_itoa (to_y, draw_data->str + draw_data->consumed);
}

static void
quadratic_to (hb_draw_funcs_t *dfuncs, user_data_t *draw_data, hb_draw_state_t *,
	      float control_x, float control_y,
	      float to_x, float to_y,
	      void *)
{

  if (draw_data->consumed + 4 * ITOA_BUF_SIZE + 6 > draw_data->size) return;
  _append(draw_data, 'Q');
  draw_data->consumed += _hb_itoa (control_x, draw_data->str + draw_data->consumed);
  _append(draw_data, ',');
  draw_data->consumed += _hb_itoa (control_y, draw_data->str + draw_data->consumed);
  _append(draw_data, ' ');
  draw_data->consumed += _hb_itoa (to_x, draw_data->str + draw_data->consumed);
  _append(draw_data, ',');
  draw_data->consumed += _hb_itoa (to_y, draw_data->str + draw_data->consumed);
}

static void
cubic_to (hb_draw_funcs_t *dfuncs, user_data_t *draw_data, hb_draw_state_t *,
	  float control1_x, float control1_y,
	  float control2_x, float control2_y,
	  float to_x, float to_y,
	  void *)
{
  if (draw_data->consumed + 6 * ITOA_BUF_SIZE + 8 > draw_data->size) return;
  _append(draw_data, 'C');
  draw_data->consumed += _hb_itoa (control1_x, draw_data->str + draw_data->consumed);
  _append(draw_data, ',');
  draw_data->consumed += _hb_itoa (control1_y, draw_data->str + draw_data->consumed);
  _append(draw_data, ' ');
  draw_data->consumed += _hb_itoa (control2_x, draw_data->str + draw_data->consumed);
  _append(draw_data, ',');
  draw_data->consumed += _hb_itoa (control2_y, draw_data->str + draw_data->consumed);
  _append(draw_data, ' ');
  draw_data->consumed += _hb_itoa (to_x, draw_data->str + draw_data->consumed);
  _append(draw_data, ',');
  draw_data->consumed += _hb_itoa (to_y, draw_data->str + draw_data->consumed);
}

static void
close_path (hb_draw_funcs_t *dfuncs, user_data_t *draw_data, hb_draw_state_t *, void *)
{
  _append(draw_data, 'Z');
}

static hb_draw_funcs_t *funcs = 0;

int
hbjs_glyph_svg (hb_font_t *font, hb_codepoint_t glyph, char *buf, unsigned buf_size)
{
  if (funcs == 0) /* not the best pattern for multi-threaded apps which is not a concern here */
  {
    funcs = hb_draw_funcs_create (); /* will be leaked */
    hb_draw_funcs_set_move_to_func (funcs, (hb_draw_move_to_func_t) move_to, nullptr, nullptr);
    hb_draw_funcs_set_line_to_func (funcs, (hb_draw_line_to_func_t) line_to, nullptr, nullptr);
    hb_draw_funcs_set_quadratic_to_func (funcs, (hb_draw_quadratic_to_func_t) quadratic_to, nullptr, nullptr);
    hb_draw_funcs_set_cubic_to_func (funcs, (hb_draw_cubic_to_func_t) cubic_to, nullptr, nullptr);
    hb_draw_funcs_set_close_path_func (funcs, (hb_draw_close_path_func_t) close_path, nullptr, nullptr);
  }

  user_data_t draw_data = {
    .str = buf,
    .size = buf_size,
    .consumed = 0,
    .failure = 0,
    /* Following members not relevant for SVG */
    .stop_at = 0,
    .stop_phase = 0,
    .stopping = 0,
    .current_phase = 0
  };
  hb_font_get_glyph_shape (font, glyph, funcs, &draw_data);
  if (draw_data.failure) { return -1; }
  buf[draw_data.consumed] = '\0';
  return draw_data.consumed;
}

static hb_bool_t do_trace (hb_buffer_t *buffer,
                           hb_font_t   *font,
                           const char  *message,
                           user_data_t *user_data) {
  unsigned int consumed;
  unsigned int num_glyphs = hb_buffer_get_length (buffer);

  if (strcmp(message, "start table GSUB") == 0) {
    user_data->current_phase = HB_SHAPE_GSUB_PHASE;
  } else if (strcmp(message, "start table GPOS") == 0) {
    user_data->current_phase = HB_SHAPE_GPOS_PHASE;
  }


  if (user_data->current_phase != user_data->stop_phase) {
    user_data->stopping = 0;
  }

  // If we overflowed, keep going anyway.
  if (user_data->failure) return 1;

  if (user_data->stop_phase != HB_SHAPE_DONT_STOP) {
    // Do we need to start stopping?
    char itoabuf[ITOA_BUF_SIZE];
    _hb_itoa(user_data->stop_at, itoabuf);
    if ((user_data->current_phase == user_data->stop_phase) &&
        (strncmp(message, "end lookup ", 11) == 0) &&
        (strcmp(message + 11, itoabuf) == 0)) {
      user_data->stopping = 1;
    }
  }

  // If we need to stop, stop.
  if (user_data->stopping) return 0;

  _strcat(user_data, "{\"m\":\"");
  _strcat(user_data, message);
  _strcat(user_data, "\",\"t\":");
  hb_buffer_serialize_glyphs(buffer, 0, num_glyphs,
    user_data->str + user_data->consumed,
    user_data->size - user_data->consumed,
    &consumed,
    font,
    HB_BUFFER_SERIALIZE_FORMAT_JSON,
    HB_BUFFER_SERIALIZE_FLAG_NO_GLYPH_NAMES);
  user_data->consumed += consumed;
  _strcat(user_data, "},\n");


  return 1;
}

unsigned
hbjs_shape_with_trace (hb_font_t *font, hb_buffer_t* buf,
                       char* featurestring,
                       unsigned int stop_at, unsigned int stop_phase,
                       char *outbuf, unsigned buf_size) {
  user_data_t user_data = {
    .str = outbuf,
    .size = buf_size,
    .consumed = 0,
    .failure = 0,
    .stop_at = stop_at,
    .stop_phase = stop_phase,
    .stopping = 0,
    .current_phase = 0
  };

  int num_features = 0;
  hb_feature_t* features = nullptr;

  if (*featurestring) {
    /* count the features first, so we can allocate memory */
    char* p = featurestring;
    do {
      num_features++;
      p = strchr (p, ',');
      if (p)
        p++;
    } while (p);

    features = (hb_feature_t *) calloc (num_features, sizeof (*features));

    /* now do the actual parsing */
    p = featurestring;
    num_features = 0;
    while (p && *p) {
      char *end = strchr (p, ',');
      if (hb_feature_from_string (p, end ? end - p : -1, &features[num_features]))
        num_features++;
      p = end ? end + 1 : nullptr;
    }
  }

  hb_buffer_set_message_func (buf, (hb_buffer_message_func_t)do_trace, &user_data, nullptr);
  user_data.str[user_data.consumed++] = '[';
  hb_shape(font, buf, features, num_features);

  if (user_data.failure) return -1;

  user_data.str[user_data.consumed-2] = ']';
  user_data.str[user_data.consumed-1] = '\0';
  return user_data.consumed;
}

#ifdef MAIN
#include <stdio.h>
int main() {
    hb_blob_t *blob = hb_blob_create_from_file ("/home/ebrahim/Desktop/harfbuzzjs/harfbuzz/test/subset/data/fonts/Roboto-Regular.ttf");
    hb_face_t *face = hb_face_create (blob, 0);
    hb_blob_destroy (blob);
    hb_font_t *font = hb_font_create (face);
    hb_face_destroy (face);
    char buf[1024];
    buf[0] = '\0';
    printf ("%d %d\n", hb_blob_get_length (blob), hbjs_ot_glyph_svg (font, 0, buf, sizeof (buf)));
    puts (buf);
    hb_font_destroy (font);
}
#endif
