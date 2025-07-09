document.addEventListener('DOMContentLoaded', function () {
    // API Base URL
    const API_BASE = window.location.origin + '/api';
    
    // Authentication state
    let authToken = localStorage.getItem('auth_token');
    let currentUser = null;
    
    // Authentication UI elements
    const authButtons = document.getElementById('auth-buttons');
    const userInfo = document.getElementById('user-info');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const usernameSpan = document.getElementById('username');
    
    // Check authentication on page load
    checkAuthentication();
    
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
    
    // Authentication functions
    async function checkAuthentication() {
        console.log('Checking authentication, token:', authToken ? 'exists' : 'missing');
        
        if (!authToken) {
            console.log('No token found, showing auth buttons');
            showAuthButtons();
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
            } else {
                console.log('Authentication failed:', data.error);
                handleAuthError();
            }
        } catch (error) {
            console.error('Authentication check failed:', error);
            handleAuthError();
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
    }
    
    // Authentication event listeners
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
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
    
    // Handle "Get Started" button click
    const getStartedBtn = document.querySelector('button:contains("Get Started")');
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', () => {
            if (authToken) {
                window.location.href = '/analysis.html';
            } else {
                window.location.href = '/auth.html';
            }
        });
    }
    
    // Handle all buttons with "Get Started" text
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        if (button.textContent.includes('Get Started')) {
            button.addEventListener('click', () => {
                if (authToken) {
                    window.location.href = '/analysis.html';
                } else {
                    window.location.href = '/auth.html';
                }
            });
        }
    });
});
