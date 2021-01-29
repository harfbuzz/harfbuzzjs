// This is based on tjpgd1d/doc/en/appnote.html

#include <stdlib.h>
#include <stdint.h>
#include <string.h>
#include "tjpgd.h"

typedef struct {
    uint8_t *buf;
    unsigned buf_size;
    unsigned buf_index;
    uint8_t *fbuf;
    unsigned wfbuf;     /* Width of the frame buffer [pix] */
} IODEV;

unsigned int in_func(JDEC *jd, uint8_t *buff, unsigned nbyte) {
    IODEV *dev = (IODEV *) jd->device;
    // TODO: Don't let it read outside buf's memory
    if (buff) memcpy(buff, dev->buf + dev->buf_index, nbyte);
    dev->buf_index += nbyte;
    return nbyte;
}

int out_func(JDEC *jd, void *bitmap, JRECT *rect) {
    IODEV *dev = (IODEV *) jd->device;
    uint8_t *src, *dst;
    uint16_t y, bws, bwd;
    src = (uint8_t *) bitmap;
    dst = dev->fbuf + 3 * (rect->top * dev->wfbuf + rect->left);
    bws = 3 * (rect->right - rect->left + 1);
    bwd = 3 * dev->wfbuf;
    for (y = rect->top; y <= rect->bottom; y++) {
        memcpy(dst, src, bws);
        src += bws; dst += bwd;
    }
    return 1;
}

uint8_t *decode(uint8_t *buf, unsigned buf_size, unsigned *width, unsigned *height) {
    *width = 0; *height = 0;
    JDEC jdec;
    void *work = (void*) malloc(3100); /* Pointer to the work area */
    IODEV devid;
    devid.buf = buf;
    devid.buf_size = buf_size;
    devid.buf_index = 0;
    if (jd_prepare(&jdec, in_func, work, 3100, &devid) != JDR_OK) goto fail;
    devid.fbuf = (uint8_t *) malloc(3 * jdec.width * jdec.height);
    devid.wfbuf = jdec.width;
    if (jd_decomp(&jdec, out_func, 0) != JDR_OK) goto free_and_fail;
    free(work);
    *width = jdec.width; *height = jdec.height;
    return devid.fbuf;

free_and_fail:
    free(devid.fbuf);
fail:
    free(work);
    return NULL;
}

#ifdef MAIN
// clang decoder.c -I tjpgd1d/src tjpgd1d/src/tjpgd.c -DMAIN && ./a.out
#include <stdio.h>
int main() {
    FILE *f = fopen("tjpgd1d/doc/jpeg.jpeg", "rb");
    fseek(f, 0, SEEK_END);
    unsigned len = ftell(f);
    rewind(f);
    uint8_t *buf = (uint8_t *) malloc(len);
    len = fread(buf, 1, len, f);
    unsigned width, height;
    uint8_t *res = decode(buf, len, &width, &height);
    printf("%d\n", len);
    printf("%p\n", res);
    printf("w: %d, h: %d\n", width, height);
    free(res);
    return 0;
}
#endif
