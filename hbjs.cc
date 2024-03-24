#include "harfbuzz/src/harfbuzz.cc"

HB_BEGIN_DECLS

void *free_ptr(void);

HB_END_DECLS


void *free_ptr(void) { return (void *) free; }
