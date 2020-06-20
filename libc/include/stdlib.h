#ifndef STDLIB_H
#define STDLIB_H

#include <stdio.h>

#ifdef __cplusplus
extern "C" {
#endif

#define NULL ((void*) 0)

typedef __SIZE_TYPE__ size_t;
typedef __UINT8_TYPE__ uint8_t;
typedef __UINT16_TYPE__ uint16_t;
typedef __UINT32_TYPE__ uint32_t;
typedef __UINT64_TYPE__ uint64_t;
typedef __INT8_TYPE__ int8_t;
typedef __INT16_TYPE__ int16_t;
typedef __INT32_TYPE__ int32_t;
typedef __INT64_TYPE__ int64_t;
typedef __INTPTR_TYPE__ intptr_t;
typedef __UINTPTR_TYPE__ uintptr_t;

void* malloc(size_t n);
void free(void* ptr);
void* calloc(size_t n, size_t size);
void* realloc(void* ptr, size_t size);
#define va_list __builtin_va_list
#define va_start __builtin_va_start
#define va_end __builtin_va_end
#define va_arg __builtin_va_arg
#define stderr 0
inline int fprintf(char *str, const char *format, ...);
inline int sprintf(char *str, const char *format, ...);
inline int snprintf(char *str, size_t n, const char *format, ...);
inline int vsnprintf(char *str, size_t n, const char * format, va_list va);
#define vfprintf(format, ...)
#define offsetof __builtin_offsetof

#define ceil __builtin_ceil
#define floor __builtin_floor
#define abs __builtin_abs
#define fabs __builtin_fabs
#define pow __builtin_pow
#define sqrt __builtin_sqrt

#define uint_least8_t uint8_t
#define uint_least16_t uint16_t
#define uint_fast8_t uint8_t
#define uint_fast16_t uint16_t
#define int_fast16_t int16_t

#define DBL_MIN __DBL_MIN__
#define DBL_MAX __DBL_MAX__
typedef __PTRDIFF_TYPE__ ptrdiff_t;
unsigned long strtoul(const char *nptr, char **endptr, int base);
long strtol(const char *nptr, char **endptr, int base);
double strtod(const char *nptr, char **endptr);

#define LLONG_MAX  __LONG_LONG_MAX__
#define LLONG_MIN  (-__LONG_LONG_MAX__-1LL)
#define ULLONG_MAX (__LONG_LONG_MAX__*2ULL+1ULL)

#define SCHAR_MAX __SCHAR_MAX__
#define SHRT_MAX  __SHRT_MAX__
#define INT_MAX   __INT_MAX__
#define LONG_MAX  __LONG_MAX__

#define SCHAR_MIN (-__SCHAR_MAX__-1)
#define SHRT_MIN  (-__SHRT_MAX__ -1)
#define INT_MIN   (-__INT_MAX__  -1)
#define LONG_MIN  (-__LONG_MAX__ -1L)

#define UCHAR_MAX (__SCHAR_MAX__*2  +1)
#define USHRT_MAX (__SHRT_MAX__ *2  +1)
#define UINT_MAX  (__INT_MAX__  *2U +1U)
#define ULONG_MAX (__LONG_MAX__ *2UL+1UL)

#ifdef __CHAR_UNSIGNED__  /* -funsigned-char */
#define CHAR_MIN 0
#define CHAR_MAX UCHAR_MAX
#else
#define CHAR_MIN SCHAR_MIN
#define CHAR_MAX __SCHAR_MAX__
#endif

#ifdef __cplusplus
}
#endif

#endif  /* STDLIB_H */
