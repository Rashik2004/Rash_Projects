const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');

class User {
    constructor(username, email, password, userId = null) {
        this.userId = userId || this.generateUserId();
        this.username = username;
        this.email = email;
        this.password = password;
        this.createdAt = new Date().toISOString();
        this.lastLogin = null;
        this.isActive = true;
        this.networkData = {
            users: [],
            connections: [],
            lastModified: new Date().toISOString()
        };
    }

    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async hashPassword() {
        if (this.password) {
            this.password = await bcrypt.hash(this.password, 12);
        }
    }

    async verifyPassword(candidatePassword) {
        return await bcrypt.compare(candidatePassword, this.password);
    }

    toJSON() {
        const userObj = { ...this };
        delete userObj.password; // Don't send password in JSON
        return userObj;
    }

    updateLastLogin() {
        this.lastLogin = new Date().toISOString();
    }

    updateNetworkData(networkData) {
        this.networkData = {
            ...networkData,
            lastModified: new Date().toISOString()
        };
    }
}

class UserDatabase {
    constructor() {
        this.usersDir = path.join(__dirname, '../data/users');
        this.indexFile = path.join(__dirname, '../data/users/index.json');
        this.initializeDatabase();
    }

    async initializeDatabase() {
        try {
            await fs.mkdir(this.usersDir, { recursive: true });
            
            // Create index file if it doesn't exist
            try {
                await fs.access(this.indexFile);
            } catch {
                await fs.writeFile(this.indexFile, JSON.stringify({
                    users: [],
                    emailIndex: {},
                    usernameIndex: {}
                }, null, 2));
            }
        } catch (error) {
            console.error('Error initializing user database:', error);
        }
    }

    async loadIndex() {
        try {
            const indexData = await fs.readFile(this.indexFile, 'utf8');
            return JSON.parse(indexData);
        } catch (error) {
            console.error('Error loading user index:', error);
            return { users: [], emailIndex: {}, usernameIndex: {} };
        }
    }

    async saveIndex(index) {
        try {
            await fs.writeFile(this.indexFile, JSON.stringify(index, null, 2));
        } catch (error) {
            console.error('Error saving user index:', error);
        }
    }

    async createUser(username, email, password) {
        const index = await this.loadIndex();
        
        // Check if user already exists
        if (index.emailIndex[email]) {
            throw new Error('User with this email already exists');
        }
        
        if (index.usernameIndex[username]) {
            throw new Error('User with this username already exists');
        }

        // Create new user
        const user = new User(username, email, password);
        await user.hashPassword();

        // Save user to individual file
        const userFile = path.join(this.usersDir, `${user.userId}.json`);
        await fs.writeFile(userFile, JSON.stringify(user, null, 2));

        // Update index
        index.users.push({
            userId: user.userId,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt,
            isActive: user.isActive
        });
        index.emailIndex[email] = user.userId;
        index.usernameIndex[username] = user.userId;

        await this.saveIndex(index);
        return user;
    }

    async findUserByEmail(email) {
        const index = await this.loadIndex();
        const userId = index.emailIndex[email];
        
        if (!userId) {
            return null;
        }

        return await this.findUserById(userId);
    }

    async findUserByUsername(username) {
        const index = await this.loadIndex();
        const userId = index.usernameIndex[username];
        
        if (!userId) {
            return null;
        }

        return await this.findUserById(userId);
    }

    async findUserById(userId) {
        try {
            const userFile = path.join(this.usersDir, `${userId}.json`);
            const userData = await fs.readFile(userFile, 'utf8');
            const userObj = JSON.parse(userData);
            
            // Recreate User instance with preserved password
            const user = new User(userObj.username, userObj.email, userObj.password, userObj.userId);
            Object.assign(user, userObj);
            
            return user;
        } catch (error) {
            console.error('Error finding user by ID:', error);
            return null;
        }
    }

    async updateUser(userId, updates) {
        const user = await this.findUserById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Apply updates
        Object.assign(user, updates);

        // Save updated user
        const userFile = path.join(this.usersDir, `${userId}.json`);
        await fs.writeFile(userFile, JSON.stringify(user, null, 2));

        return user;
    }

    async updateUserNetworkData(userId, networkData) {
        const user = await this.findUserById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        user.updateNetworkData(networkData);
        
        // Save updated user
        const userFile = path.join(this.usersDir, `${userId}.json`);
        await fs.writeFile(userFile, JSON.stringify(user, null, 2));

        return user;
    }

    async getAllUsers() {
        const index = await this.loadIndex();
        return index.users;
    }

    async deleteUser(userId) {
        const index = await this.loadIndex();
        const user = await this.findUserById(userId);
        
        if (!user) {
            throw new Error('User not found');
        }

        // Remove from index
        index.users = index.users.filter(u => u.userId !== userId);
        delete index.emailIndex[user.email];
        delete index.usernameIndex[user.username];

        // Delete user file
        const userFile = path.join(this.usersDir, `${userId}.json`);
        await fs.unlink(userFile);

        await this.saveIndex(index);
        return true;
    }
}

module.exports = { User, UserDatabase };
