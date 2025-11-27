/**
 * Admin.js - Handles admin-specific functionality
 */

/**
 * Load admin dashboard
 */
function loadAdminDashboard() {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') return;
    
    // Load default tab (users)
    loadAdminUsers();
}

/**
 * Load all users for admin management
 */
function loadAdminUsers() {
    const users = UserStorage.getAll();
    const container = document.getElementById('admin-users-list');
    
    if (!container) return;
    
    if (users.length === 0) {
        container.innerHTML = '<div class="text-center"><p>No users found.</p></div>';
        return;
    }
    
    container.innerHTML = users.map(user => createUserCard(user)).join('');
}

/**
 * Create user card for admin view
 */
function createUserCard(user) {
    const currentUser = getCurrentUser();
    const canDelete = user.id !== currentUser.id; // Can't delete self
    
    return `
        <div class="user-card">
            <div class="user-info">
                <h4>${user.name}</h4>
                <div class="user-details">
                    <div><i class="fas fa-envelope"></i> ${user.email}</div>
                    <div><i class="fas fa-user-tag"></i> ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</div>
                    ${user.specialty ? `<div><i class="fas fa-stethoscope"></i> ${user.specialty}</div>` : ''}
                    ${user.location ? `<div><i class="fas fa-map-marker-alt"></i> ${user.location}</div>` : ''}
                    <div><i class="fas fa-calendar"></i> Joined: ${formatDate(user.createdAt)}</div>
                    <div><i class="fas fa-check-circle"></i> Status: ${user.approved ? 'Approved' : 'Pending'}</div>
                </div>
            </div>
            <div class="user-actions">
                ${user.role === 'doctor' && !user.approved ? `
                    <button class="btn btn-success" onclick="approveDoctor('${user.id}')">Approve</button>
                    <button class="btn btn-danger" onclick="rejectDoctor('${user.id}')">Reject</button>
                ` : ''}
                ${canDelete ? `
                    <button class="btn btn-danger" onclick="deleteUser('${user.id}')">Delete User</button>
                ` : ''}
            </div>
        </div>
    `;
}

/**
 * Load pending doctor approvals
 */
function loadAdminDoctors() {
    const pendingDoctors = UserStorage.getPendingDoctors();
    const container = document.getElementById('admin-doctors-list');
    
    if (!container) return;
    
    if (pendingDoctors.length === 0) {
        container.innerHTML = '<div class="text-center"><p>No pending doctor approvals.</p></div>';
        return;
    }
    
    container.innerHTML = pendingDoctors.map(doctor => createDoctorApprovalCard(doctor)).join('');
}

/**
 * Create doctor approval card
 */
function createDoctorApprovalCard(doctor) {
    return `
        <div class="user-card">
            <div class="user-info">
                <h4>Dr. ${doctor.name}</h4>
                <div class="user-details">
                    <div><i class="fas fa-envelope"></i> ${doctor.email}</div>
                    <div><i class="fas fa-stethoscope"></i> ${doctor.specialty}</div>
                    <div><i class="fas fa-map-marker-alt"></i> ${doctor.location}</div>
                    <div><i class="fas fa-calendar"></i> Applied: ${formatDate(doctor.createdAt)}</div>
                    ${doctor.bio ? `<div><i class="fas fa-info-circle"></i> ${doctor.bio}</div>` : ''}
                </div>
            </div>
            <div class="user-actions">
                <button class="btn btn-success" onclick="approveDoctor('${doctor.id}')">Approve</button>
                <button class="btn btn-danger" onclick="rejectDoctor('${doctor.id}')">Reject</button>
            </div>
        </div>
    `;
}

/**
 * Load all appointments for admin view
 */
function loadAdminAppointments() {
    const appointments = AppointmentStorage.getAll();
    const container = document.getElementById('admin-appointments-list');
    
    if (!container) return;
    
    if (appointments.length === 0) {
        container.innerHTML = '<div class="text-center"><p>No appointments found.</p></div>';
        return;
    }
    
    container.innerHTML = appointments.map(appointment => 
        createAdminAppointmentCard(appointment)
    ).join('');
}

/**
 * Create appointment card for admin view
 */
function createAdminAppointmentCard(appointment) {
    const doctor = UserStorage.getById(appointment.doctorId);
    const patient = UserStorage.getById(appointment.patientId);
    
    if (!doctor || !patient) return '';
    
    const statusBadge = getStatusBadge(appointment.status);
    
    return `
        <div class="appointment-card">
            <div class="appointment-header">
                <div class="appointment-info">
                    <h4>${patient.name} → Dr. ${doctor.name}</h4>
                    <div class="appointment-details">
                        <div><i class="fas fa-calendar"></i> ${formatDate(appointment.date)}</div>
                        <div><i class="fas fa-clock"></i> ${formatTime(appointment.time)}</div>
                        <div><i class="fas fa-stethoscope"></i> ${doctor.specialty}</div>
                        <div><i class="fas fa-map-marker-alt"></i> ${doctor.location}</div>
                        ${appointment.reason ? `<div><i class="fas fa-notes-medical"></i> ${appointment.reason}</div>` : ''}
                        <div><i class="fas fa-calendar-plus"></i> Booked: ${formatDate(appointment.createdAt)}</div>
                    </div>
                </div>
                ${statusBadge}
            </div>
            <div class="appointment-actions">
                <button class="btn btn-danger" onclick="deleteAppointment('${appointment.id}')">Delete</button>
                ${appointment.status === 'pending' ? `
                    <button class="btn btn-success" onclick="forceApproveAppointment('${appointment.id}')">Force Approve</button>
                ` : ''}
            </div>
        </div>
    `;
}

/**
 * Approve doctor account
 */
function approveDoctor(doctorId) {
    const updated = UserStorage.update(doctorId, { approved: true });
    
    if (updated) {
        alert('Doctor approved successfully!');
        loadAdminUsers();
        loadAdminDoctors();
    } else {
        alert('Failed to approve doctor. Please try again.');
    }
}

/**
 * Reject doctor account
 */
function rejectDoctor(doctorId) {
    if (!confirm('Are you sure you want to reject this doctor application? This will delete their account.')) {
        return;
    }
    
    UserStorage.delete(doctorId);
    alert('Doctor application rejected and account deleted.');
    loadAdminUsers();
    loadAdminDoctors();
}

/**
 * Delete user account
 */
function deleteUser(userId) {
    const user = UserStorage.getById(userId);
    if (!user) return;
    
    if (!confirm(`Are you sure you want to delete ${user.name}'s account? This action cannot be undone.`)) {
        return;
    }
    
    UserStorage.delete(userId);
    alert('User account deleted successfully.');
    loadAdminUsers();
}

/**
 * Delete appointment
 */
function deleteAppointment(appointmentId) {
    if (!confirm('Are you sure you want to delete this appointment?')) {
        return;
    }
    
    AppointmentStorage.delete(appointmentId);
    alert('Appointment deleted successfully.');
    loadAdminAppointments();
}

/**
 * Force approve appointment (admin override)
 */
function forceApproveAppointment(appointmentId) {
    const updated = AppointmentStorage.update(appointmentId, {
        status: 'confirmed'
    });
    
    if (updated) {
        alert('Appointment force approved!');
        loadAdminAppointments();
    } else {
        alert('Failed to approve appointment. Please try again.');
    }
}
