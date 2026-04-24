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

HARFBUZZ_CXXFLAGS = \
	$(COMMON_CXXFLAGS) \
	-flto \
	-DHB_CONFIG_OVERRIDE_H=\"config-override.h\"

HARFBUZZ_LDFLAGS = \
	--no-entry \
	-s MODULARIZE \
	-s EXPORT_ES6 \
	-s EXPORT_NAME=createHarfBuzz \
	-s EXPORTED_FUNCTIONS=@harfbuzz.symbols \
	-s EXPORTED_RUNTIME_METHODS=@em.runtime \
	-s INITIAL_MEMORY=256KB \
	-s ALLOW_MEMORY_GROWTH \
	-s ALLOW_TABLE_GROWTH \
	-lexports.js

HARFBUZZ_SRCS = harfbuzz/src/harfbuzz.cc
HARFBUZZ_DEPS = config-override.h harfbuzz.symbols em.runtime
HARFBUZZ_TARGET = dist/harfbuzz.js

HARFBUZZ_SUBSET_CXXFLAGS = \
	$(COMMON_CXXFLAGS) \
	-DHB_CONFIG_OVERRIDE_LAST_H=\"config-override-subset.h\"

HARFBUZZ_SUBSET_LDFLAGS = \
	--no-entry \
	-s EXPORTED_FUNCTIONS=@harfbuzz-subset.symbols \
	-s INITIAL_MEMORY=65MB

HARFBUZZ_SUBSET_SRCS = harfbuzz/src/harfbuzz-subset.cc
HARFBUZZ_SUBSET_DEPS = config-override-subset.h harfbuzz-subset.symbols
HARFBUZZ_SUBSET_TARGET = dist/harfbuzz-subset.wasm

.PHONY: all clean harfbuzz harfbuzz-subset test typecheck doc

all: harfbuzz harfbuzz-subset node_modules
	npx tsdown

harfbuzz: $(HARFBUZZ_TARGET)

harfbuzz-subset: $(HARFBUZZ_SUBSET_TARGET)

$(HARFBUZZ_TARGET): $(HARFBUZZ_SRCS) $(HARFBUZZ_DEPS) | dist
	echo "  CXX      $@"
	$(CXX) $(HARFBUZZ_CXXFLAGS) $(HARFBUZZ_LDFLAGS) -o $@ $(HARFBUZZ_SRCS)

$(HARFBUZZ_SUBSET_TARGET): $(HARFBUZZ_SUBSET_SRCS) $(HARFBUZZ_SUBSET_DEPS) | dist
	echo "  CXX      $@"
	$(CXX) $(HARFBUZZ_SUBSET_CXXFLAGS) $(HARFBUZZ_SUBSET_LDFLAGS) -o $@ $(HARFBUZZ_SUBSET_SRCS)

dist:
	mkdir -p $@

node_modules: package.json
	npm install --ignore-scripts
	touch $@

typecheck: all
	npx tsc --noEmit

test: all typecheck
	npx vitest run --dir test
	node examples/harfbuzz.example.node.js
	node examples/harfbuzz-subset.example.node.js

doc: node_modules
	npx typedoc src/index.ts --headings.readme false --treatWarningsAsErrors --out docs

clean:
	rm -rf dist
