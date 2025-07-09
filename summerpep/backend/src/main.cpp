#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <nlohmann/json.hpp>
#include "../include/Graph.h"

using json = nlohmann::json;

// Function to read a network from file
bool loadNetwork(const std::string& filename, Graph& graph, json& userData) {
    std::ifstream file(filename);
    if (!file.is_open()) {
        std::cerr << "Failed to open file: " << filename << std::endl;
        return false;
    }

    try {
        json data;
        file >> data;
        
        // Load users and create graph nodes
        for (const auto& user : data["users"]) {
            std::string userId = user["id"];
            graph.addUser(userId);
        }
        
        // Store user data for reference
        userData = data["users"];
        
        // Load connections
        for (const auto& connection : data["connections"]) {
            std::string user1Id = connection["user1Id"];
            std::string user2Id = connection["user2Id"];
            graph.createConnection(user1Id, user2Id);
        }
        
        return true;
    } catch (const std::exception& e) {
        std::cerr << "Error parsing JSON: " << e.what() << std::endl;
        return false;
    }
}

// Function to save a network to file
bool saveNetwork(const std::string& filename, const Graph& graph, const json& userData) {
    // Create JSON object
    json data;
    data["users"] = userData;
    
// Add connections from graph to data
    data["connections"] = json::array();
    auto connections = graph.getAllConnections();
    for (const auto& connection : connections) {
        data["connections"].push_back({{"user1Id", connection.first}, {"user2Id", connection.second}});
    }
    
    // Write to file
    std::ofstream file(filename);
    if (!file.is_open()) {
        std::cerr << "Failed to open file for writing: " << filename << std::endl;
        return false;
    }
    
    file << data.dump(4); // Pretty print with 4-space indentation
    return true;
}

int main(int argc, char* argv[]) {
    if (argc < 2) {
        std::cout << "Usage: " << argv[0] << " <command> [options]" << std::endl;
        std::cout << "Commands:" << std::endl;
        std::cout << "  load <filename> - Load a network from file" << std::endl;
        std::cout << "  save <filename> - Save the current network to file" << std::endl;
        std::cout << "  add-user <userid> - Add a new user to the network" << std::endl;
        std::cout << "  connect <user1id> <user2id> - Connect two users" << std::endl;
        std::cout << "  check-connection <user1id> <user2id> - Check if users are connected" << std::endl;
        std::cout << "  mutual-friends <user1id> <user2id> - Find mutual friends" << std::endl;
        std::cout << "  suggest-friends <userid> - Suggest friends for a user" << std::endl;
        std::cout << "  find-communities - Find all communities in the network" << std::endl;
        return 1;
    }

    // Create a graph
    Graph graph;
    json userData = json::array();
    
    std::string command = argv[1];
    
    if (command == "load" && argc >= 3) {
        if (loadNetwork(argv[2], graph, userData)) {
            std::cout << "Network loaded successfully." << std::endl;
        } else {
            std::cout << "Failed to load network." << std::endl;
            return 1;
        }
    } else if (command == "save" && argc >= 3) {
        if (saveNetwork(argv[2], graph, userData)) {
            std::cout << "Network saved successfully." << std::endl;
        } else {
            std::cout << "Failed to save network." << std::endl;
            return 1;
        }
    } else if (command == "add-user" && argc >= 3) {
        std::string userId = argv[2];
        
        if (graph.addUser(userId)) {
            // Add to user data for persistence
            json user;
            user["id"] = userId;
            user["name"] = userId; // Use ID as name for simplicity
            userData.push_back(user);
            
            std::cout << "User added: " << userId << std::endl;
        } else {
            std::cout << "User already exists: " << userId << std::endl;
        }
    } else if (command == "connect" && argc >= 4) {
        std::string user1Id = argv[2];
        std::string user2Id = argv[3];
        
        if (graph.createConnection(user1Id, user2Id)) {
            std::cout << "Connection created between " << user1Id << " and " << user2Id << std::endl;
        } else {
            std::cout << "Failed to create connection." << std::endl;
        }
    } else if (command == "check-connection" && argc >= 4) {
        std::string user1Id = argv[2];
        std::string user2Id = argv[3];
        
        if (graph.areConnected(user1Id, user2Id)) {
            std::cout << "Users are connected." << std::endl;
        } else {
            std::cout << "Users are not connected." << std::endl;
        }
    } else if (command == "mutual-friends" && argc >= 4) {
        std::string user1Id = argv[2];
        std::string user2Id = argv[3];
        
        std::vector<std::string> mutualFriends = graph.getMutualFriends(user1Id, user2Id);
        
        if (mutualFriends.empty()) {
            std::cout << "No mutual friends found." << std::endl;
        } else {
            std::cout << "Mutual friends: ";
            for (const auto& friendId : mutualFriends) {
                std::cout << friendId << " ";
            }
            std::cout << std::endl;
        }
    } else if (command == "suggest-friends" && argc >= 3) {
        std::string userId = argv[2];
        
        std::vector<std::string> suggestions = graph.suggestFriends(userId);
        
        if (suggestions.empty()) {
            std::cout << "No friend suggestions found." << std::endl;
        } else {
            std::cout << "Friend suggestions: ";
            for (const auto& friendId : suggestions) {
                std::cout << friendId << " ";
            }
            std::cout << std::endl;
        }
    } else if (command == "find-communities") {
        std::vector<std::vector<std::string>> communities = graph.findCommunities();
        
        if (communities.empty()) {
            std::cout << "No communities found." << std::endl;
        } else {
            std::cout << "Communities found: " << communities.size() << std::endl;
            for (size_t i = 0; i < communities.size(); ++i) {
                std::cout << "Community " << (i + 1) << ": ";
                for (const auto& userId : communities[i]) {
                    std::cout << userId << " ";
                }
                std::cout << std::endl;
            }
        }
    } else {
        std::cout << "Unknown command or insufficient arguments." << std::endl;
        return 1;
    }
    
    return 0;
}
