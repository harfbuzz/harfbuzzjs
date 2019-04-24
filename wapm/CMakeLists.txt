cmake_minimum_required(VERSION 3.4)
project(harfbuzzjs)

add_definitions("-DHB_EXTERN=__attribute__((used))")

add_subdirectory(harfbuzz)

# Trick emscripten to create js/wasm from a library
add_executable(harfbuzzjs /dev/null)

target_link_libraries(harfbuzzjs harfbuzz)
