#!/bin/bash
set -e

em++ \
	-std=c++11 \
	-fno-exceptions \
	-fno-rtti \
	-fno-threadsafe-statics \
	-fvisibility-inlines-hidden \
	-flto \
	-Oz \
	-I. \
	-DHB_TINY \
	-DHB_USE_INTERNAL_QSORT \
	-DHAVE_CONFIG_OVERRIDE_H \
	-DHB_EXPERIMENTAL_API \
	--no-entry \
	-s EXPORTED_FUNCTIONS=@subset.symbols \
	-s INITIAL_MEMORY=65MB \
	-o hb-subset.wasm \
	../harfbuzz/src/harfbuzz.cc \
	../harfbuzz/src/hb-subset*.cc
