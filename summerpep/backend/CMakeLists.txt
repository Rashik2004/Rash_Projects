cmake_minimum_required(VERSION 3.10)
project(SocialNetworkSimulator)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Add source files
set(SOURCES
    src/main.cpp
    src/Graph.cpp
)

# Add include directories
include_directories(include)

# Find nlohmann_json package
find_package(nlohmann_json REQUIRED)

# Create executable
add_executable(social_network ${SOURCES})

# Link libraries
target_link_libraries(social_network PRIVATE nlohmann_json::nlohmann_json)

# Install
install(TARGETS social_network DESTINATION bin)
