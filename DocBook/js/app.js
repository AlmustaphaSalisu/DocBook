/**
 * App.js - Main application initialization and global functions
 */

/**
 * Initialize the application
 */
function initApp() {
    console.log('DocBook - Doctors Booking System Initialized');
    
    // Initialize all modules
    initializeApp(); // From storage.js - sets up sample data
    initAuth(); // From auth.js - sets up authentication
    initUI(); // From ui.js - sets up UI components
    
    // Set up global event listeners
    setupGlobalEventListeners();
    
    // Check authentication status and show appropriate page
    const currentUser = getCurrentUser();
    if (currentUser) {
        showDashboard(currentUser.role);
        updateNavigation();
    } else {
        showWelcomePage();
    }
}

/**
 * Set up global event listeners
 */
function setupGlobalEventListeners() {
    // Handle escape key to close modals
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            const activeModal = document.querySelector('.modal.active');
            if (activeModal) {
                closeModal(activeModal.id);
            }
        }
    });
    
    // Handle form submissions to prevent default behavior
    document.addEventListener('submit', function(event) {
        // Let individual form handlers manage their own submission
        // This is just a fallback to prevent unwanted page reloads
        if (!event.defaultPrevented) {
            // Only prevent default if no handler has been set
            const form = event.target;
            if (!form.onsubmit) {
                event.preventDefault();
            }
        }
    });
    
    // Handle clicks outside modals to close them
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target.id);
        }
    });
    
    // Handle responsive navigation
    window.addEventListener('resize', handleResize);
}

/**
 * Handle window resize for responsive design
 */
function handleResize() {
    // Add any responsive behavior here if needed
    const width = window.innerWidth;
    
    // Example: Adjust availability grid for mobile
    if (width < 768) {
        const availabilityGrid = document.getElementById('availability-grid');
        if (availabilityGrid) {
            availabilityGrid.classList.add('mobile-view');
        }
    } else {
        const availabilityGrid = document.getElementById('availability-grid');
        if (availabilityGrid) {
            availabilityGrid.classList.remove('mobile-view');
        }
    }
}

/**
 * Global utility functions
 */

/**
 * Show loading state
 */
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    }
}

/**
 * Hide loading state
 */
function hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '';
    }
}

/**
 * Show notification (simple alert replacement)
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate phone number format (optional)
 */
function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Format currency (for future payment features)
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
function getRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
        return 'Just now';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }
}

/**
 * Export data (for backup purposes)
 */
function exportData() {
    const data = {
        users: UserStorage.getAll(),
        appointments: AppointmentStorage.getAll(),
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `docbook-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

/**
 * Import data (for restore purposes)
 */
function importData(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.users && data.appointments) {
                if (confirm('This will replace all current data. Are you sure?')) {
                    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
                    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(data.appointments));
                    alert('Data imported successfully! Please refresh the page.');
                }
            } else {
                alert('Invalid backup file format.');
            }
        } catch (error) {
            alert('Error reading backup file: ' + error.message);
        }
    };
    reader.readAsText(file);
}

/**
 * Clear all data (for testing purposes)
 */
function clearAllData() {
    if (confirm('This will delete ALL data including users and appointments. Are you sure?')) {
        if (confirm('This action cannot be undone. Are you absolutely sure?')) {
            localStorage.clear();
            alert('All data cleared. The page will reload with fresh sample data.');
            location.reload();
        }
    }
}

/**
 * Get system statistics
 */
function getSystemStats() {
    const users = UserStorage.getAll();
    const appointments = AppointmentStorage.getAll();
    
    return {
        totalUsers: users.length,
        totalPatients: users.filter(u => u.role === 'patient').length,
        totalDoctors: users.filter(u => u.role === 'doctor').length,
        approvedDoctors: users.filter(u => u.role === 'doctor' && u.approved).length,
        pendingDoctors: users.filter(u => u.role === 'doctor' && !u.approved).length,
        totalAppointments: appointments.length,
        pendingAppointments: appointments.filter(a => a.status === 'pending').length,
        confirmedAppointments: appointments.filter(a => a.status === 'confirmed').length,
        completedAppointments: appointments.filter(a => a.status === 'completed').length,
        cancelledAppointments: appointments.filter(a => a.status === 'cancelled').length
    };
}

/**
 * Console commands for debugging (only in development)
 */
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.DocBookDebug = {
        getStats: getSystemStats,
        exportData: exportData,
        clearData: clearAllData,
        getUsers: () => UserStorage.getAll(),
        getAppointments: () => AppointmentStorage.getAll(),
        getCurrentUser: getCurrentUser,
        loginAs: (email) => {
            const user = UserStorage.getByEmail(email);
            if (user) {
                SessionStorage.setCurrentUser(user);
                showDashboard(user.role);
                updateNavigation();
                console.log('Logged in as:', user.name);
            } else {
                console.log('User not found');
            }
        },
        forceRefreshSampleData: () => {
             Clear existing data
            localStorage.removeItem('docbook_users');
            localStorage.removeItem('docbook_appointments');
            localStorage.removeItem('docbook_initialized');
             Reinitialize
            initializeApp();
            console.log('Sample data refreshed with updated credentials');
        }
    };
    
    console.log('DocBook Debug commands available:');
    console.log('- DocBookDebug.getStats() - Get system statistics');
    console.log('- DocBookDebug.exportData() - Export all data');
    console.log('- DocBookDebug.clearData() - Clear all data');
    console.log('- DocBookDebug.loginAs(email) - Login as specific user');
    console.log('- DocBookDebug.forceRefreshSampleData() - Refresh sample data');
    console.log('');
    console.log('Sample accounts:');
    console.log('- Patient: patient@example.com (password: password123)');
    console.log('- Doctor: doctor@example.com (password: password123)');
    console.log('- Admin: admin@example.com (password: Admin123)');
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // Page became visible, refresh current user data
        const currentUser = getCurrentUser();
        if (currentUser) {
            const updatedUser = UserStorage.getById(currentUser.id);
            if (updatedUser) {
                SessionStorage.setCurrentUser(updatedUser);
            }
        }
    }
});

// Handle beforeunload to warn about unsaved changes
window.addEventListener('beforeunload', function(event) {
    // Add logic here if you want to warn about unsaved changes
    // For now, we'll let users navigate freely since data is auto-saved
});

console.log('DocBook System Loaded Successfully!');
