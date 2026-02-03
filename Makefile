MAKEFLAGS += -s

CXX = em++

COMMON_CXXFLAGS = \
	-std=c++11 \
	-fno-exceptions \
	-fno-rtti \
	-fno-threadsafe-statics \
	-fvisibility-inlines-hidden \
	-Oz \
	-I. \
	-DHB_TINY \
	-DHB_USE_INTERNAL_QSORT \
	-DHB_EXPERIMENTAL_API

HB_CXXFLAGS = \
	$(COMMON_CXXFLAGS) \
	-flto \
	-DHB_CONFIG_OVERRIDE_H=\"config-override.h\"

HB_LDFLAGS = \
	--no-entry \
	-s MODULARIZE \
	-s EXPORT_NAME=createHarfBuzz \
	-s EXPORTED_FUNCTIONS=@hb.symbols \
	-s EXPORTED_RUNTIME_METHODS=@em.runtime \
	-s INITIAL_MEMORY=256KB \
	-s ALLOW_MEMORY_GROWTH \
	-s ALLOW_TABLE_GROWTH \
	-lexports.js

HB_ESM_LDFLAGS = \
	-s EXPORT_ES6=1

HB_SRCS = harfbuzz/src/harfbuzz.cc
HB_DEPS = config-override.h hb.symbols em.runtime
HB_TARGET = hb.js
HB_ESM_TARGET = hb.mjs
HBJS_SRCS = hbjs.js
HBJS_ESM_TARGET = hbjs.mjs

HB_SUBSET_CXXFLAGS = \
	$(COMMON_CXXFLAGS) \
	-DHB_CONFIG_OVERRIDE_H=\"config-override-subset.h\"

HB_SUBSET_LDFLAGS = \
	--no-entry \
	-s EXPORTED_FUNCTIONS=@hb-subset.symbols \
	-s INITIAL_MEMORY=65MB

HB_SUBSET_SRCS = harfbuzz/src/harfbuzz-subset.cc
HB_SUBSET_DEPS = config-override-subset.h hb-subset.symbols
HB_SUBSET_TARGET = hb-subset.wasm

.PHONY: all clean hb hb-esm hbjs-esm hb-subset test

all: hb hb-subset hb-esm hbjs-esm

hb: $(HB_TARGET)

hb-esm: ${HB_ESM_TARGET}

hbjs-esm: ${HBJS_ESM_TARGET}

hb-subset: $(HB_SUBSET_TARGET)

test: all
	npx mocha test/index.js

$(HB_TARGET): $(HB_SRCS) $(HB_DEPS)
	echo "  CXX      $@"
	$(CXX) $(HB_CXXFLAGS) $(HB_LDFLAGS) -o $@ $(HB_SRCS)

$(HB_ESM_TARGET): $(HB_SRCS) $(HB_DEPS)
	echo "  CXX      $@"
	$(CXX) $(HB_CXXFLAGS) $(HB_LDFLAGS) ${HB_ESM_LDFLAGS} -o $@ $(HB_SRCS)

$(HBJS_ESM_TARGET): ${HBJS_SRCS}
	echo "  GEN      $@"
	perl -0777 -pe 's/try\s*\{[^}]*module\.exports[^}]*\}\s*catch\s*\(e\)\s*\{\s*\}//g' $< > $@
	echo 'export default hbjs;' >> $@

$(HB_SUBSET_TARGET): $(HB_SUBSET_SRCS) $(HB_SUBSET_DEPS)
	echo "  CXX      $@"
	$(CXX) $(HB_SUBSET_CXXFLAGS) $(HB_SUBSET_LDFLAGS) -o $@ $(HB_SUBSET_SRCS)

clean:
	rm -f $(HB_TARGET) $(HB_SUBSET_TARGET) $(HB_ESM_TARGET) $(HBJS_ESM) hb.wasm
