// void _start (void) {}
int main(int argc, char **argv) {
	// __builtin_wasm_memory_grow(0, 400); __builtin_wasm_memory_size
}
unsigned int errno = 0;

__attribute__((noreturn)) void abort();

float roundf(float x) { return (int) (x >= 0.f ? x + .5f : x + -.5f); }

double fabs(double x) { return x > 0 ? x : -x; }
