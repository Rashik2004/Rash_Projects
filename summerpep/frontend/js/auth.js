/* The above JavaScript code is implementing a basic authentication system for a
web application. Here is a summary of what the code is doing: */
document.addEventListener('DOMContentLoaded', function() {
    // API Base URL
    const API_BASE = window.location.origin + '/api';

    // UI Elements
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginFormElement = document.getElementById('login-form-element');
    const signupFormElement = document.getElementById('signup-form-element');
    const authMessage = document.getElementById('auth-message');

    // Tab switching
    loginTab.addEventListener('click', () => {
        switchTab('login');
    });

    signupTab.addEventListener('click', () => {
        switchTab('signup');
    });

    function switchTab(tab) {
        if (tab === 'login') {
            loginTab.classList.add('bg-highlight', 'text-white');
            loginTab.classList.remove('bg-gray-200', 'text-gray-700');
            signupTab.classList.add('bg-gray-200', 'text-gray-700');
            signupTab.classList.remove('bg-highlight', 'text-white');

            loginForm.classList.remove('hidden');
            signupForm.classList.add('hidden');
        } else {
            signupTab.classList.add('bg-highlight', 'text-white');
            signupTab.classList.remove('bg-gray-200', 'text-gray-700');
            loginTab.classList.add('bg-gray-200', 'text-gray-700');
            loginTab.classList.remove('bg-highlight', 'text-white');

            signupForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
        }
        clearMessage();
    }

    // Form submissions
    loginFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleLogin();
    });

    signupFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleSignup();
    });

    // Authentication functions
    async function handleLogin() {
        const formData = new FormData(loginFormElement);
        const email = formData.get('email');
        const password = formData.get('password');

        if (!email || !password) {
            showMessage('Please fill in all fields', 'error');
            return;
        }

        try {
            showMessage('Signing in...', 'info');

            const response = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                // Store token and user info
                localStorage.setItem('auth_token', data.token);
                localStorage.setItem('user_info', JSON.stringify(data.user));

                showMessage('Login successful! Redirecting...', 'success');

                // Redirect to main application
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            } else {
                showMessage(data.error || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showMessage('An error occurred during login', 'error');
        }
    }

    async function handleSignup() {
        const formData = new FormData(signupFormElement);
        const username = formData.get('username');
        const email = formData.get('email');
        const password = formData.get('password');

        if (!username || !email || !password) {
            showMessage('Please fill in all fields', 'error');
            return;
        }

        // Basic validation
        if (username.length < 3) {
            showMessage('Username must be at least 3 characters long', 'error');
            return;
        }

        if (password.length < 6) {
            showMessage('Password must be at least 6 characters long', 'error');
            return;
        }

        if (!isValidEmail(email)) {
            showMessage('Please enter a valid email address', 'error');
            return;
        }

        try {
            showMessage('Creating account...', 'info');

            const response = await fetch(`${API_BASE}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (data.success) {
                // Store token and user info
                localStorage.setItem('auth_token', data.token);
                localStorage.setItem('user_info', JSON.stringify(data.user));

                showMessage('Account created successfully! Redirecting...', 'success');

                // Redirect to main application
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            } else {
                showMessage(data.error || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showMessage('An error occurred during registration', 'error');
        }
    }

    // Utility functions
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function showMessage(message, type) {
        authMessage.className = `mt-4 p-3 rounded-md ${getMessageClasses(type)}`;
        authMessage.textContent = message;
        authMessage.classList.remove('hidden');

        // Auto-hide success and info messages after 3 seconds
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                authMessage.classList.add('hidden');
            }, 3000);
        }
    }

    function getMessageClasses(type) {
        switch (type) {
            case 'error':
                return 'bg-red-100 border border-red-400 text-red-700';
            case 'success':
                return 'bg-green-100 border border-green-400 text-green-700';
            case 'info':
                return 'bg-blue-100 border border-blue-400 text-blue-700';
            default:
                return 'bg-gray-100 border border-gray-400 text-gray-700';
        }
    }

    function clearMessage() {
        authMessage.classList.add('hidden');
    }

    // Check if user is already logged in
    const token = localStorage.getItem('auth_token');
    if (token) {
        // Verify token by making a request to profile endpoint
        fetch(`${API_BASE}/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // User is logged in, redirect to main page
                window.location.href = '/';
            } else {
                // Token is invalid, remove it
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_info');
            }
        })
        .catch(error => {
            console.error('Token verification error:', error);
            // Remove invalid token
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_info');
        });
    }
});
