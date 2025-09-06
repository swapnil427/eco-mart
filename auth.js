// ===== AUTHENTICATION LOGIC =====

// Global flag to prevent unwanted redirects
let isLoginPageInitialized = false;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing authentication...');
    
    // Get DOM elements
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const showSignupLink = document.getElementById('showSignup');
    const showLoginLink = document.getElementById('showLogin');
    const loginFormElement = document.getElementById('loginFormElement');
    const signupFormElement = document.getElementById('signupFormElement');

    // Check if we're on the login page
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath.endsWith('index.html') || 
                       currentPath === '/' || 
                       currentPath.endsWith('/') ||
                       loginForm !== null; // If login form exists, we're on login page
    
    console.log('Current path:', currentPath);
    console.log('Is login page:', isLoginPage);
    console.log('Login form exists:', loginForm !== null);
    
    if (isLoginPage) {
        // We're on the login page - set up login functionality
        console.log('Setting up login page...');
        isLoginPageInitialized = true;
        
        // Clear any existing auth data to ensure clean state
        removeCurrentUser();
        
        // Form switching
        if (showSignupLink) {
            showSignupLink.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Switching to signup form');
                showSignupForm();
            });
        }

        if (showLoginLink) {
            showLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Switching to login form');
                showLoginForm();
            });
        }

        // Form submissions
        if (loginFormElement) {
            loginFormElement.addEventListener('submit', handleLogin);
            console.log('Login form handler attached');
        }

        if (signupFormElement) {
            signupFormElement.addEventListener('submit', handleSignup);
            console.log('Signup form handler attached');
        }

        // Initialize password strength checker
        initPasswordStrength();
        
        // IMPORTANT: Do NOT set up any auth state listeners on login page
        console.log('Login page setup complete - no auth listeners attached');
        
    } else {
        // We're on a protected page - set up auth protection
        console.log('Setting up protected page auth check...');
        setupProtectedPageAuth();
    }
});

/**
 * Setup authentication protection for non-login pages
 */
function setupProtectedPageAuth() {
    auth.onAuthStateChanged((user) => {
        if (!user) {
            console.log('User not authenticated on protected page, redirecting to login');
            window.location.href = 'index.html';
        } else {
            console.log('User authenticated on protected page:', user.email);
            // Save user data for the session
            saveCurrentUser({
                uid: user.uid,
                email: user.email,
                username: user.displayName || 'User',
                displayName: user.displayName || 'User'
            });
        }
    });
}

/**
 * Show signup form
 */
function showSignupForm() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (loginForm && signupForm) {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        console.log('Signup form shown');
    }
}

/**
 * Show login form
 */
function showLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (loginForm && signupForm) {
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        console.log('Login form shown');
    }
}

/**
 * Handle login form submission
 * @param {Event} e - Form submit event
 */
async function handleLogin(e) {
    e.preventDefault();
    console.log('Login form submitted');
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    // Validate inputs
    if (!email || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }

    try {
        showLoading();
        console.log('Attempting to sign in user:', email);
        
        // Sign in with Firebase Auth
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        console.log('Login successful for user:', user.email);

        // Prepare user data
        let completeUserData = {
            uid: user.uid,
            email: user.email,
            username: user.displayName || 'User',
            displayName: user.displayName || 'User',
            createdAt: new Date()
        };

        // Try to get additional user data from Firestore
        try {
            const userDoc = await db.collection(COLLECTIONS.USERS).doc(user.uid).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                completeUserData.username = userData.username || completeUserData.username;
                completeUserData.displayName = userData.username || completeUserData.displayName;
                if (userData.createdAt) {
                    completeUserData.createdAt = userData.createdAt.toDate();
                }
                console.log('User data retrieved from Firestore');
            }
        } catch (firestoreError) {
            console.warn('Could not fetch user data from Firestore:', firestoreError);
            // Continue with Firebase Auth data
        }

        // Save user data
        saveCurrentUser(completeUserData);

        showMessage('Login successful! Redirecting...', 'success');
        
        // Redirect to landing page after a short delay
        setTimeout(() => {
            console.log('Redirecting to landing page...');
            window.location.href = 'landing.html';
        }, 1500);

    } catch (error) {
        console.error('Login error:', error);
        
        let errorMessage = 'Login failed. Please try again.';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email address.';
                break;
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                errorMessage = 'Incorrect password. Please try again.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many failed attempts. Please try again later.';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Network error. Please check your internet connection.';
                break;
        }
        
        showMessage(errorMessage, 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Handle signup form submission
 * @param {Event} e - Form submit event
 */
async function handleSignup(e) {
    e.preventDefault();
    console.log('Signup form submitted');
    
    const username = document.getElementById('signupUsername').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;

    // Validate inputs
    if (!username || !email || !password || !confirmPassword) {
        showMessage('Please fill in all fields', 'error');
        return;
    }

    if (username.length < 3) {
        showMessage('Username must be at least 3 characters long', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
        showMessage(passwordValidation.messages.join('. '), 'error');
        return;
    }

    if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'error');
        return;
    }

    try {
        showLoading();
        console.log('Creating user account for:', email);
        
        // Create user with Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        console.log('User account created successfully:', user.email);

        // Update user profile
        await user.updateProfile({
            displayName: username
        });

        // Prepare user data for Firestore
        const userData = {
            uid: user.uid,
            username: username,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            profileComplete: false
        };

        // Try to save to Firestore
        try {
            await db.collection(COLLECTIONS.USERS).doc(user.uid).set(userData);
            console.log('User data saved to Firestore');
        } catch (firestoreError) {
            console.warn('Could not save to Firestore:', firestoreError);
            // Continue anyway - the auth account was created successfully
        }

        // Save to localStorage
        saveCurrentUser({
            uid: user.uid,
            email: user.email,
            username: username,
            displayName: username,
            createdAt: new Date()
        });

        showMessage('Account created successfully! Redirecting...', 'success');
        
        // Redirect to landing page after a short delay
        setTimeout(() => {
            console.log('Redirecting to landing page...');
            window.location.href = 'landing.html';
        }, 1500);

    } catch (error) {
        console.error('Signup error:', error);
        
        let errorMessage = 'Failed to create account. Please try again.';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'An account with this email already exists.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password is too weak. Please choose a stronger password.';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Network error. Please check your internet connection.';
                break;
        }
        
        showMessage(errorMessage, 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Initialize password strength checker
 */
function initPasswordStrength() {
    const passwordInput = document.getElementById('signupPassword');
    
    if (!passwordInput) {
        console.log('Password input not found, skipping strength checker');
        return;
    }

    console.log('Initializing password strength checker');

    // Create password strength indicator
    const strengthContainer = document.createElement('div');
    strengthContainer.className = 'password-strength';
    strengthContainer.innerHTML = `
        <div class="strength-bar">
            <div class="strength-fill"></div>
        </div>
        <div class="strength-text">Enter a password</div>
    `;
    
    passwordInput.parentNode.appendChild(strengthContainer);
    
    const strengthFill = strengthContainer.querySelector('.strength-fill');
    const strengthText = strengthContainer.querySelector('.strength-text');
    
    // Update strength on input
    passwordInput.addEventListener('input', debounce(() => {
        const password = passwordInput.value;
        
        if (!password) {
            strengthFill.className = 'strength-fill';
            strengthText.textContent = 'Enter a password';
            return;
        }
        
        const validation = validatePassword(password);
        strengthFill.className = `strength-fill ${validation.strength}`;
        
        switch (validation.strength) {
            case 'weak':
                strengthText.textContent = 'Weak password';
                break;
            case 'medium':
                strengthText.textContent = 'Good password';
                break;
            case 'strong':
                strengthText.textContent = 'Strong password';
                break;
        }
    }, 300));
}

/**
 * Sign out user
 */
async function signOut() {
    try {
        showLoading();
        console.log('Signing out user...');
        
        await auth.signOut();
        removeCurrentUser();
        
        showMessage('Logged out successfully', 'success');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        
    } catch (error) {
        console.error('Signout error:', error);
        showMessage('Error logging out', 'error');
    } finally {
        hideLoading();
    }
}

// Make signOut function globally available
window.signOut = signOut;

// Debug logging
console.log('Authentication script loaded successfully');