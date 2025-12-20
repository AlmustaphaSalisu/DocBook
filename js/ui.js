/**
 * UI.js - Handles UI interactions and page navigation
 */

/**
 * Show different pages
 */
function showPage(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.style.display = 'none';
        page.classList.remove('active');
    });
    
    // Show selected page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.style.display = 'block';
        targetPage.classList.add('active');
    }
}

function showWelcomePage() {
    showPage('welcome-page');
}

function showLogin() {
    showPage('login-page');
    document.getElementById('login-form').reset();
    document.getElementById('login-message').innerHTML = '';
}

function showRegister() {
    showPage('register-page');
    document.getElementById('register-form').reset();
    document.getElementById('register-message').innerHTML = '';
    document.getElementById('doctor-fields').style.display = 'none';
}

function showDashboard(role) {
    switch (role) {
        case 'patient':
            showPage('patient-dashboard');
            loadPatientDashboard();
            break;
        case 'doctor':
            showPage('doctor-dashboard');
            loadDoctorDashboard();
            break;
        case 'admin':
            showPage('admin-dashboard');
            loadAdminDashboard();
            break;
        default:
            showWelcomePage();
    }
}

/**
 * Tab functionality
 */
function showTab(tabId) {
    // Get the parent dashboard
    const dashboard = document.querySelector('.page.active');
    if (!dashboard) return;
    
    // Hide all tab contents
    const tabContents = dashboard.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    const tabButtons = dashboard.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab content
    const targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    // Add active class to clicked button
    const clickedButton = event ? event.target : 
        dashboard.querySelector(`[onclick*="${tabId}"]`);
    if (clickedButton) {
        clickedButton.classList.add('active');
    }
    
    // Load tab-specific content
    loadTabContent(tabId);
}

/**
 * Load content for specific tabs
 */
function loadTabContent(tabId) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    switch (tabId) {
        case 'find-doctors':
            loadDoctorsGrid();
            break;
        case 'my-appointments':
            loadPatientAppointments();
            break;
        case 'appointment-history':
            loadPatientHistory();
            break;
        case 'doctor-profile':
            loadDoctorProfile();
            break;
        case 'doctor-appointments':
            loadDoctorAppointments();
            break;
        case 'doctor-availability':
            loadDoctorAvailability();
            break;
        case 'doctor-history':
            loadDoctorHistory();
            break;
        case 'admin-users':
            loadAdminUsers();
            break;
        case 'admin-doctors':
            loadAdminDoctors();
            break;
        case 'admin-appointments':
            loadAdminAppointments();
            break;
    }
}

/**
 * Modal functionality
 */
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
        
        // Clear form data
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
    }
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        const modalId = event.target.id;
        closeModal(modalId);
    }
});

/**
 * Message display functionality
 */
function showMessage(element, message, type = 'info') {
    if (typeof element === 'string') {
        element = document.getElementById(element);
    }
    
    if (!element) return;
    
    element.innerHTML = `<div class="message ${type}">${message}</div>`;
    
    // Auto-hide success messages
    if (type === 'success') {
        setTimeout(() => {
            element.innerHTML = '';
        }, 3000);
    }
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Format time for display
 */
function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

/**
 * Get status badge HTML
 */
function getStatusBadge(status) {
    const statusClasses = {
        pending: 'status-pending',
        confirmed: 'status-confirmed',
        cancelled: 'status-cancelled',
        completed: 'status-completed'
    };
    
    const statusTexts = {
        pending: 'Pending',
        confirmed: 'Confirmed',
        cancelled: 'Cancelled',
        completed: 'Completed'
    };
    
    return `<span class="appointment-status ${statusClasses[status]}">${statusTexts[status]}</span>`;
}

/**
 * Generate star rating HTML
 */
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let starsHtml = '';
    
    for (let i = 0; i < fullStars; i++) {
        starsHtml += '<i class="fas fa-star"></i>';
    }
    
    if (hasHalfStar) {
        starsHtml += '<i class="fas fa-star-half-alt"></i>';
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        starsHtml += '<i class="far fa-star"></i>';
    }
    
    return `<div class="stars">${starsHtml}</div>`;
}

/**
 * Get user initials for avatar
 */
function getUserInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

/**
 * Generate time slots for booking
 */
function generateTimeSlots() {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            const displayTime = formatTime(timeString);
            slots.push({ value: timeString, display: displayTime });
        }
    }
    return slots;
}

/**
 * Populate time select options
 */
function populateTimeSelect(selectId, availableSlots = null) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    select.innerHTML = '<option value="">Select Time</option>';
    
    const timeSlots = generateTimeSlots();
    timeSlots.forEach(slot => {
        if (!availableSlots || availableSlots.includes(slot.value)) {
            const option = document.createElement('option');
            option.value = slot.value;
            option.textContent = slot.display;
            select.appendChild(option);
        }
    });
}

/**
 * Get minimum date (today)
 */
function getMinDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

/**
 * Set minimum date for date inputs
 */
function setMinimumDates() {
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const minDate = getMinDate();
    
    dateInputs.forEach(input => {
        input.min = minDate;
    });
}

/**
 * Debounce function for search
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Initialize UI components
 */
function initUI() {
    // Set minimum dates
    setMinimumDates();
    
    // Add search debouncing
    const searchInput = document.getElementById('doctor-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(searchDoctors, 300));
    }
    
    // Add filter event listeners
    const specialtyFilter = document.getElementById('specialty-filter');
    const locationFilter = document.getElementById('location-filter');
    
    if (specialtyFilter) {
        specialtyFilter.addEventListener('change', searchDoctors);
    }
    
    if (locationFilter) {
        locationFilter.addEventListener('input', debounce(searchDoctors, 300));
    }
}

// Initialize UI when DOM is loaded
document.addEventListener('DOMContentLoaded', initUI);
