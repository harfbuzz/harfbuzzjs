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
