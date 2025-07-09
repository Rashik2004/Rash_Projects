# Social Network Simulator - C++ Backend

This directory contains the C++ implementation of the social network graph operations.

## Dependencies

- C++17 compatible compiler
- CMake (version 3.10 or higher)
- nlohmann_json library (for JSON handling)

## Build Instructions

### Installing Dependencies

#### macOS (using Homebrew)

```bash
brew install cmake
brew install nlohmann-json
```

#### Ubuntu/Debian

```bash
sudo apt-get update
sudo apt-get install cmake
sudo apt-get install nlohmann-json3-dev
```

### Building the Project

1. Create a build directory:

```bash
mkdir build
cd build
```

2. Configure with CMake:

```bash
cmake ..
```

3. Build the project:

```bash
make
```

4. The executable will be created as `social_network`

## Usage

Run the executable with one of the following commands:

```bash
./social_network load <filename>             # Load a network from file
./social_network save <filename>             # Save the current network to file
./social_network add-user <userid>           # Add a new user to the network
./social_network connect <user1id> <user2id> # Connect two users
./social_network check-connection <user1id> <user2id> # Check if users are connected
./social_network mutual-friends <user1id> <user2id>  # Find mutual friends
./social_network suggest-friends <userid>    # Suggest friends for a user
./social_network find-communities            # Find all communities in the network
```

## Implementation Details

The backend uses graph theory algorithms to model and analyze the social network:

- BFS (Breadth-First Search) for finding connections between users
- Set operations for finding mutual friends and suggesting new connections
- Union-Find (Disjoint Set Union) algorithm for identifying communities
