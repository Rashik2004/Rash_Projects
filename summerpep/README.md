# Social Network Simulator

A full-stack web-based social networking simulator that allows users to interact with a simplified version of a social platform. It models user relationships using Graph Theory, provides real-time interactivity via a modern web interface, and executes backend logic in C++ for fast graph operations.

## Features

### Core Functionality
- User authentication and registration
- Add and manage users in your network
- Create connections between users (friendship)
- Check if two users are directly or indirectly connected (graph traversal)
- Suggest friends based on 2nd-degree connections
- Display mutual friends
- Find connected communities using Union-Find (Disjoint Set Union)
- Visualize the network with SVG
- Save/load the network from a file

### Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- Input validation
- CORS protection
- Helmet security headers

## Project Structure

```
summerpep/
├── frontend/          # Web interface (HTML, CSS, JS)
├── backend/           # C++ graph operations
├── server/            # Node.js/Express API server
├── data/              # Network data storage
├── .env.example       # Environment variables template
└── README.md
```

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- C++ compiler (g++ or clang++)
- Git

## Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/Rashik2004/Rash_Projects.git
cd summerpep
```

### 2. Set up environment variables
```bash
cp .env.example .env
# Edit .env file and set your JWT_SECRET
```

### 3. Install server dependencies
```bash
cd server
npm install
```

### 4. Compile C++ backend
```bash
cd ../backend
# Follow backend/README.md for compilation instructions
```

### 5. Start the server
```bash
cd ../server
npm run dev    # Development mode with nodemon
# or
npm start      # Production mode
```

### 6. Open the application
Visit `http://localhost:3000` in your browser

## Environment Variables

Required environment variables (copy from `.env.example`):

- `JWT_SECRET`: Secret key for JWT token signing (minimum 32 characters)
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `JWT_EXPIRES_IN`: JWT token expiration (default: 7d)

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/profile` - Get user profile

### Network Operations
- `POST /api/add-user` - Add user to network
- `POST /api/connect-users` - Connect two users
- `POST /api/check-connection` - Check if users are connected
- `POST /api/mutual-friends` - Get mutual friends
- `GET /api/network-data` - Get user's network data

## Security Considerations

⚠️ **Important**: Never commit your `.env` file to version control!

- JWT secrets should be strong and unique
- Use HTTPS in production
- Regularly update dependencies
- Monitor for security vulnerabilities
- Use environment-specific configurations

## Technologies Used

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- SVG for network visualization
- Responsive design

### Backend
- Node.js with Express.js
- JWT for authentication
- bcrypt for password hashing
- C++ for graph algorithms

### Security
- Helmet.js for security headers
- CORS middleware
- Rate limiting
- Input validation
- Password hashing

## Development

### Running in Development Mode
```bash
cd server
npm run dev
```

### Project Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue in the GitHub repository.
