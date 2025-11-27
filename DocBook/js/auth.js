/**
 * Auth.js - Handles authentication and authorization
 */

/**
 * Login functionality
 */
function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const messageEl = document.getElementById('login-message');
    
    // Clear previous messages
    messageEl.innerHTML = '';
    
    // Find user by email
    const user = UserStorage.getByEmail(email);
    
    if (!user) {
        showMessage(messageEl, 'User not found', 'error');
        return;
    }
    
    // Check password
    if (user.passwordHash !== hashPassword(password)) {
        showMessage(messageEl, 'Invalid password', 'error');
        return;
    }
    
    // Check if user is approved (for doctors)
    if (user.role === 'doctor' && !user.approved) {
        showMessage(messageEl, 'Your account is pending approval by an administrator', 'error');
        return;
    }
    
    // Login successful
    SessionStorage.setCurrentUser(user);
    showMessage(messageEl, 'Login successful!', 'success');
    
    // Redirect to appropriate dashboard
    setTimeout(() => {
        showDashboard(user.role);
        updateNavigation();
    }, 1000);
}

/**
 * Registration functionality
 */
function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const role = document.getElementById('register-role').value;
    const messageEl = document.getElementById('register-message');
    
    // Clear previous messages
    messageEl.innerHTML = '';
    
    // Validation
    if (!name || !email || !password || !role) {
        showMessage(messageEl, 'Please fill in all required fields', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage(messageEl, 'Password must be at least 6 characters long', 'error');
        return;
    }
    
    // Prevent admin registration
    if (role === 'admin') {
        showMessage(messageEl, 'Admin registration is not allowed', 'error');
        return;
    }
    
    // Check if user already exists
    if (UserStorage.getByEmail(email)) {
        showMessage(messageEl, 'User with this email already exists', 'error');
        return;
    }
    
    // Prepare user data
    const userData = {
        name,
        email,
        password,
        role
    };
    
    // Add doctor-specific fields
    if (role === 'doctor') {
        const specialty = document.getElementById('register-specialty').value;
        const location = document.getElementById('register-location').value;
        const bio = document.getElementById('register-bio').value;
        
        if (!specialty || !location) {
            showMessage(messageEl, 'Please fill in all doctor fields', 'error');
            return;
        }
        
        userData.specialty = specialty;
        userData.location = location;
        userData.bio = bio || '';
    }
    
    // Create user
    const newUser = UserStorage.create(userData);
    
    if (role === 'doctor') {
        showMessage(messageEl, 'Registration successful! Your account is pending approval.', 'success');
    } else {
        showMessage(messageEl, 'Registration successful! You can now login.', 'success');
    }
    
    // Clear form
    document.getElementById('register-form').reset();
    document.getElementById('doctor-fields').style.display = 'none';
    
    // Redirect to login after delay
    setTimeout(() => {
        showLogin();
    }, 2000);
}

/**
 * Logout functionality
 */
function logout() {
    SessionStorage.clearCurrentUser();
    showWelcomePage();
    updateNavigation();
}

/**
 * Check if user is authenticated and authorized
 */
function requireAuth(requiredRole = null) {
    const currentUser = SessionStorage.getCurrentUser();
    
    if (!currentUser) {
        showLogin();
        return false;
    }
    
    if (requiredRole && currentUser.role !== requiredRole) {
        showMessage(document.body, 'Access denied', 'error');
        return false;
    }
    
    return true;
}

/**
 * Get current user
 */
function getCurrentUser() {
    return SessionStorage.getCurrentUser();
}

/**
 * Check if current user has role
 */
function hasRole(role) {
    const currentUser = getCurrentUser();
    return currentUser && currentUser.role === role;
}

/**
 * Initialize authentication
 */
function initAuth() {
    // Set up form event listeners
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const roleSelect = document.getElementById('register-role');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    if (roleSelect) {
        roleSelect.addEventListener('change', function() {
            const doctorFields = document.getElementById('doctor-fields');
            if (this.value === 'doctor') {
                doctorFields.style.display = 'block';
                // Make doctor fields required
                document.getElementById('register-specialty').required = true;
                document.getElementById('register-location').required = true;
            } else {
                doctorFields.style.display = 'none';
                // Make doctor fields not required
                document.getElementById('register-specialty').required = false;
                document.getElementById('register-location').required = false;
            }
        });
    }
    
    // Check if user is already logged in
    const currentUser = getCurrentUser();
    if (currentUser) {
        showDashboard(currentUser.role);
        updateNavigation();
    } else {
        showWelcomePage();
    }
}

/**
 * Update navigation based on authentication status
 */
function updateNavigation() {
    const navAuth = document.getElementById('nav-auth');
    const navUserInfo = document.getElementById('nav-user-info');
    const navUsername = document.getElementById('nav-username');
    
    const currentUser = getCurrentUser();
    
    if (currentUser) {
        navAuth.style.display = 'none';
        navUserInfo.style.display = 'flex';
        navUsername.textContent = currentUser.name;
    } else {
        navAuth.style.display = 'flex';
        navUserInfo.style.display = 'none';
    }
}

// Initialize authentication when DOM is loaded
document.addEventListener('DOMContentLoaded', initAuth);
