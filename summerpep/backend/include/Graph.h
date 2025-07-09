#ifndef GRAPH_H
#define GRAPH_H

#include <vector>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <queue>

class Graph {
private:
    // Adjacency list representation of the graph
    std::unordered_map<std::string, std::vector<std::string>> adjacencyList;

public:
    // Add a new user node to the graph
    bool addUser(const std::string& userId);

    // Create a connection (edge) between two users
    bool createConnection(const std::string& user1Id, const std::string& user2Id);

    // Check if a connection exists between two users
    bool connectionExists(const std::string& user1Id, const std::string& user2Id);

    // Get all direct connections for a user
    std::vector<std::string> getUserConnections(const std::string& userId);

    // Check if two users are connected (directly or indirectly)
    bool areConnected(const std::string& user1Id, const std::string& user2Id);

    // Get mutual friends between two users
    std::vector<std::string> getMutualFriends(const std::string& user1Id, const std::string& user2Id);

    // Suggest potential friends for a user (2nd-degree connections)
    std::vector<std::string> suggestFriends(const std::string& userId);

    // Find all communities in the network using Union-Find
    std::vector<std::vector<std::string>> findCommunities();
    
    // Get all connections in the graph
    std::vector<std::pair<std::string, std::string>> getAllConnections() const;

private:
    // Helper function for Union-Find
    std::string find(std::unordered_map<std::string, std::string>& parent, const std::string& userId);
};

#endif // GRAPH_H
