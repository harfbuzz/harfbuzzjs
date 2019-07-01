#ifndef ASSERT_H
#define ASSERT_H

#ifdef __cplusplus
extern "C" {
#endif

extern unsigned int errno;
#define assert(test) errno = !!(test)

#ifdef __cplusplus
}
#endif

#endif  /* ASSERT_H */
