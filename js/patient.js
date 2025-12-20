/**
 * Patient.js - Handles patient-specific functionality
 */

/**
 * Load patient dashboard
 */
function loadPatientDashboard() {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'patient') return;
    
    // Update patient name
    const patientNameEl = document.getElementById('patient-name');
    if (patientNameEl) {
        patientNameEl.textContent = currentUser.name;
    }
    
    // Load default tab (find doctors)
    loadDoctorsGrid();
}

/**
 * Load and display doctors grid
 */
function loadDoctorsGrid() {
    const doctors = UserStorage.getApprovedDoctors();
    const gridContainer = document.getElementById('doctors-grid');
    
    if (!gridContainer) return;
    
    if (doctors.length === 0) {
        gridContainer.innerHTML = '<div class="text-center"><p>No doctors available at the moment.</p></div>';
        return;
    }
    
    gridContainer.innerHTML = doctors.map(doctor => createDoctorCard(doctor)).join('');
}

/**
 * Create doctor card HTML
 */
function createDoctorCard(doctor) {
    const initials = getUserInitials(doctor.name);
    const rating = doctor.rating || 0;
    const ratingStars = generateStarRating(rating);
    
    return `
        <div class="doctor-card">
            <div class="doctor-header">
                <div class="doctor-avatar">
                    ${initials}
                </div>
                <div class="doctor-info">
                    <h3>${doctor.name}</h3>
                    <div class="doctor-specialty">${doctor.specialty}</div>
                </div>
            </div>
            <div class="doctor-location">
                <i class="fas fa-map-marker-alt"></i> ${doctor.location}
            </div>
            <div class="doctor-rating">
                ${ratingStars}
                <span>(${rating.toFixed(1)})</span>
            </div>
            <div class="doctor-bio">
                ${doctor.bio || 'No bio available'}
            </div>
            <div class="doctor-actions">
                <button class="btn btn-primary" onclick="openBookingModal('${doctor.id}')">
                    Book Appointment
                </button>
                <button class="btn btn-outline" onclick="viewDoctorProfile('${doctor.id}')">
                    View Profile
                </button>
            </div>
        </div>
    `;
}

/**
 * Search doctors functionality
 */
function searchDoctors() {
    const query = document.getElementById('doctor-search').value;
    const specialty = document.getElementById('specialty-filter').value;
    const location = document.getElementById('location-filter').value;
    
    const filteredDoctors = SearchUtils.searchDoctors(query, specialty, location);
    const gridContainer = document.getElementById('doctors-grid');
    
    if (!gridContainer) return;
    
    if (filteredDoctors.length === 0) {
        gridContainer.innerHTML = '<div class="text-center"><p>No doctors found matching your criteria.</p></div>';
        return;
    }
    
    gridContainer.innerHTML = filteredDoctors.map(doctor => createDoctorCard(doctor)).join('');
}

/**
 * Clear search filters
 */
function clearFilters() {
    document.getElementById('doctor-search').value = '';
    document.getElementById('specialty-filter').value = '';
    document.getElementById('location-filter').value = '';
    loadDoctorsGrid();
}

/**
 * Open booking modal
 */
function openBookingModal(doctorId) {
    const doctor = UserStorage.getById(doctorId);
    if (!doctor) return;
    
    const modal = document.getElementById('booking-modal');
    const doctorNameEl = document.getElementById('booking-doctor-name');
    const bookingForm = document.getElementById('booking-form');
    
    // Set doctor info
    doctorNameEl.textContent = `Dr. ${doctor.name} - ${doctor.specialty}`;
    
    // Store doctor ID in form
    bookingForm.dataset.doctorId = doctorId;
    
    // Populate time slots
    populateTimeSelect('booking-time');
    
    // Set minimum date
    const dateInput = document.getElementById('booking-date');
    dateInput.min = getMinDate();
    
    // Set up form submission
    bookingForm.onsubmit = handleBookingSubmission;
    
    showModal('booking-modal');
}

/**
 * Handle booking form submission
 */
function handleBookingSubmission(event) {
    event.preventDefault();
    
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const form = event.target;
    const doctorId = form.dataset.doctorId;
    const date = document.getElementById('booking-date').value;
    const time = document.getElementById('booking-time').value;
    const reason = document.getElementById('booking-reason').value;
    
    if (!date || !time) {
        alert('Please select both date and time');
        return;
    }
    
    // Check if slot is available
    if (!isSlotAvailable(doctorId, date, time)) {
        alert('This time slot is not available. Please choose another time.');
        return;
    }
    
    // Create appointment
    const appointmentData = {
        doctorId,
        patientId: currentUser.id,
        date,
        time,
        reason: reason || 'General consultation'
    };
    
    const appointment = AppointmentStorage.create(appointmentData);
    
    if (appointment) {
        alert('Appointment booked successfully! The doctor will confirm your appointment.');
        closeModal('booking-modal');
        
        // Refresh appointments if on that tab
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab && activeTab.id === 'my-appointments') {
            loadPatientAppointments();
        }
    } else {
        alert('Failed to book appointment. Please try again.');
    }
}

/**
 * Check if time slot is available
 */
function isSlotAvailable(doctorId, date, time) {
    const doctor = UserStorage.getById(doctorId);
    if (!doctor || !doctor.availability) return false;
    
    // Get day of week
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Check if doctor is available on this day/time
    const isAvailable = doctor.availability.some(slot => 
        slot.day === dayOfWeek && slot.time === time && slot.available
    );
    
    if (!isAvailable) return false;
    
    // Check if slot is already booked
    const existingAppointments = AppointmentStorage.getByDoctor(doctorId);
    const isBooked = existingAppointments.some(apt => 
        apt.date === date && apt.time === time && apt.status !== 'cancelled'
    );
    
    return !isBooked;
}

/**
 * Load patient appointments
 */
function loadPatientAppointments() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const appointments = AppointmentStorage.getUpcoming(currentUser.id, 'patient');
    const container = document.getElementById('patient-appointments');
    
    if (!container) return;
    
    if (appointments.length === 0) {
        container.innerHTML = '<div class="text-center"><p>No upcoming appointments.</p></div>';
        return;
    }
    
    container.innerHTML = appointments.map(appointment => 
        createPatientAppointmentCard(appointment)
    ).join('');
}

/**
 * Load patient appointment history
 */
function loadPatientHistory() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const appointments = AppointmentStorage.getHistory(currentUser.id, 'patient');
    const container = document.getElementById('patient-history');
    
    if (!container) return;
    
    if (appointments.length === 0) {
        container.innerHTML = '<div class="text-center"><p>No appointment history.</p></div>';
        return;
    }
    
    container.innerHTML = appointments.map(appointment => 
        createPatientAppointmentCard(appointment, true)
    ).join('');
}

/**
 * Create patient appointment card
 */
function createPatientAppointmentCard(appointment, isHistory = false) {
    const doctor = UserStorage.getById(appointment.doctorId);
    if (!doctor) return '';
    
    const statusBadge = getStatusBadge(appointment.status);
    const canModify = !isHistory && appointment.status === 'pending';
    const canCancel = !isHistory && (appointment.status === 'pending' || appointment.status === 'confirmed');
    
    return `
        <div class="appointment-card">
            <div class="appointment-header">
                <div class="appointment-info">
                    <h4>Dr. ${doctor.name}</h4>
                    <div class="appointment-details">
                        <div><i class="fas fa-calendar"></i> ${formatDate(appointment.date)}</div>
                        <div><i class="fas fa-clock"></i> ${formatTime(appointment.time)}</div>
                        <div><i class="fas fa-stethoscope"></i> ${doctor.specialty}</div>
                        <div><i class="fas fa-map-marker-alt"></i> ${doctor.location}</div>
                        ${appointment.reason ? `<div><i class="fas fa-notes-medical"></i> ${appointment.reason}</div>` : ''}
                    </div>
                </div>
                ${statusBadge}
            </div>
            ${(canModify || canCancel) ? `
                <div class="appointment-actions">
                    ${canModify ? `<button class="btn btn-outline" onclick="rescheduleAppointment('${appointment.id}')">Reschedule</button>` : ''}
                    ${canCancel ? `<button class="btn btn-danger" onclick="cancelAppointment('${appointment.id}')">Cancel</button>` : ''}
                    ${appointment.status === 'confirmed' ? `<button class="btn btn-success" onclick="rateDoctor('${doctor.id}')">Rate Doctor</button>` : ''}
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Reschedule appointment
 */
function rescheduleAppointment(appointmentId) {
    const appointment = AppointmentStorage.getById(appointmentId);
    if (!appointment) return;
    
    const modal = document.getElementById('reschedule-modal');
    const form = document.getElementById('reschedule-form');
    
    // Store appointment ID
    form.dataset.appointmentId = appointmentId;
    
    // Populate time slots
    populateTimeSelect('reschedule-time');
    
    // Set minimum date
    const dateInput = document.getElementById('reschedule-date');
    dateInput.min = getMinDate();
    
    // Set up form submission
    form.onsubmit = handleRescheduleSubmission;
    
    showModal('reschedule-modal');
}

/**
 * Handle reschedule form submission
 */
function handleRescheduleSubmission(event) {
    event.preventDefault();
    
    const form = event.target;
    const appointmentId = form.dataset.appointmentId;
    const newDate = document.getElementById('reschedule-date').value;
    const newTime = document.getElementById('reschedule-time').value;
    
    if (!newDate || !newTime) {
        alert('Please select both date and time');
        return;
    }
    
    const appointment = AppointmentStorage.getById(appointmentId);
    if (!appointment) return;
    
    // Check if new slot is available
    if (!isSlotAvailable(appointment.doctorId, newDate, newTime)) {
        alert('This time slot is not available. Please choose another time.');
        return;
    }
    
    // Update appointment
    const updated = AppointmentStorage.update(appointmentId, {
        date: newDate,
        time: newTime,
        status: 'pending' // Reset to pending for doctor approval
    });
    
    if (updated) {
        alert('Appointment rescheduled successfully! The doctor will confirm the new time.');
        closeModal('reschedule-modal');
        loadPatientAppointments();
    } else {
        alert('Failed to reschedule appointment. Please try again.');
    }
}

/**
 * Cancel appointment
 */
function cancelAppointment(appointmentId) {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
        return;
    }
    
    const updated = AppointmentStorage.update(appointmentId, {
        status: 'cancelled'
    });
    
    if (updated) {
        alert('Appointment cancelled successfully.');
        loadPatientAppointments();
        loadPatientHistory();
    } else {
        alert('Failed to cancel appointment. Please try again.');
    }
}

/**
 * Rate doctor (simplified rating system)
 */
function rateDoctor(doctorId) {
    const rating = prompt('Rate this doctor (1-5 stars):');
    const numRating = parseFloat(rating);
    
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
        alert('Please enter a valid rating between 1 and 5.');
        return;
    }
    
    const doctor = UserStorage.getById(doctorId);
    if (!doctor) return;
    
    // Simple rating calculation (in a real app, you'd track all ratings)
    const currentRating = doctor.rating || 0;
    const newRating = currentRating > 0 ? (currentRating + numRating) / 2 : numRating;
    
    UserStorage.update(doctorId, { rating: newRating });
    
    alert('Thank you for your rating!');
    loadDoctorsGrid(); // Refresh to show updated rating
}

/**
 * View doctor profile (simplified)
 */
function viewDoctorProfile(doctorId) {
    const doctor = UserStorage.getById(doctorId);
    if (!doctor) return;
    
    const rating = doctor.rating || 0;
    const profileInfo = `
        Name: Dr. ${doctor.name}
        Specialty: ${doctor.specialty}
        Location: ${doctor.location}
        Rating: ${rating.toFixed(1)}/5 stars
        
        Bio: ${doctor.bio || 'No bio available'}
    `;
    
    alert(profileInfo);
}
