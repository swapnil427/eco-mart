// ===== AUTHENTICATION LOGIC =====

document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const showSignupLink = document.getElementById('showSignup');
    const showLoginLink = document.getElementById('showLogin');
    const loginFormElement = document.getElementById('loginFormElement');
    const signupFormElement = document.getElementById('signupFormElement');

    // Form switching
    if (showSignupLink) {
        showSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            showSignupForm();
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginForm();
        });
    }

    // Form submissions
    if (loginFormElement) {
        loginFormElement.addEventListener('submit', handleLogin);
    }

    if (signupFormElement) {
        signupFormElement.addEventListener('submit', handleSignup);
    }

    // Check if user is already authenticated
    auth.onAuthStateChanged((user) => {
        if (user && window.location.pathname.endsWith('index.html')) {
            // User is logged in, redirect to landing page
            window.location.href = 'landing.html';
        }
    });

    // Initialize password strength checker
    initPasswordStrength();
});

/**
 * Show signup form
 */
function showSignupForm() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (loginForm && signupForm) {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
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
    }
}

/**
 * Handle login form submission
 * @param {Event} e - Form submit event
 */
async function handleLogin(e) {
    e.preventDefault();
    
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
        
        // Sign in with Firebase Auth
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Get additional user data from Firestore
        const userDoc = await db.collection(COLLECTIONS.USERS).doc(user.uid).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            const completeUserData = {
                uid: user.uid,
                email: user.email,
                username: userData.username || 'User',
                displayName: user.displayName || userData.username || 'User',
                createdAt: userData.createdAt
            };
            
            saveCurrentUser(completeUserData);
        } else {
            // If no Firestore document exists, use Firebase Auth data
            const completeUserData = {
                uid: user.uid,
                email: user.email,
                username: user.displayName || 'User',
                displayName: user.displayName || 'User',
                createdAt: new Date()
            };
            
            saveCurrentUser(completeUserData);
        }

        showMessage('Login successful! Redirecting...', 'success');
        
        // Redirect to landing page
        setTimeout(() => {
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
                errorMessage = 'Incorrect password. Please try again.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many failed attempts. Please try again later.';
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
        
        // Create user with Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Update user profile
        await user.updateProfile({
            displayName: username
        });

        // Save additional user data to Firestore
        const userData = {
            uid: user.uid,
            username: username,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            profileComplete: false
        };

        await db.collection(COLLECTIONS.USERS).doc(user.uid).set(userData);

        // Save to localStorage
        saveCurrentUser({
            uid: user.uid,
            email: user.email,
            username: username,
            displayName: username,
            createdAt: new Date()
        });

        showMessage('Account created successfully! Redirecting...', 'success');
        
        // Redirect to landing page
        setTimeout(() => {
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
    
    if (!passwordInput) return;

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
        await auth.signOut();
        removeCurrentUser();
        showMessage('Logged out successfully', 'success');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Signout error:', error);
        showMessage('Error logging out', 'error');
    } finally {
        hideLoading();
    }
}

// Make signOut function globally available
window.signOut = signOut;