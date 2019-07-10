typedef __SIZE_TYPE__ size_t;
#define NULL ((void*) 0)

// Source: https://github.com/intel/zephyr/blob/master/lib/libc/minimal/source/string/string.c
// but modified for size optimization
/* string.c - common string routines */
/*
 * Copyright (c) 2014 Wind River Systems, Inc.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 *
 * @brief Copy part of a string
 *
 * @return pointer to destination buffer <d>
 */
char *strncpy(char *__restrict d, const char *__restrict s, size_t n)
{
	char *dest = d;

	while ((n > 0) && *s != '\0') {
		*d = *s;
		s++;
		d++;
		n--;
	}

	while (n > 0) {
		*d = '\0';
		d++;
		n--;
	}

	return dest;
}

/**
 *
 * @brief String scanning operation
 *
 * @return pointer to 1st instance of found byte, or NULL if not found
 */

char *strchr(const char *s, int c)
{
	char tmp = (char) c;

	while ((*s != tmp) && (*s != '\0'))
		s++;

	return (*s == tmp) ? (char *) s : (char *) NULL;
}

/**
 *
 * @brief Get string length
 *
 * @return number of bytes in string <s>
 */

size_t strlen(const char *s)
{
	size_t n = 0;

	while (*s != '\0') {
		s++;
		n++;
	}

	return n;
}

/**
 *
 * @brief Compare two strings
 *
 * @return negative # if <s1> < <s2>, 0 if <s1> == <s2>, else positive #
 */

int strcmp(const char *s1, const char *s2)
{
	while ((*s1 == *s2) && (*s1 != '\0')) {
		s1++;
		s2++;
	}

	return *s1 - *s2;
}

/**
 *
 * @brief Compare part of two strings
 *
 * @return negative # if <s1> < <s2>, 0 if <s1> == <s2>, else positive #
 */

int strncmp(const char *s1, const char *s2, size_t n)
{
	while ((n > 0) && (*s1 == *s2) && (*s1 != '\0')) {
		s1++;
		s2++;
		n--;
	}

	return (n == 0) ? 0 : (*s1 - *s2);
}

char *strncat(char *__restrict dest, const char *__restrict src,
	      size_t n)
{
	char *orig_dest = dest;
	size_t len = strlen(dest);

	dest += len;
	while ((n-- > 0) && (*src != '\0')) {
		*dest++ = *src++;
	}
	*dest = '\0';

	return orig_dest;
}

/**
 *
 * @brief Compare two memory areas
 *
 * @return negative # if <m1> < <m2>, 0 if <m1> == <m2>, else positive #
 */
int memcmp(const void *m1, const void *m2, size_t n)
{
	const char *c1 = (char *)m1;
	const char *c2 = (char *)m2;

	if (!n)
		return 0;

	while ((--n > 0) && (*c1 == *c2)) {
		c1++;
		c2++;
	}

	return *c1 - *c2;
}

/**
 *
 * @brief Copy bytes in memory with overlapping areas
 *
 * @return pointer to destination buffer <d>
 */

void *memmove(void *d, const void *s, size_t n)
{
	char *dest = (char *)d;
	const char *src  = (char *)s;

	if ((size_t) ((char *)d - (char *)s) < n) {
		/*
		 * The <src> buffer overlaps with the start of the <dest> buffer.
		 * Copy backwards to prevent the premature corruption of <src>.
		 */

		while (n > 0) {
			n--;
			dest[n] = src[n];
		}
	} else {
		/* It is safe to perform a forward-copy */
		while (n > 0) {
			*dest = *src;
			dest++;
			src++;
			n--;
		}
	}

	return d;
}

/**
 *
 * @brief Copy bytes in memory
 *
 * @return pointer to start of destination buffer
 */

void *memcpy(void *__restrict d, const void *__restrict s, size_t n)
{
	/* attempt word-sized copying only if buffers have identical alignment */

	unsigned char *d_byte = (unsigned char *)d;
	const unsigned char *s_byte = (const unsigned char *)s;

	if ((((unsigned long)d ^ (unsigned long)s_byte) & 0x3) == 0) {

		/* do byte-sized copying until word-aligned or finished */

		while (((unsigned long)d_byte) & 0x3) {
			if (n == 0) {
				return d;
			}
			*(d_byte++) = *(s_byte++);
			n--;
		};

		/* do word-sized copying as long as possible */

		unsigned int *d_word = (unsigned int *)d_byte;
		const unsigned int *s_word = (const unsigned int *)s_byte;

		while (n >= sizeof(unsigned int)) {
			*(d_word++) = *(s_word++);
			n -= sizeof(unsigned int);
		}

		d_byte = (unsigned char *)d_word;
		s_byte = (unsigned char *)s_word;
	}

	/* do byte-sized copying until finished */

	while (n > 0) {
		*(d_byte++) = *(s_byte++);
		n--;
	}

	return d;
}

/**
 *
 * @brief Set bytes in memory
 *
 * @return pointer to start of buffer
 */

void *memset(void *buf, int c, size_t n)
{
	/* do byte-sized initialization until word-aligned or finished */

	unsigned char *d_byte = (unsigned char *)buf;
	unsigned char c_byte = (unsigned char)c;

	while (((unsigned long)d_byte) & 0x3) {
		if (n == 0) {
			return buf;
		}
		*(d_byte++) = c_byte;
		n--;
	};

	/* do word-sized initialization as long as possible */

	unsigned int *d_word = (unsigned int *)d_byte;
	unsigned int c_word = (unsigned int)(unsigned char)c;

	c_word |= c_word << 8;
	c_word |= c_word << 16;

	while (n >= sizeof(unsigned int)) {
		*(d_word++) = c_word;
		n -= sizeof(unsigned int);
	}

	/* do byte-sized initialization until finished */

	d_byte = (unsigned char *)d_word;

	while (n > 0) {
		*(d_byte++) = c_byte;
		n--;
	}

	return buf;
}

/**
 *
 * @brief Scan byte in memory
 *
 * @return pointer to start of found byte
 */

void *memchr(const void *s, int c, size_t n)
{
	if (n != 0) {
		const unsigned char *p = (const unsigned char *)s;

		do {
			if (*p++ == c) {
				return ((void *)(p - 1));
			}

		} while (--n != 0);
	}

	return NULL;
}

// Source: https://github.com/intel/zephyr/blob/master/lib/libc/minimal/source/string/strstr.c
/*-
 * Copyright (c) 1990, 1993
 *      The Regents of the University of California.  All rights reserved.
 *
 * This code is derived from software contributed to Berkeley by
 * Chris Torek.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. All advertising materials mentioning features or use of this software
 *    must display the following acknowledgment:
 *      This product includes software developed by the University of
 *      California, Berkeley and its contributors.
 * 4. Neither the name of the University nor the names of its contributors
 *    may be used to endorse or promote products derived from this software
 *    without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE REGENTS AND CONTRIBUTORS ``AS IS'' AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED.  IN NO EVENT SHALL THE REGENTS OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
 * OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
 * LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
 */

/*
 * Find the first occurrence of find in s.
 */
char *strstr(const char *s, const char *find)
{
	char c, sc;
	size_t len;

	c = *find++;
	if (c != 0) {
		len = strlen(find);
		do {
			do {
				sc = *s++;
				if (sc == 0)
				return (char *)NULL;
			} while (sc != c);
		} while (strncmp(s, find, len) != 0);
	s--;
	}
	return (char *)s;
}
