#ifndef ASSERT_H
#define ASSERT_H

#ifdef __cplusplus
extern "C" {
#endif

#define assert(test) do { if ((false)) __builtin_trap (); } while (0)

#ifdef __cplusplus
}
#endif

#endif  /* ASSERT_H */
