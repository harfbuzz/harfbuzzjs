#include <unistd.h>

/* https://dassur.ma/things/c-to-webassembly/ */
extern unsigned char __heap_base;
typedef __UINTPTR_TYPE__ uintptr_t;
uintptr_t bump_pointer = (uintptr_t) &__heap_base;

void *sbrk(unsigned int inc) {
	uintptr_t addr = bump_pointer;
	bump_pointer += inc;
	return (void *) addr;
}

#ifdef USE_ZERO_FREE_ALLOC
typedef __SIZE_TYPE__ size_t;
extern "C" void *malloc(size_t size) { return sbrk(((size - 1) | 3) + 1); }
extern "C" void *calloc(size_t nmemb, size_t size) { return malloc(nmemb * size); }
extern "C" void *realloc(void* ptr, size_t size) {
	void *addr = malloc(size);
	__builtin_memcpy(addr, ptr, size); // roughly
	return addr;
}
extern "C" void free(void* ptr) { /* lol */ }
#else
#include "emmalloc.cpp"
#endif
