const jwt = require('jsonwebtoken');
const { UserDatabase } = require('../models/User');

const userDB = new UserDatabase();

// Load environment variables
require('dotenv').config();

// JWT Secret - MUST be set in environment variables
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Validate JWT_SECRET is provided
if (!JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET environment variable is not set!');
    console.error('Please set JWT_SECRET in your .env file or environment variables.');
    process.exit(1);
}

// Validate JWT_SECRET strength
if (JWT_SECRET.length < 32) {
    console.error('WARNING: JWT_SECRET should be at least 32 characters long for security!');
}

// Generate JWT token
function generateToken(userId) {
    return jwt.sign(
        { userId },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

// Verify JWT token
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

// Authentication middleware
async function authenticateToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Access token required'
            });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired token'
            });
        }

        // Get user from database
        const user = await userDB.findUserById(decoded.userId);
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                error: 'User not found or inactive'
            });
        }

        // Add user to request
        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication failed'
        });
    }
}

// Optional authentication middleware (doesn't fail if no token)
async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = verifyToken(token);
            if (decoded) {
                const user = await userDB.findUserById(decoded.userId);
                if (user && user.isActive) {
                    req.user = user;
                }
            }
        }
        next();
    } catch (error) {
        console.error('Optional auth error:', error);
        next();
    }
}

// Check if user is authenticated
function isAuthenticated(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }
    next();
}

// Check if user owns the resource
function checkOwnership(req, res, next) {
    // This middleware should be used after authenticateToken
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }

    // Check if the user ID in the request matches the authenticated user
    const resourceUserId = req.params.userId || req.body.userId;
    
    if (resourceUserId && resourceUserId !== req.user.userId) {
        return res.status(403).json({
            success: false,
            error: 'Access denied: You can only access your own resources'
        });
    }

    next();
}

// Session cleanup middleware
function sessionCleanup(req, res, next) {
    // Remove sensitive data from response
    res.locals.cleanUser = (user) => {
        const cleanUser = { ...user };
        delete cleanUser.password;
        return cleanUser;
    };
    next();
}

module.exports = {
    generateToken,
    verifyToken,
    authenticateToken,
    optionalAuth,
    isAuthenticated,
    checkOwnership,
    sessionCleanup,
    JWT_SECRET,
    JWT_EXPIRES_IN
};
