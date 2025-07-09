/**
 * Network Class - Manages the social network graph and operations
 */
class Network {
    constructor() {
        this.users = []; // Array of user objects
        this.connections = []; // Array of connection objects
    }

    /**
     * Add a new user to the network
     * @param {string} name - The name of the user
     * @returns {object} - The created user object
     */
    addUser(name) {
        const id = this.generateUserId();
        const user = { id, name };
        this.users.push(user);
        return user;
    }

    /**
     * Generate a unique ID for a new user
     * @returns {string} - A unique ID
     */
    generateUserId() {
        return 'user_' + Date.now() + Math.floor(Math.random() * 1000);
    }

    /**
     * Get a user by their ID
     * @param {string} userId - The user ID to find
     * @returns {object|null} - The user object or null if not found
     */
    getUserById(userId) {
        return this.users.find(user => user.id === userId) || null;
    }

    /**
     * Create a connection between two users
     * @param {string} user1Id - ID of the first user
     * @param {string} user2Id - ID of the second user
     * @returns {object|null} - The created connection or null if invalid
     */
    createConnection(user1Id, user2Id) {
        // Don't allow self-connections
        if (user1Id === user2Id) return null;

        // Check if users exist
        const user1 = this.getUserById(user1Id);
        const user2 = this.getUserById(user2Id);
        if (!user1 || !user2) return null;

        // Check if connection already exists
        if (this.connectionExists(user1Id, user2Id)) return null;

        // Create the connection
        const connection = {
            id: `conn_${Date.now()}`,
            user1Id,
            user2Id
        };
        this.connections.push(connection);
        return connection;
    }

    /**
     * Check if a connection exists between two users
     * @param {string} user1Id - ID of the first user
     * @param {string} user2Id - ID of the second user
     * @returns {boolean} - True if connection exists
     */
    connectionExists(user1Id, user2Id) {
        return this.connections.some(conn => 
            (conn.user1Id === user1Id && conn.user2Id === user2Id) || 
            (conn.user1Id === user2Id && conn.user2Id === user1Id)
        );
    }

    /**
     * Get all connections for a specific user
     * @param {string} userId - The user ID to find connections for
     * @returns {array} - Array of user IDs that are connected to the specified user
     */
    getUserConnections(userId) {
        const connectedUserIds = [];
        this.connections.forEach(conn => {
            if (conn.user1Id === userId) {
                connectedUserIds.push(conn.user2Id);
            } else if (conn.user2Id === userId) {
                connectedUserIds.push(conn.user1Id);
            }
        });
        return connectedUserIds;
    }

    /**
     * Check if two users are directly connected
     * @param {string} user1Id - ID of the first user
     * @param {string} user2Id - ID of the second user
     * @returns {boolean} - True if users are directly connected
     */
    areDirectlyConnected(user1Id, user2Id) {
        return this.connectionExists(user1Id, user2Id);
    }

    /**
     * Check if two users are indirectly connected through other users
     * @param {string} user1Id - ID of the first user
     * @param {string} user2Id - ID of the second user
     * @returns {boolean} - True if users are connected directly or indirectly
     */
    areConnected(user1Id, user2Id) {
        // If they're directly connected, return true
        if (this.areDirectlyConnected(user1Id, user2Id)) return true;

        // Otherwise, perform BFS to find a path
        const visited = new Set();
        const queue = [user1Id];
        
        while (queue.length > 0) {
            const currentUserId = queue.shift();
            
            if (currentUserId === user2Id) return true;
            
            if (!visited.has(currentUserId)) {
                visited.add(currentUserId);
                
                // Add all neighbors to the queue
                const neighbors = this.getUserConnections(currentUserId);
                for (const neighbor of neighbors) {
                    if (!visited.has(neighbor)) {
                        queue.push(neighbor);
                    }
                }
            }
        }
        
        return false;
    }

    /**
     * Get mutual friends between two users
     * @param {string} user1Id - ID of the first user
     * @param {string} user2Id - ID of the second user
     * @returns {array} - Array of user objects that are mutual connections
     */
    getMutualFriends(user1Id, user2Id) {
        const user1Connections = this.getUserConnections(user1Id);
        const user2Connections = this.getUserConnections(user2Id);
        
        const mutualIds = user1Connections.filter(id => user2Connections.includes(id));
        return mutualIds.map(id => this.getUserById(id));
    }

    /**
     * Suggest potential friends for a user (2nd-degree connections)
     * @param {string} userId - The user ID to suggest friends for
     * @returns {array} - Array of user objects that are potential connections
     */
    suggestFriends(userId) {
        const directConnections = new Set(this.getUserConnections(userId));
        const suggestions = new Set();
        
        // For each direct connection, find their connections
        for (const friendId of directConnections) {
            const friendConnections = this.getUserConnections(friendId);
            
            for (const potentialFriendId of friendConnections) {
                // Only suggest if not already connected and not the user themselves
                if (!directConnections.has(potentialFriendId) && potentialFriendId !== userId) {
                    suggestions.add(potentialFriendId);
                }
            }
        }
        
        return Array.from(suggestions).map(id => this.getUserById(id));
    }

    /**
     * Find all communities in the network using Union-Find algorithm
     * @returns {array} - Array of communities, each being an array of user objects
     */
    findCommunities() {
        // Initialize parent array (each user is its own parent initially)
        const parent = {};
        this.users.forEach(user => {
            parent[user.id] = user.id;
        });

        // Find function for Union-Find
        const find = (userId) => {
            if (parent[userId] !== userId) {
                parent[userId] = find(parent[userId]); // Path compression
            }
            return parent[userId];
        };

        // Union function
        const union = (user1Id, user2Id) => {
            const root1 = find(user1Id);
            const root2 = find(user2Id);
            if (root1 !== root2) {
                parent[root2] = root1;
            }
        };

        // Process all connections to form communities
        this.connections.forEach(conn => {
            union(conn.user1Id, conn.user2Id);
        });

        // Group users by their community (root parent)
        const communities = {};
        this.users.forEach(user => {
            const root = find(user.id);
            if (!communities[root]) {
                communities[root] = [];
            }
            communities[root].push(user);
        });

        return Object.values(communities);
    }

    /**
     * Export the network data as a JSON string
     * @returns {string} - JSON string representation of the network
     */
    exportNetwork() {
        return JSON.stringify({
            users: this.users,
            connections: this.connections
        });
    }

    /**
     * Import network data from a JSON string
     * @param {string} jsonData - JSON string representation of the network
     * @returns {boolean} - True if import was successful
     */
    importNetwork(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (data.users && data.connections) {
                this.users = data.users;
                this.connections = data.connections;
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error importing network data:', error);
            return false;
        }
    }
}
