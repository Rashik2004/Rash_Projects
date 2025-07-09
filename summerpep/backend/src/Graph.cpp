#include "../include/Graph.h"
#include <algorithm>
#include <set>

bool Graph::addUser(const std::string& userId) {
    // Only add if user doesn't already exist
    if (adjacencyList.find(userId) == adjacencyList.end()) {
        adjacencyList[userId] = std::vector<std::string>();
        return true;
    }
    return false; // User already exists
}

bool Graph::createConnection(const std::string& user1Id, const std::string& user2Id) {
    // Don't allow self-connections
    if (user1Id == user2Id) return false;

    // Check if users exist
    if (adjacencyList.find(user1Id) == adjacencyList.end() || 
        adjacencyList.find(user2Id) == adjacencyList.end()) {
        return false;
    }

    // Check if connection already exists
    if (connectionExists(user1Id, user2Id)) return false;

    // Create the bidirectional connection
    adjacencyList[user1Id].push_back(user2Id);
    adjacencyList[user2Id].push_back(user1Id);
    
    return true;
}

bool Graph::connectionExists(const std::string& user1Id, const std::string& user2Id) {
    // Check if users exist
    if (adjacencyList.find(user1Id) == adjacencyList.end() || 
        adjacencyList.find(user2Id) == adjacencyList.end()) {
        return false;
    }

    // Check if user2Id is in user1Id's connections
    return std::find(adjacencyList[user1Id].begin(), adjacencyList[user1Id].end(), user2Id) 
           != adjacencyList[user1Id].end();
}

std::vector<std::string> Graph::getUserConnections(const std::string& userId) {
    // Check if user exists
    if (adjacencyList.find(userId) == adjacencyList.end()) {
        return std::vector<std::string>();
    }

    return adjacencyList[userId];
}

bool Graph::areConnected(const std::string& user1Id, const std::string& user2Id) {
    // Check if users exist
    if (adjacencyList.find(user1Id) == adjacencyList.end() || 
        adjacencyList.find(user2Id) == adjacencyList.end()) {
        return false;
    }

    // If they're directly connected, return true
    if (connectionExists(user1Id, user2Id)) return true;

    // Otherwise, perform BFS to find a path
    std::unordered_set<std::string> visited;
    std::queue<std::string> queue;
    
    queue.push(user1Id);
    
    while (!queue.empty()) {
        std::string currentUserId = queue.front();
        queue.pop();
        
        if (currentUserId == user2Id) return true;
        
        if (visited.find(currentUserId) == visited.end()) {
            visited.insert(currentUserId);
            
            // Add all neighbors to the queue
            for (const auto& neighbor : adjacencyList[currentUserId]) {
                if (visited.find(neighbor) == visited.end()) {
                    queue.push(neighbor);
                }
            }
        }
    }
    
    return false;
}

std::vector<std::string> Graph::getMutualFriends(const std::string& user1Id, const std::string& user2Id) {
    std::vector<std::string> mutualFriends;
    
    // Check if users exist
    if (adjacencyList.find(user1Id) == adjacencyList.end() || 
        adjacencyList.find(user2Id) == adjacencyList.end()) {
        return mutualFriends;
    }
    
    std::unordered_set<std::string> user1Connections(
        adjacencyList[user1Id].begin(), adjacencyList[user1Id].end()
    );
    
    // Find connections of user2 that are also connections of user1
    for (const auto& connection : adjacencyList[user2Id]) {
        if (user1Connections.find(connection) != user1Connections.end()) {
            mutualFriends.push_back(connection);
        }
    }
    
    return mutualFriends;
}

std::vector<std::string> Graph::suggestFriends(const std::string& userId) {
    std::vector<std::string> suggestions;
    
    // Check if user exists
    if (adjacencyList.find(userId) == adjacencyList.end()) {
        return suggestions;
    }
    
    std::unordered_set<std::string> directConnections(
        adjacencyList[userId].begin(), adjacencyList[userId].end()
    );
    std::unordered_set<std::string> potentialFriends;
    
    // For each direct connection, find their connections
    for (const auto& friendId : directConnections) {
        for (const auto& potentialFriendId : adjacencyList[friendId]) {
            // Only suggest if not already connected and not the user themselves
            if (directConnections.find(potentialFriendId) == directConnections.end() && 
                potentialFriendId != userId) {
                potentialFriends.insert(potentialFriendId);
            }
        }
    }
    
    suggestions.assign(potentialFriends.begin(), potentialFriends.end());
    return suggestions;
}

std::string Graph::find(std::unordered_map<std::string, std::string>& parent, const std::string& userId) {
    if (parent[userId] != userId) {
        parent[userId] = find(parent, parent[userId]); // Path compression
    }
    return parent[userId];
}

std::vector<std::vector<std::string>> Graph::findCommunities() {
    std::vector<std::vector<std::string>> communities;
    
    // Initialize parent map (each user is its own parent initially)
    std::unordered_map<std::string, std::string> parent;
    for (const auto& userEntry : adjacencyList) {
        parent[userEntry.first] = userEntry.first;
    }
    
    // Process all connections to form communities
    for (const auto& userEntry : adjacencyList) {
        const std::string& user1Id = userEntry.first;
        
        for (const auto& user2Id : userEntry.second) {
            std::string root1 = find(parent, user1Id);
            std::string root2 = find(parent, user2Id);
            
            if (root1 != root2) {
                parent[root2] = root1;
            }
        }
    }
    
    // Group users by their community (root parent)
    std::unordered_map<std::string, std::vector<std::string>> communityMap;
    for (const auto& userEntry : adjacencyList) {
        std::string root = find(parent, userEntry.first);
        communityMap[root].push_back(userEntry.first);
    }
    
    // Convert map to vector of communities
    for (const auto& communityEntry : communityMap) {
        communities.push_back(communityEntry.second);
    }
    
    return communities;
}

std::vector<std::pair<std::string, std::string>> Graph::getAllConnections() const {
    std::vector<std::pair<std::string, std::string>> connections;
    std::set<std::pair<std::string, std::string>> seenConnections;
    
    for (const auto& userEntry : adjacencyList) {
        const std::string& user1Id = userEntry.first;
        
        for (const auto& user2Id : userEntry.second) {
            // Create a normalized pair (smaller string first) to avoid duplicates
            std::pair<std::string, std::string> connection = 
                (user1Id < user2Id) ? std::make_pair(user1Id, user2Id) : std::make_pair(user2Id, user1Id);
            
            if (seenConnections.find(connection) == seenConnections.end()) {
                seenConnections.insert(connection);
                connections.push_back(connection);
            }
        }
    }
    
    return connections;
}
