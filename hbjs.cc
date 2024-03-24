#include "harfbuzz/src/harfbuzz.cc"

HB_BEGIN_DECLS

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

struct user_data_t {
  user_data_t(char *str_,
              unsigned size_,
              unsigned stop_at_ = 0,
              unsigned stop_phase_ = 0)
    : str(str_)
    , size(size_)
    , stop_at(stop_at_)
    , stop_phase(stop_phase_)
  {}
  char *str = nullptr;
  unsigned size = 0;
  unsigned consumed = 0;
  hb_bool_t failure = false;
  unsigned stop_at = 0;
  unsigned stop_phase = 0;
  hb_bool_t stopping = false;
  unsigned current_phase = 0;
};


static void
_user_data_printf (user_data_t *data, const char *format, ...)
{
#define BUFSIZE 1000
  char buf[BUFSIZE];
  int len;
  va_list va;

  if (!data || data->failure)
    return;

  va_start(va, format);
  len = vsnprintf(buf, BUFSIZE, format, va);
  va_end(va);

  if (data->consumed + len >= data->size || len < 0 || len > BUFSIZE)
  {
      data->failure = true;
      return;
  }

  memcpy (data->str + data->consumed, buf, len);
  data->consumed += len;
#undef BUFSIZE
}

static hb_bool_t do_trace (hb_buffer_t *buffer,
                           hb_font_t   *font,
                           const char  *message,
                           user_data_t *user_data) {
  unsigned int consumed;
  unsigned int num_glyphs = hb_buffer_get_length (buffer);

  if (strncmp(message, "start table GSUB", 16) == 0) {
    user_data->current_phase = HB_SHAPE_GSUB_PHASE;
  } else if (strncmp(message, "start table GPOS", 16) == 0) {
    user_data->current_phase = HB_SHAPE_GPOS_PHASE;
  }


  if (user_data->current_phase != user_data->stop_phase) {
    user_data->stopping = false;
  }

  // If we overflowed, keep going anyway.
  if (user_data->failure) return 1;

  if (user_data->stop_phase != HB_SHAPE_DONT_STOP) {
    // Do we need to start stopping?
    char buf[12];
    snprintf (buf, 12, "%u ", user_data->stop_at);
    if ((user_data->current_phase == user_data->stop_phase) &&
        (strncmp(message, "end lookup ", 11) == 0) &&
        (strncmp(message + 11, buf, strlen(buf)) == 0)) {
      user_data->stopping = true;
    }
  }

  // If we need to stop, stop.
  if (user_data->stopping) return 0;

  _user_data_printf (user_data, "{\"m\":\"%s\",\"t\":", message);
  hb_buffer_serialize_glyphs(buffer, 0, num_glyphs,
    user_data->str + user_data->consumed,
    user_data->size - user_data->consumed,
    &consumed,
    font,
    HB_BUFFER_SERIALIZE_FORMAT_JSON,
    HB_BUFFER_SERIALIZE_FLAG_NO_GLYPH_NAMES);
  user_data->consumed += consumed;
  if (hb_buffer_get_content_type(buffer) == HB_BUFFER_CONTENT_TYPE_GLYPHS) {
    _user_data_printf (user_data, ", \"glyphs\": true");
  } else {
    _user_data_printf (user_data, ", \"glyphs\": false");
  }
  _user_data_printf (user_data, "},\n");

  return 1;
}

unsigned
hbjs_shape_with_trace (hb_font_t *font, hb_buffer_t* buf,
                       char* featurestring,
                       unsigned int stop_at, unsigned int stop_phase,
                       char *outbuf, unsigned buf_size) {
  user_data_t user_data(outbuf, buf_size, stop_at, stop_phase);

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
