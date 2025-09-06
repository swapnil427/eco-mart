// ===== UTILITY FUNCTIONS =====

/**
 * Show loading overlay
 */
function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('hidden');
    }
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

/**
 * Show message to user
 * @param {string} message - Message text
 * @param {string} type - Message type: 'success', 'error', 'warning'
 * @param {number} duration - Auto-hide duration in milliseconds (default: 5000)
 */
function showMessage(message, type = 'success', duration = 5000) {
    const container = document.getElementById('messageContainer');
    const messageContent = document.getElementById('messageContent');
    
    if (container && messageContent) {
        messageContent.textContent = message;
        messageContent.className = `message ${type}`;
        container.classList.remove('hidden');
        
        // Auto-hide message
        setTimeout(() => {
            container.classList.add('hidden');
        }, duration);
    }
}

/**
 * Format date for display
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
    if (!date) return 'Unknown';
    
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Format price for display
 * @param {number} price - Price to format
 * @returns {string} Formatted price string
 */
function formatPrice(price) {
    if (typeof price !== 'number') return '$0.00';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(price);
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with strength and messages
 */
function validatePassword(password) {
    const result = {
        isValid: false,
        strength: 'weak',
        messages: []
    };
    
    if (password.length < 6) {
        result.messages.push('Password must be at least 6 characters long');
        return result;
    }
    
    let score = 0;
    
    // Check length
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Check for different character types
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    // Determine strength
    if (score < 3) {
        result.strength = 'weak';
        result.messages.push('Use a mix of letters, numbers, and special characters');
    } else if (score < 5) {
        result.strength = 'medium';
        result.isValid = true;
    } else {
        result.strength = 'strong';
        result.isValid = true;
    }
    
    return result;
}

/**
 * Debounce function calls
 * @param {function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {function} Debounced function
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
 * Generate unique ID
 * @returns {string} Unique ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Sanitize HTML to prevent XSS
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Get current user from localStorage
 * @returns {object|null} Current user data or null
 */
function getCurrentUser() {
    try {
        const userData = localStorage.getItem('currentUser');
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

/**
 * Save current user to localStorage
 * @param {object} user - User data to save
 */
function saveCurrentUser(user) {
    try {
        localStorage.setItem('currentUser', JSON.stringify(user));
    } catch (error) {
        console.error('Error saving current user:', error);
    }
}

/**
 * Remove current user from localStorage
 */
function removeCurrentUser() {
    try {
        localStorage.removeItem('currentUser');
    } catch (error) {
        console.error('Error removing current user:', error);
    }
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if user is authenticated
 */
function isAuthenticated() {
    return getCurrentUser() !== null;
}

/**
 * Redirect to login if not authenticated
 */
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

/**
 * Initialize page with authentication check for landing page
 * @param {function} callback - Callback function to run after auth check
 */
function initializeLandingPage(callback) {
    // Check authentication state
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
        // No user in localStorage, redirect to login
        window.location.href = 'index.html';
        return;
    }
    
    // If Firebase is available, also check Firebase auth
    if (typeof auth !== 'undefined') {
        auth.onAuthStateChanged((user) => {
            if (user) {
                // User is signed in, update stored user data
                const userData = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || currentUser.username || 'User',
                    username: user.displayName || currentUser.username || 'User'
                };
                saveCurrentUser(userData);
                if (callback) callback(userData);
            } else {
                // User is signed out, redirect to login
                removeCurrentUser();
                window.location.href = 'index.html';
            }
        });
    } else {
        // Firebase not available, use localStorage data
        if (callback) callback(currentUser);
    }
}

/**
 * Compress image file
 * @param {File} file - Image file to compress
 * @param {number} maxWidth - Maximum width
 * @param {number} quality - Compression quality (0-1)
 * @returns {Promise<Blob>} Compressed image blob
 */
function compressImage(file, maxWidth = 800, quality = 0.8) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            // Calculate new dimensions
            const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
            canvas.width = img.width * ratio;
            canvas.height = img.height * ratio;
            
            // Draw and compress
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(resolve, 'image/jpeg', quality);
        };
        
        img.src = URL.createObjectURL(file);
    });
}

/**
 * Handle file upload with validation
 * @param {File} file - File to validate
 * @returns {object} Validation result
 */
function validateImageFile(file) {
    const result = {
        isValid: true,
        error: null
    };
    
    // Define supported types (assuming APP_CONFIG is defined elsewhere)
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    // Check file type
    if (!supportedTypes.includes(file.type)) {
        result.isValid = false;
        result.error = 'Please select a valid image file (JPEG, PNG, or WebP)';
        return result;
    }
    
    // Check file size
    if (file.size > maxSize) {
        result.isValid = false;
        result.error = 'Image size must be less than 5MB';
        return result;
    }
    
    return result;
}

/**
 * Create image preview
 * @param {File} file - Image file
 * @param {HTMLElement} container - Container element for preview
 */
function createImagePreview(file, container) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.style.maxWidth = '100%';
        img.style.maxHeight = '200px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        container.innerHTML = '';
        container.appendChild(img);
    };
    reader.readAsDataURL(file);
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Search and highlight text
 * @param {string} text - Text to search in
 * @param {string} searchTerm - Search term
 * @returns {string} Text with highlighted search term
 */
function highlightSearchTerm(text, searchTerm) {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

/**
 * Get user's display name
 * @param {object} user - User object
 * @returns {string} Display name
 */
function getUserDisplayName(user) {
    if (!user) return 'Guest';
    return user.displayName || user.username || user.email?.split('@')[0] || 'User';
}

/**
 * Get user's first name
 * @param {object} user - User object
 * @returns {string} First name
 */
function getUserFirstName(user) {
    const displayName = getUserDisplayName(user);
    return displayName.split(' ')[0];
}

/**
 * Check if current time is within greeting hours
 * @returns {string} Greeting message
 */
function getTimeBasedGreeting() {
    const hour = new Date().getHours();
    
    if (hour < 12) {
        return 'Good morning';
    } else if (hour < 17) {
        return 'Good afternoon';
    } else {
        return 'Good evening';
    }
}

/**
 * Create personalized greeting
 * @param {object} user - User object
 * @returns {string} Personalized greeting
 */
function createPersonalizedGreeting(user) {
    const timeGreeting = getTimeBasedGreeting();
    const firstName = getUserFirstName(user);
    return `${timeGreeting}, ${firstName}!`;
}

// Export functions for use in other scripts
window.EcoFindsUtils = {
    showLoading,
    hideLoading,
    showMessage,
    formatDate,
    formatPrice,
    isValidEmail,
    validatePassword,
    debounce,
    generateId,
    sanitizeHTML,
    getCurrentUser,
    saveCurrentUser,
    removeCurrentUser,
    isAuthenticated,
    requireAuth,
    initializeLandingPage,
    compressImage,
    validateImageFile,
    createImagePreview,
    formatFileSize,
    truncateText,
    highlightSearchTerm,
    getUserDisplayName,
    getUserFirstName,
    getTimeBasedGreeting,
    createPersonalizedGreeting
};