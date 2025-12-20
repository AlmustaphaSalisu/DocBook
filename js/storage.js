/**
 * Storage.js - Handles all localStorage operations and data management
 */

// Storage keys
const STORAGE_KEYS = {
    USERS: 'docbook_users',
    APPOINTMENTS: 'docbook_appointments',
    CURRENT_USER: 'docbook_current_user',
    INITIALIZED: 'docbook_initialized'
};

/**
 * Initialize the application with sample data if first run
 */
function initializeApp() {
    if (!localStorage.getItem(STORAGE_KEYS.INITIALIZED)) {
        // Create sample users
        const sampleUsers = [
            {
                id: generateId(),
                name: 'John Patient',
                email: 'patient@example.com',
                passwordHash: hashPassword('password123'),
                role: 'patient',
                approved: true,
                createdAt: new Date().toISOString()
            },
            {
                id: generateId(),
                name: 'Dr. Sarah Wilson',
                email: 'doctor@example.com',
                passwordHash: hashPassword('password123'),
                role: 'doctor',
                specialty: 'Cardiology',
                location: 'New York, NY',
                bio: 'Experienced cardiologist with 15 years of practice. Specializing in heart disease prevention and treatment.',
                approved: true,
                rating: 4.8,
                availability: generateSampleAvailability(),
                createdAt: new Date().toISOString()
            },
            {
                id: generateId(),
                name: 'Dr. Michael Chen',
                email: 'doctor2@example.com',
                passwordHash: hashPassword('password123'),
                role: 'doctor',
                specialty: 'Dermatology',
                location: 'Los Angeles, CA',
                bio: 'Board-certified dermatologist focusing on skin cancer prevention and cosmetic dermatology.',
                approved: true,
                rating: 4.9,
                availability: generateSampleAvailability(),
                createdAt: new Date().toISOString()
            },
            {
                id: generateId(),
                name: 'Dr. Emily Rodriguez',
                email: 'doctor3@example.com',
                passwordHash: hashPassword('password123'),
                role: 'doctor',
                specialty: 'Pediatrics',
                location: 'Chicago, IL',
                bio: 'Pediatrician dedicated to providing comprehensive care for children from infancy through adolescence.',
                approved: true,
                rating: 4.7,
                availability: generateSampleAvailability(),
                createdAt: new Date().toISOString()
            },
            {
                id: generateId(),
                name: 'Admin User',
                email: 'admin@docbook.com',
                passwordHash: hashPassword('Admin123'),
                role: 'admin',
                approved: true,
                createdAt: new Date().toISOString()
            }
        ];

        // Create sample appointments
        const sampleAppointments = [
            {
                id: generateId(),
                doctorId: sampleUsers[1].id, // Dr. Sarah Wilson
                patientId: sampleUsers[0].id, // John Patient
                date: getDateString(7), // 7 days from now
                time: '10:00',
                status: 'confirmed',
                reason: 'Regular checkup',
                createdAt: new Date().toISOString()
            },
            {
                id: generateId(),
                doctorId: sampleUsers[2].id, // Dr. Michael Chen
                patientId: sampleUsers[0].id, // John Patient
                date: getDateString(14), // 14 days from now
                time: '14:30',
                status: 'pending',
                reason: 'Skin consultation',
                createdAt: new Date().toISOString()
            }
        ];

        // Save to localStorage
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(sampleUsers));
        localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(sampleAppointments));
        localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    } else {
        // Check if admin user needs to be updated (for credential changes)
        updateAdminCredentials();
    }
}

/**
 * Update admin credentials if they have changed
 */
function updateAdminCredentials() {
    const users = UserStorage.getAll();
    const adminUser = users.find(user => user.role === 'admin');
    
    if (adminUser) {
        // Check if admin email needs to be updated
        if (adminUser.email !== 'admin@docbook.com') {
            UserStorage.update(adminUser.id, {
                email: 'admin@docbook.com',
                passwordHash: hashPassword('Admin123')
            });
            console.log('Admin credentials updated to admin@docbook.com');
        }
    } else {
        // Create admin user if it doesn't exist
        const newAdmin = {
            id: generateId(),
            name: 'Admin User',
            email: 'admin@docbook.com',
            passwordHash: hashPassword('Admin123'),
            role: 'admin',
            approved: true,
            createdAt: new Date().toISOString()
        };
        
        users.push(newAdmin);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        console.log('Admin user created with email: admin@docbook.com');
    }
}

/**
 * Generate a unique ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Simple password hashing (for demo purposes - in production use proper hashing)
 */
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
}

/**
 * Generate sample availability for doctors
 */
function generateSampleAvailability() {
    const availability = [];
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
    
    days.forEach(day => {
        times.forEach(time => {
            availability.push({ day, time, available: true });
        });
    });
    
    return availability;
}

/**
 * Get date string for future dates
 */
function getDateString(daysFromNow) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
}

/**
 * User management functions
 */
const UserStorage = {
    getAll: () => {
        const users = localStorage.getItem(STORAGE_KEYS.USERS);
        return users ? JSON.parse(users) : [];
    },

    getById: (id) => {
        const users = UserStorage.getAll();
        return users.find(user => user.id === id);
    },

    getByEmail: (email) => {
        const users = UserStorage.getAll();
        return users.find(user => user.email === email);
    },

    create: (userData) => {
        const users = UserStorage.getAll();
        const newUser = {
            id: generateId(),
            ...userData,
            passwordHash: hashPassword(userData.password),
            approved: userData.role === 'patient' || userData.role === 'admin',
            createdAt: new Date().toISOString()
        };
        delete newUser.password;
        
        if (newUser.role === 'doctor') {
            newUser.rating = 0;
            newUser.availability = generateSampleAvailability();
        }
        
        users.push(newUser);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        return newUser;
    },

    update: (id, updates) => {
        const users = UserStorage.getAll();
        const index = users.findIndex(user => user.id === id);
        if (index !== -1) {
            users[index] = { ...users[index], ...updates };
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
            return users[index];
        }
        return null;
    },

    delete: (id) => {
        const users = UserStorage.getAll();
        const filteredUsers = users.filter(user => user.id !== id);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filteredUsers));
        
        // Also delete related appointments
        const appointments = AppointmentStorage.getAll();
        const filteredAppointments = appointments.filter(
            apt => apt.doctorId !== id && apt.patientId !== id
        );
        localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(filteredAppointments));
    },

    getDoctors: () => {
        const users = UserStorage.getAll();
        return users.filter(user => user.role === 'doctor');
    },

    getApprovedDoctors: () => {
        const users = UserStorage.getAll();
        return users.filter(user => user.role === 'doctor' && user.approved);
    },

    getPendingDoctors: () => {
        const users = UserStorage.getAll();
        return users.filter(user => user.role === 'doctor' && !user.approved);
    }
};

/**
 * Appointment management functions
 */
const AppointmentStorage = {
    getAll: () => {
        const appointments = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
        return appointments ? JSON.parse(appointments) : [];
    },

    getById: (id) => {
        const appointments = AppointmentStorage.getAll();
        return appointments.find(apt => apt.id === id);
    },

    getByPatient: (patientId) => {
        const appointments = AppointmentStorage.getAll();
        return appointments.filter(apt => apt.patientId === patientId);
    },

    getByDoctor: (doctorId) => {
        const appointments = AppointmentStorage.getAll();
        return appointments.filter(apt => apt.doctorId === doctorId);
    },

    create: (appointmentData) => {
        const appointments = AppointmentStorage.getAll();
        const newAppointment = {
            id: generateId(),
            ...appointmentData,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        appointments.push(newAppointment);
        localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
        return newAppointment;
    },

    update: (id, updates) => {
        const appointments = AppointmentStorage.getAll();
        const index = appointments.findIndex(apt => apt.id === id);
        if (index !== -1) {
            appointments[index] = { ...appointments[index], ...updates };
            localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
            return appointments[index];
        }
        return null;
    },

    delete: (id) => {
        const appointments = AppointmentStorage.getAll();
        const filteredAppointments = appointments.filter(apt => apt.id !== id);
        localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(filteredAppointments));
    },

    getUpcoming: (userId, role) => {
        const appointments = AppointmentStorage.getAll();
        const today = new Date().toISOString().split('T')[0];
        
        return appointments.filter(apt => {
            const isUserAppointment = role === 'patient' ? 
                apt.patientId === userId : apt.doctorId === userId;
            return isUserAppointment && apt.date >= today && apt.status !== 'cancelled';
        });
    },

    getHistory: (userId, role) => {
        const appointments = AppointmentStorage.getAll();
        const today = new Date().toISOString().split('T')[0];
        
        return appointments.filter(apt => {
            const isUserAppointment = role === 'patient' ? 
                apt.patientId === userId : apt.doctorId === userId;
            return isUserAppointment && (apt.date < today || apt.status === 'completed' || apt.status === 'cancelled');
        });
    }
};

/**
 * Current user session management
 */
const SessionStorage = {
    setCurrentUser: (user) => {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    },

    getCurrentUser: () => {
        const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        return user ? JSON.parse(user) : null;
    },

    clearCurrentUser: () => {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    },

    isLoggedIn: () => {
        return SessionStorage.getCurrentUser() !== null;
    }
};

/**
 * Search and filter functions
 */
const SearchUtils = {
    searchDoctors: (query, specialty, location) => {
        const doctors = UserStorage.getApprovedDoctors();
        
        return doctors.filter(doctor => {
            const matchesQuery = !query || 
                doctor.name.toLowerCase().includes(query.toLowerCase()) ||
                doctor.specialty.toLowerCase().includes(query.toLowerCase()) ||
                doctor.location.toLowerCase().includes(query.toLowerCase());
            
            const matchesSpecialty = !specialty || doctor.specialty === specialty;
            const matchesLocation = !location || 
                doctor.location.toLowerCase().includes(location.toLowerCase());
            
            return matchesQuery && matchesSpecialty && matchesLocation;
        });
    }
};

/**
 * Force refresh sample data (useful when credentials change)
 */
function forceRefreshSampleData() {
    // Clear existing data
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.APPOINTMENTS);
    localStorage.removeItem(STORAGE_KEYS.INITIALIZED);
    
    // Reinitialize with fresh data
    initializeApp();
    
    console.log('Sample data refreshed with updated credentials');
}

// Initialize app on load
document.addEventListener('DOMContentLoaded', initializeApp);
