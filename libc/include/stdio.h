#ifndef STDIO_H
#define STDIO_H

#ifdef __cplusplus
extern "C" {
#endif

extern unsigned int errno;
#define assert(test) errno = !!(test)

#ifdef __cplusplus
}
#endif

#endif  /* STDIO_H */
