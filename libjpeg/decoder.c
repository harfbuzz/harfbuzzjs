// This is based on tjpgd1d/doc/en/appnote.html

#include <stdlib.h>
#include <stdint.h>
#include <string.h>
#include <stdio.h>
#include "jpeglib.h"

uint8_t *decode(uint8_t *buf, unsigned buf_size, unsigned *width, unsigned *height) {
    struct jpeg_decompress_struct cinfo;
    JSAMPARRAY buffer;  /* Output row buffer */
    int row_stride;     /* physical row width in output buffer */
    struct jpeg_error_mgr jerr;
    jpeg_create_decompress(&cinfo);
    jpeg_mem_src(&cinfo, buf, buf_size);
    cinfo.err = jpeg_std_error(&jerr);
    jpeg_read_header(&cinfo, TRUE);
    jpeg_start_decompress(&cinfo);
    *width = cinfo.output_width;
    *height = cinfo.output_height;
    row_stride = cinfo.output_width * cinfo.output_components;
    buffer = (*cinfo.mem->alloc_sarray) ((j_common_ptr) &cinfo, JPOOL_IMAGE, row_stride, 1);
    uint8_t *result = (uint8_t *) malloc(cinfo.output_height * row_stride);
    while (cinfo.output_scanline < cinfo.output_height) {
        unsigned char *buffer_array[1];
        buffer_array[0] = result + (cinfo.output_scanline) * row_stride;
        jpeg_read_scanlines(&cinfo, buffer_array, 1);
    }
    jpeg_finish_decompress(&cinfo);
    jpeg_destroy_decompress(&cinfo);
    return result;
}

#ifdef MAIN
// clang decoder.c -I tjpgd1d/src tjpgd1d/src/tjpgd.c -DMAIN && ./a.out
#include <stdio.h>
int main() {
    FILE *f = fopen("jpeg-9c/testprog.jpg", "rb");
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
