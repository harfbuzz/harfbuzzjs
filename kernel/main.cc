#include "../harfbuzz/src/harfbuzz.cc"

unsigned long strtoul(const char *nptr, char **endptr, int base) { return 0; }
long strtol(const char *nptr, char **endptr, int base) { return 0; }
int abs(int a) { return (a > int(0)) ? a : -a; }
inline int snprintf(char *str, size_t n, const char *format, ...) { return 0; }

/* Sure are super accurate! */
double floor(double x) { return (int) x; }
double ceil(double x) { return (double) (int) x < x ? x + 1 : x; }

// Integrate with kmalloc instead
char heap[4096 * 16];
typedef __UINTPTR_TYPE__ uintptr_t;
uintptr_t bump_pointer = (uintptr_t) heap;

static void *sbrk(unsigned int inc) {
	uintptr_t addr = bump_pointer;
	bump_pointer += inc;
	return (void *) addr;
}

typedef __SIZE_TYPE__ size_t;
void *malloc(size_t size) { return sbrk(((size - 1) | 3) + 1); }
void *calloc(size_t nmemb, size_t size) { return malloc(nmemb * size); }
void *realloc(void* ptr, size_t size) {
	void *addr = malloc(size);
	__builtin_memcpy(addr, ptr, size); // roughly
	return addr;
}
void free(void* ptr) { /* lol */ }