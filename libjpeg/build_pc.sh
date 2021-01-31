#!/bin/sh
# This was used just for testing

clang \
    -I . \
    -I jpeg-9c \
    jpeg-9c/cdjpeg.c \
    jpeg-9c/jaricom.c jpeg-9c/jcapimin.c jpeg-9c/jcapistd.c jpeg-9c/jcarith.c \
    jpeg-9c/jccoefct.c jpeg-9c/jccolor.c jpeg-9c/jcdctmgr.c jpeg-9c/jchuff.c \
    jpeg-9c/jcinit.c jpeg-9c/jcmainct.c jpeg-9c/jcmarker.c jpeg-9c/jcmaster.c \
    jpeg-9c/jcomapi.c jpeg-9c/jcparam.c jpeg-9c/jcprepct.c jpeg-9c/jcsample.c \
    jpeg-9c/jctrans.c jpeg-9c/jdapimin.c jpeg-9c/jdapistd.c jpeg-9c/jdarith.c \
    jpeg-9c/jdatadst.c jpeg-9c/jdatasrc.c jpeg-9c/jdcoefct.c jpeg-9c/jdcolor.c \
    jpeg-9c/jddctmgr.c jpeg-9c/jdhuff.c jpeg-9c/jdinput.c jpeg-9c/jdmainct.c \
    jpeg-9c/jdmarker.c jpeg-9c/jdmaster.c jpeg-9c/jdmerge.c jpeg-9c/jdpostct.c \
    jpeg-9c/jdsample.c jpeg-9c/jdtrans.c jpeg-9c/jerror.c jpeg-9c/jfdctflt.c \
    jpeg-9c/jfdctfst.c jpeg-9c/jfdctint.c jpeg-9c/jidctflt.c jpeg-9c/jidctfst.c \
    jpeg-9c/jidctint.c \
    jpeg-9c/jmemmgr.c jpeg-9c/jmemnobs.c \
    jpeg-9c/jquant1.c jpeg-9c/jquant2.c jpeg-9c/jutils.c jpeg-9c/rdbmp.c \
    jpeg-9c/rdcolmap.c jpeg-9c/rdgif.c jpeg-9c/rdppm.c \
    jpeg-9c/rdrle.c jpeg-9c/rdswitch.c jpeg-9c/rdtarga.c jpeg-9c/transupp.c \
    jpeg-9c/wrbmp.c jpeg-9c/wrgif.c jpeg-9c/wrppm.c \
    jpeg-9c/wrrle.c jpeg-9c/wrtarga.c \
    decoder.c -DMAIN -g -Og
./a.out