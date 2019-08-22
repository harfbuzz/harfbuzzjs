// void _start (void) {}
int main(int argc, char **argv) {
	// __builtin_wasm_memory_grow(0, 400); __builtin_wasm_memory_size
}
unsigned int errno = 0;

__attribute__((noreturn)) void abort();

float roundf(float x) { return (int) (x + .5f); }

// FIXME: Needed only in hb-subset builds, to be replaced with something better later
// or, remove the use in hb-cff-interp-dict-common.hh
double pow(double x, double y) {
	double result = x;
	while (--y > 0) result *= x;
	return result;
}

double fabs(double x) { return x > 0 ? x : -x; }

typedef __SIZE_TYPE__ size_t;

void *
bsearch (const void *key, const void *base,
	       size_t nmemb, size_t size,
	       int (*compar)(const void *_key, const void *_item))
{
  int min = 0, max = (int) nmemb - 1;
  while (min <= max)
  {
    int mid = ((unsigned int) min + (unsigned int) max) / 2;
    const void *p = (const void *) (((const char *) base) + (mid * size));
    int c = compar (key, p);
    if (c < 0)
      max = mid - 1;
    else if (c > 0)
      min = mid + 1;
    else
      return (void *) p;
  }
  return 0;
}