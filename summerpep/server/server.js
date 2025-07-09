// Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const { generateToken, authenticateToken, sessionCleanup } = require('./middleware/auth');
const { UserDatabase } = require('./models/User');

const userDB = new UserDatabase();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Path to the C++ executable
const BACKEND_EXECUTABLE = path.join(__dirname, '../backend/build/social_network');

// In-memory storage for current network state
let currentNetworkFile = path.join(__dirname, 'current_network.json');

// Helper function to execute C++ backend commands
function executeBackendCommand(command, callback) {
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return callback({ success: false, error: error.message });
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
            return callback({ success: false, error: stderr });
        }
        callback({ success: true, output: stdout.trim() });
    });
}

// Authentication Routes
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const user = await userDB.createUser(username, email, password);
        const token = generateToken(user.userId);
        const cleanUser = { ...user };
        delete cleanUser.password;
        res.status(201).json({ success: true, token, user: cleanUser });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userDB.findUserByEmail(email);
        if (!user || !await user.verifyPassword(password)) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
        const token = generateToken(user.userId);
        user.updateLastLogin();
        await userDB.updateUser(user.userId, { lastLogin: user.lastLogin });
        const cleanUser = { ...user };
        delete cleanUser.password;
        res.json({ success: true, token, user: cleanUser });
    } catch (error) {
        res.status(400).json({ success: false, error: 'Login failed' });
    }
});

app.get('/api/profile', authenticateToken, (req, res) => {
    const cleanUser = { ...req.user };
    delete cleanUser.password;
    res.json({ success: true, user: cleanUser });
});

// Get user's network data
app.get('/api/network-data', authenticateToken, (req, res) => {
    res.json({ success: true, networkData: req.user.networkData || { users: [], connections: [] } });
});

// Logout endpoint (client-side token removal)
app.post('/api/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out successfully' });
});

// API Routes
app.use(sessionCleanup);

// Add a user
app.post('/api/add-user', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ success: false, error: 'User ID is required' });
        }
        
        // Get user's current network data
        const currentUser = req.user;
        const networkData = currentUser.networkData || { users: [], connections: [] };
        
        // Check if user already exists in network
        const existingUser = networkData.users.find(u => u.id === userId || u.name === userId);
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'User already exists in network' });
        }
        
        // Add user to network data
        const newUser = {
            id: 'user_' + Date.now() + Math.floor(Math.random() * 1000),
            name: userId
        };
        networkData.users.push(newUser);
        
        // Update user's network data in database
        await userDB.updateUserNetworkData(currentUser.userId, networkData);
        
        res.json({ success: true, user: newUser });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Connect two users
app.post('/api/connect-users', authenticateToken, async (req, res) => {
    try {
        const { user1Id, user2Id } = req.body;
        if (!user1Id || !user2Id) {
            return res.status(400).json({ success: false, error: 'Both user IDs are required' });
        }
        
        // Get user's current network data
        const currentUser = req.user;
        const networkData = currentUser.networkData || { users: [], connections: [] };
        
        // Check if both users exist in network
        const user1 = networkData.users.find(u => u.id === user1Id);
        const user2 = networkData.users.find(u => u.id === user2Id);
        
        if (!user1 || !user2) {
            return res.status(400).json({ success: false, error: 'One or both users not found in network' });
        }
        
        // Check if connection already exists
        const existingConnection = networkData.connections.find(c => 
            (c.user1Id === user1Id && c.user2Id === user2Id) || 
            (c.user1Id === user2Id && c.user2Id === user1Id)
        );
        
        if (existingConnection) {
            return res.status(400).json({ success: false, error: 'Connection already exists' });
        }
        
        // Add connection to network data
        const newConnection = {
            id: 'conn_' + Date.now(),
            user1Id,
            user2Id
        };
        networkData.connections.push(newConnection);
        
        // Update user's network data in database
        await userDB.updateUserNetworkData(currentUser.userId, networkData);
        
        res.json({ success: true, connection: newConnection });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Check if users are connected
app.post('/api/check-connection', (req, res) => {
    const { user1Id, user2Id } = req.body;
    if (!user1Id || !user2Id) {
        return res.status(400).json({ success: false, error: 'Both user IDs are required' });
    }
    
    // First load the network, then check connection
    const loadCommand = `"${BACKEND_EXECUTABLE}" load "${currentNetworkFile}"`;
    executeBackendCommand(loadCommand, (loadResult) => {
        if (loadResult.success) {
            const checkCommand = `"${BACKEND_EXECUTABLE}" check-connection "${user1Id}" "${user2Id}"`;
            executeBackendCommand(checkCommand, (result) => {
                res.json(result);
            });
        } else {
            // If no network file exists, just check directly
            const checkCommand = `"${BACKEND_EXECUTABLE}" check-connection "${user1Id}" "${user2Id}"`;
            executeBackendCommand(checkCommand, (result) => {
                res.json(result);
            });
        }
    });
});

// Get mutual friends
app.post('/api/mutual-friends', (req, res) => {
    const { user1Id, user2Id } = req.body;
    if (!user1Id || !user2Id) {
        return res.status(400).json({ success: false, error: 'Both user IDs are required' });
    }
    
    const command = `"${BACKEND_EXECUTABLE}" mutual-friends "${user1Id}" "${user2Id}"`;
    executeBackendCommand(command, (result) => {
        res.json(result);
    });
});

// Suggest friends
app.post('/api/suggest-friends', (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID is required' });
    }
    
    const command = `"${BACKEND_EXECUTABLE}" suggest-friends "${userId}"`;
    executeBackendCommand(command, (result) => {
        res.json(result);
    });
});

// Find communities
app.get('/api/find-communities', (req, res) => {
    const command = `"${BACKEND_EXECUTABLE}" find-communities`;
    executeBackendCommand(command, (result) => {
        res.json(result);
    });
});

// Save network
app.post('/api/save-network', (req, res) => {
    const command = `"${BACKEND_EXECUTABLE}" save "${currentNetworkFile}"`;
    executeBackendCommand(command, (result) => {
        res.json(result);
    });
});

// Load network
app.post('/api/load-network', (req, res) => {
    const command = `"${BACKEND_EXECUTABLE}" load "${currentNetworkFile}"`;
    executeBackendCommand(command, (result) => {
        res.json(result);
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Server is running',
        backendPath: BACKEND_EXECUTABLE 
    });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Backend executable: ${BACKEND_EXECUTABLE}`);
});
