cmake_minimum_required(VERSION 3.4)
project(harfbuzzjs)

# we won't need multithread support in harfbuzzjs
#add_definitions(-DHB_NO_MT)

add_definitions(-DHB_TINY)

set (CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++11 -s MODULARIZE=1 \
  -s NO_FILESYSTEM=1 -s ALLOW_MEMORY_GROWTH=1 -s NO_EXIT_RUNTIME=1 -s STRICT=1 \
  -Oz --closure 1 --llvm-lto 1")

# add_definitions("-DHB_EXTERN=__attribute__((used))")
# Alternatively, only the needed calls
set (CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -s \"EXPORTED_FUNCTIONS=['_hb_version_string', \
  '_malloc', '_hb_blob_create', '_hb_face_create', '_hb_font_create', \
  '_hb_buffer_create', '_hb_buffer_add_utf8', '_hb_buffer_guess_segment_properties', \
  '_hb_buffer_set_direction', '_hb_shape', '_hb_buffer_serialize_glyphs', \
  '_hb_buffer_get_length', '_hb_buffer_serialize_glyphs', '_hb_buffer_destroy', \
  '_hb_font_destroy', '_hb_face_destroy', '_hb_blob_destroy', '_hb_blob_get_length', \
  '_hb_direction_from_string', '_hb_font_set_scale', '_free']\"")

add_subdirectory(harfbuzz)

# Trick emscripten to create js/wasm from a library
add_executable(harfbuzzjs /dev/null)

target_link_libraries(harfbuzzjs harfbuzz)
