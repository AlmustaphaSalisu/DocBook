/**
 * Doctor.js - Handles doctor-specific functionality
 */

/**
 * Load doctor dashboard
 */
function loadDoctorDashboard() {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'doctor') return;
    
    // Update doctor name
    const doctorNameEl = document.getElementById('doctor-name');
    if (doctorNameEl) {
        doctorNameEl.textContent = currentUser.name;
    }
    
    // Load default tab (profile)
    loadDoctorProfile();
}

/**
 * Load doctor profile form
 */
function loadDoctorProfile() {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'doctor') return;
    
    // Populate form fields
    const bioField = document.getElementById('doctor-bio');
    const specialtyField = document.getElementById('doctor-specialty-edit');
    const locationField = document.getElementById('doctor-location-edit');
    
    if (bioField) bioField.value = currentUser.bio || '';
    if (specialtyField) specialtyField.value = currentUser.specialty || '';
    if (locationField) locationField.value = currentUser.location || '';
    
    // Set up form submission
    const profileForm = document.getElementById('doctor-profile-form');
    if (profileForm) {
        profileForm.onsubmit = handleProfileUpdate;
    }
}

/**
 * Handle profile update
 */
function handleProfileUpdate(event) {
    event.preventDefault();
    
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const bio = document.getElementById('doctor-bio').value;
    const specialty = document.getElementById('doctor-specialty-edit').value;
    const location = document.getElementById('doctor-location-edit').value;
    
    // Update user profile
    const updated = UserStorage.update(currentUser.id, {
        bio,
        specialty,
        location
    });
    
    if (updated) {
        // Update session storage
        SessionStorage.setCurrentUser(updated);
        alert('Profile updated successfully!');
    } else {
        alert('Failed to update profile. Please try again.');
    }
}

/**
 * Load doctor appointments
 */
function loadDoctorAppointments() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const appointments = AppointmentStorage.getUpcoming(currentUser.id, 'doctor');
    const container = document.getElementById('doctor-appointments-list');
    
    if (!container) return;
    
    if (appointments.length === 0) {
        container.innerHTML = '<div class="text-center"><p>No upcoming appointments.</p></div>';
        return;
    }
    
    container.innerHTML = appointments.map(appointment => 
        createDoctorAppointmentCard(appointment)
    ).join('');
}

/**
 * Load doctor appointment history
 */
function loadDoctorHistory() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const appointments = AppointmentStorage.getHistory(currentUser.id, 'doctor');
    const container = document.getElementById('doctor-history-list');
    
    if (!container) return;
    
    if (appointments.length === 0) {
        container.innerHTML = '<div class="text-center"><p>No appointment history.</p></div>';
        return;
    }
    
    container.innerHTML = appointments.map(appointment => 
        createDoctorAppointmentCard(appointment, true)
    ).join('');
}

/**
 * Create doctor appointment card
 */
function createDoctorAppointmentCard(appointment, isHistory = false) {
    const patient = UserStorage.getById(appointment.patientId);
    if (!patient) return '';
    
    const statusBadge = getStatusBadge(appointment.status);
    const canApprove = !isHistory && appointment.status === 'pending';
    const canComplete = !isHistory && appointment.status === 'confirmed';
    
    return `
        <div class="appointment-card">
            <div class="appointment-header">
                <div class="appointment-info">
                    <h4>${patient.name}</h4>
                    <div class="appointment-details">
                        <div><i class="fas fa-calendar"></i> ${formatDate(appointment.date)}</div>
                        <div><i class="fas fa-clock"></i> ${formatTime(appointment.time)}</div>
                        <div><i class="fas fa-envelope"></i> ${patient.email}</div>
                        ${appointment.reason ? `<div><i class="fas fa-notes-medical"></i> ${appointment.reason}</div>` : ''}
                    </div>
                </div>
                ${statusBadge}
            </div>
            ${(canApprove || canComplete) ? `
                <div class="appointment-actions">
                    ${canApprove ? `
                        <button class="btn btn-success" onclick="approveAppointment('${appointment.id}')">Approve</button>
                        <button class="btn btn-danger" onclick="declineAppointment('${appointment.id}')">Decline</button>
                    ` : ''}
                    ${canComplete ? `
                        <button class="btn btn-primary" onclick="completeAppointment('${appointment.id}')">Mark Complete</button>
                    ` : ''}
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Approve appointment
 */
function approveAppointment(appointmentId) {
    const updated = AppointmentStorage.update(appointmentId, {
        status: 'confirmed'
    });
    
    if (updated) {
        alert('Appointment approved successfully!');
        loadDoctorAppointments();
    } else {
        alert('Failed to approve appointment. Please try again.');
    }
}

/**
 * Decline appointment
 */
function declineAppointment(appointmentId) {
    if (!confirm('Are you sure you want to decline this appointment?')) {
        return;
    }
    
    const updated = AppointmentStorage.update(appointmentId, {
        status: 'cancelled'
    });
    
    if (updated) {
        alert('Appointment declined.');
        loadDoctorAppointments();
        loadDoctorHistory();
    } else {
        alert('Failed to decline appointment. Please try again.');
    }
}

/**
 * Complete appointment
 */
function completeAppointment(appointmentId) {
    const updated = AppointmentStorage.update(appointmentId, {
        status: 'completed'
    });
    
    if (updated) {
        alert('Appointment marked as completed!');
        loadDoctorAppointments();
        loadDoctorHistory();
    } else {
        alert('Failed to complete appointment. Please try again.');
    }
}

/**
 * Load doctor availability
 */
function loadDoctorAvailability() {
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.availability) return;
    
    const container = document.getElementById('availability-grid');
    if (!container) return;
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const times = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', 
                   '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];
    
    let gridHtml = '';
    
    // Create header row
    gridHtml += days.map(day => `
        <div class="day-column">
            <div class="day-header">${day.charAt(0).toUpperCase() + day.slice(1)}</div>
            ${times.map(time => {
                const slot = currentUser.availability.find(s => s.day === day && s.time === time);
                const isAvailable = slot ? slot.available : false;
                return `
                    <div class="time-slot ${isAvailable ? 'available' : ''}" 
                         onclick="toggleAvailability('${day}', '${time}')"
                         data-day="${day}" data-time="${time}">
                        ${formatTime(time)}
                    </div>
                `;
            }).join('')}
        </div>
    `).join('');
    
    container.innerHTML = gridHtml;
}

/**
 * Toggle availability slot
 */
function toggleAvailability(day, time) {
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.availability) return;
    
    const slotIndex = currentUser.availability.findIndex(s => s.day === day && s.time === time);
    
    if (slotIndex !== -1) {
        // Toggle existing slot
        currentUser.availability[slotIndex].available = !currentUser.availability[slotIndex].available;
    } else {
        // Add new slot
        currentUser.availability.push({ day, time, available: true });
    }
    
    // Update visual state
    const slotElement = document.querySelector(`[data-day="${day}"][data-time="${time}"]`);
    if (slotElement) {
        slotElement.classList.toggle('available');
    }
}

/**
 * Save availability changes
 */
function saveAvailability() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const updated = UserStorage.update(currentUser.id, {
        availability: currentUser.availability
    });
    
    if (updated) {
        SessionStorage.setCurrentUser(updated);
        alert('Availability saved successfully!');
    } else {
        alert('Failed to save availability. Please try again.');
    }
}
