document.addEventListener('DOMContentLoaded', function () {
    const network = new Network();
    const visualizer = new NetworkVisualizer(document.getElementById('network-graph'), network);

    // API Base URL
    const API_BASE = window.location.origin + '/api';
    
    // Authentication state
    let authToken = localStorage.getItem('auth_token');
    let currentUser = null;
    
    // Check authentication on page load
    checkAuthentication();

    // UI Elements
    const addUserBtn = document.getElementById('add-user-btn');
    const newUserInput = document.getElementById('new-user-input');
    const connectUsersBtn = document.getElementById('connect-users-btn');
    const user1Select = document.getElementById('user1-select');
    const user2Select = document.getElementById('user2-select');
    const analysisUser1Select = document.getElementById('analysis-user1');
    const analysisUser2Select = document.getElementById('analysis-user2');
    const checkConnectionBtn = document.getElementById('check-connection-btn');
    const mutualFriendsBtn = document.getElementById('mutual-friends-btn');
    const suggestFriendsBtn = document.getElementById('suggest-friends-btn');
    const findCommunitiesBtn = document.getElementById('find-communities-btn');
    const analysisResults = document.getElementById('analysis-results');
    const saveNetworkBtn = document.getElementById('save-network-btn');
    const loadNetworkBtn = document.getElementById('load-network-btn');
    const networkFileInput = document.getElementById('network-file-input');
    
    // Authentication UI elements
    const authButtons = document.getElementById('auth-buttons');
    const userInfo = document.getElementById('user-info');
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const usernameSpan = document.getElementById('username');
    
    // Debug: Check if UI elements exist
    console.log('Auth UI Elements:', {
        authButtons: !!authButtons,
        userInfo: !!userInfo,
        loginBtn: !!loginBtn,
        signupBtn: !!signupBtn,
        logoutBtn: !!logoutBtn,
        usernameSpan: !!usernameSpan
    });
    
    // Response areas for different panels
    const userList = document.getElementById('user-list');
    const connectionList = document.getElementById('connection-list');
    const communityList = document.getElementById('community-list');

    // Helper function to make API calls
    async function apiCall(endpoint, method = 'GET', data = null) {
        try {
            const config = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
            };
            
            // Add authentication header if token exists
            if (authToken) {
                config.headers.Authorization = `Bearer ${authToken}`;
            }
            
            if (data) {
                config.body = JSON.stringify(data);
            }
            
            const response = await fetch(`${API_BASE}${endpoint}`, config);
            const result = await response.json();
            
            // Handle authentication errors
            if (response.status === 401) {
                handleAuthError();
                return { success: false, error: 'Authentication required' };
            }
            
            return result;
        } catch (error) {
            console.error('API call failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Event Listeners
    addUserBtn.addEventListener('click', async () => {
        const name = newUserInput.value.trim();
        if (name !== '') {
            // Check if user already exists locally
            const existingUser = network.users.find(user => user.name === name || user.id === name);
            if (existingUser) {
                showMessage(userList, `User "${name}" already exists!`, 'error');
                return;
            }
            
            // Add user locally
            const user = network.addUser(name);
            
            // Try to add user to backend
            const result = await apiCall('/add-user', 'POST', { userId: name });
            
            if (result.success) {
                showMessage(userList, `User "${name}" added successfully!`, 'success');
                newUserInput.value = '';
                updateUserSelects();
                updateUserList();
                visualizer.update();
            } else {
                // Remove from local network if backend failed
                network.users = network.users.filter(u => u.id !== user.id);
                showMessage(userList, `Failed to add user: ${result.error}`, 'error');
            }
        }
    });

    connectUsersBtn.addEventListener('click', async () => {
        const user1Id = user1Select.value;
        const user2Id = user2Select.value;
        
        if (!user1Id || !user2Id) {
            showMessage(connectionList, 'Please select both users to connect!', 'error');
            return;
        }
        
        if (user1Id === user2Id) {
            showMessage(connectionList, 'Cannot connect a user to themselves!', 'error');
            return;
        }
        
        // Create connection locally
        const localConnection = network.createConnection(user1Id, user2Id);
        
        if (!localConnection) {
            showMessage(connectionList, 'Connection already exists or invalid users!', 'error');
            return;
        }
        
        // Try to create connection in backend
        const result = await apiCall('/connect-users', 'POST', { user1Id, user2Id });
        
        if (result.success) {
            showMessage(connectionList, `Connected ${getUserNameById(user1Id)} and ${getUserNameById(user2Id)}!`, 'success');
            updateConnectionList();
            visualizer.update();
        } else {
            // Remove the local connection if backend failed
            network.connections = network.connections.filter(conn => 
                !((conn.user1Id === user1Id && conn.user2Id === user2Id) || 
                  (conn.user1Id === user2Id && conn.user2Id === user1Id))
            );
            showMessage(connectionList, `Failed to create connection: ${result.error}`, 'error');
        }
    });

    checkConnectionBtn.addEventListener('click', () => {
        const user1Id = analysisUser1Select.value;
        const user2Id = analysisUser2Select.value;
        if (user1Id && user2Id) {
            const areConnected = network.areConnected(user1Id, user2Id);
            const message = areConnected ? "Users are connected." : "Users are not connected.";
            showMessage(analysisResults, message, areConnected ? 'success' : 'info');
        } else {
            showMessage(analysisResults, 'Please select both users to check connection.', 'error');
        }
    });

    mutualFriendsBtn.addEventListener('click', () => {
        const user1Id = analysisUser1Select.value;
        const user2Id = analysisUser2Select.value;
        if (user1Id && user2Id) {
            const mutualFriends = network.getMutualFriends(user1Id, user2Id);
            const message = mutualFriends.length ? "Mutual Friends: " + mutualFriends.map(user => user.name).join(', ') : "No mutual friends.";
            showMessage(analysisResults, message, 'info');
        } else {
            showMessage(analysisResults, 'Please select both users to find mutual friends.', 'error');
        }
    });

    suggestFriendsBtn.addEventListener('click', () => {
        const userId = analysisUser1Select.value;
        if (userId) {
            const suggestions = network.suggestFriends(userId);
            const message = suggestions.length ? "Friend Suggestions: " + suggestions.map(user => user.name).join(', ') : "No suggestions available.";
            showMessage(analysisResults, message, 'info');
        } else {
            showMessage(analysisResults, 'Please select a user to get friend suggestions.', 'error');
        }
    });

    findCommunitiesBtn.addEventListener('click', () => {
        const communities = network.findCommunities();
        const message = "Communities found: " + communities.map((community, index) => `Community ${index + 1}: ${community.map(user => user.name).join(', ')}`).join(' | ');
        showMessage(communityList, message, 'info');
        updateCommunityList();
    });

    saveNetworkBtn.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(network.exportNetwork());
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "network.json");
        document.body.appendChild(downloadAnchor); // Needed for Firefox
        downloadAnchor.click();
        downloadAnchor.remove();
    });

    loadNetworkBtn.addEventListener('click', () => {
        networkFileInput.click();
    });

    networkFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                if (network.importNetwork(e.target.result)) {
                    updateUserSelects();
                    visualizer.update();
                }
            };
            reader.readAsText(file);
        }
    });

    // Helper function to get user name by ID
    function getUserNameById(userId) {
        const user = network.users.find(u => u.id === userId);
        return user ? user.name : userId;
    }

    // Helper function to show messages in specific containers
    function showMessage(container, message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.style.cssText = `
            padding: 8px 12px;
            margin: 4px 0;
            border-radius: 4px;
            font-size: 14px;
            ${type === 'error' ? 'color: #dc2626; background-color: #fee2e2; border: 1px solid #fecaca;' : ''}
            ${type === 'success' ? 'color: #059669; background-color: #d1fae5; border: 1px solid #a7f3d0;' : ''}
            ${type === 'info' ? 'color: #2563eb; background-color: #dbeafe; border: 1px solid #93c5fd;' : ''}
        `;
        messageDiv.textContent = message;
        
        // Clear previous messages
        const previousMessages = container.querySelectorAll('.message');
        previousMessages.forEach(msg => msg.remove());
        
        // Add new message
        container.appendChild(messageDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }

    // Helper function to update user selects
    function updateUserSelects() {
        const users = network.users;
        
        const selects = [
            user1Select, 
            user2Select, 
            analysisUser1Select,
            analysisUser2Select
        ];
        
        selects.forEach((select, index) => {
            if (select) {
                // Clear existing options
                select.innerHTML = '';
                
                // Add default option
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = index < 2 ? `Select User ${index + 1}` : 'Select User';
                select.appendChild(defaultOption);
                
                // Add user options
                users.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.id;
                    option.textContent = user.name;
                    select.appendChild(option);
                });
            }
        });
    }

    // Helper function to update user list display
    function updateUserList() {
        if (userList) {
            // Clear existing content except messages
            const messages = userList.querySelectorAll('.message');
            userList.innerHTML = '';
            messages.forEach(msg => userList.appendChild(msg));
            
            // Add users
            network.users.forEach(user => {
                const userDiv = document.createElement('div');
                userDiv.className = 'user-item';
                userDiv.style.cssText = `
                    padding: 4px 8px;
                    margin: 2px 0;
                    background-color: #f3f4f6;
                    border-radius: 4px;
                    font-size: 14px;
                `;
                userDiv.textContent = user.name;
                userList.appendChild(userDiv);
            });
        }
    }

    // Helper function to update connection list display
    function updateConnectionList() {
        if (connectionList) {
            // Clear existing content except messages
            const messages = connectionList.querySelectorAll('.message');
            connectionList.innerHTML = '';
            messages.forEach(msg => connectionList.appendChild(msg));
            
            // Add connections
            network.connections.forEach(conn => {
                const connDiv = document.createElement('div');
                connDiv.className = 'connection-item';
                connDiv.style.cssText = `
                    padding: 4px 8px;
                    margin: 2px 0;
                    background-color: #f3f4f6;
                    border-radius: 4px;
                    font-size: 14px;
                `;
                connDiv.textContent = `${getUserNameById(conn.user1Id)} ↔ ${getUserNameById(conn.user2Id)}`;
                connectionList.appendChild(connDiv);
            });
        }
    }

    // Helper function to update community list display
    function updateCommunityList() {
        if (communityList) {
            // Clear existing content except messages
            const messages = communityList.querySelectorAll('.message');
            communityList.innerHTML = '';
            messages.forEach(msg => communityList.appendChild(msg));
            
            // Add communities
            const communities = network.findCommunities();
            communities.forEach((community, index) => {
                const communityDiv = document.createElement('div');
                communityDiv.className = 'community-item';
                communityDiv.style.cssText = `
                    padding: 4px 8px;
                    margin: 2px 0;
                    background-color: #f3f4f6;
                    border-radius: 4px;
                    font-size: 14px;
                `;
                communityDiv.textContent = `Community ${index + 1}: ${community.map(user => user.name).join(', ')}`;
                communityList.appendChild(communityDiv);
            });
        }
    }

    // Authentication functions
    async function checkAuthentication() {
        console.log('Checking authentication, token:', authToken ? 'exists' : 'missing');
        
        if (!authToken) {
            console.log('No token found, showing auth buttons');
            showAuthButtons();
            initializeWithoutAuth();
            return;
        }
        
        try {
            console.log('Making profile request...');
            const response = await fetch(`${API_BASE}/profile`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            const data = await response.json();
            console.log('Profile response:', data);
            
            if (data.success) {
                currentUser = data.user;
                console.log('Authentication successful, user:', currentUser);
                showUserInfo();
                await loadUserNetworkData();
            } else {
                console.log('Authentication failed:', data.error);
                handleAuthError();
            }
        } catch (error) {
            console.error('Authentication check failed:', error);
            handleAuthError();
        }
    }
    
    async function loadUserNetworkData() {
        try {
            const result = await apiCall('/network-data');
            if (result.success && result.networkData) {
                // Load network data into the local network object
                network.users = result.networkData.users || [];
                network.connections = result.networkData.connections || [];
                
                // Update UI
                updateUserSelects();
                updateUserList();
                updateConnectionList();
                updateCommunityList();
                visualizer.update();
            }
        } catch (error) {
            console.error('Failed to load network data:', error);
        }
    }
    
    function showAuthButtons() {
        console.log('Showing auth buttons');
        if (authButtons) authButtons.classList.remove('hidden');
        if (userInfo) userInfo.classList.add('hidden');
    }
    
    function showUserInfo() {
        console.log('Showing user info for:', currentUser);
        if (authButtons) authButtons.classList.add('hidden');
        if (userInfo) userInfo.classList.remove('hidden');
        if (currentUser && usernameSpan) {
            usernameSpan.textContent = currentUser.username;
        }
    }
    
    function handleAuthError() {
        authToken = null;
        currentUser = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_info');
        showAuthButtons();
        
        // Clear network data and initialize UI
        network.users = [];
        network.connections = [];
        initializeWithoutAuth();
    }
    
    function initializeWithoutAuth() {
        updateUserSelects();
        updateUserList();
        updateConnectionList();
        updateCommunityList();
        visualizer.update();
    }
    
    // Authentication event listeners
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            window.location.href = '/auth.html';
        });
    }
    
    if (signupBtn) {
        signupBtn.addEventListener('click', () => {
            window.location.href = '/auth.html';
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await apiCall('/logout', 'POST');
            } catch (error) {
                console.error('Logout error:', error);
            } finally {
                handleAuthError();
            }
        });
    }
    
    // Always check authentication state first
    checkAuthentication();
});
