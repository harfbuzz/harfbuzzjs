#ifndef STRING_H
#define STRING_H

#ifdef __cplusplus
extern "C" {
#endif

typedef __SIZE_TYPE__ size_t;

size_t strlen(const char *s);
void *memset(void *buf, int c, size_t n);
void *memcpy(void *__restrict d, const void *__restrict s, size_t n);
void *memmove(void *d, const void *s, size_t n);
int strncmp(const char *s1, const char *s2, size_t n);
int strcmp(const char *s1, const char *s2);
int memcmp(const void *m1, const void *m2, size_t n);
char *strchr(const char *s, int c);
char *strncpy(char *__restrict d, const char *__restrict s, size_t n);
char *strstr(const char *s, const char *find);

#ifdef __cplusplus
}
#endif

#endif  /* STRING_H */
