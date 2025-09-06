// ===== PRODUCT MANAGEMENT LOGIC WITH CLOUDINARY =====

let currentUser = null;
let selectedImageFile = null;
let isSubmitting = false;

document.addEventListener('DOMContentLoaded', function() {
    initializePage(handleUserAuthenticated);
    initializeEventListeners();
    populateCategories();
});

/**
 * Handle authenticated user
 * @param {Object} user - Firebase user object
 */
function handleUserAuthenticated(user) {
    currentUser = {
        uid: user.uid,
        email: user.email,
        username: user.displayName || user.email.split('@')[0]
    };
    console.log('User authenticated:', currentUser);
}

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
    const form = document.getElementById('addProductForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }

    // Image upload handling
    const imageUploadArea = document.getElementById('imageUploadArea');
    const imageInput = document.getElementById('productImage');
    const removeImageBtn = document.getElementById('removeImage');

    if (imageUploadArea && imageInput) {
        imageUploadArea.addEventListener('click', () => imageInput.click());
        imageUploadArea.addEventListener('dragover', handleDragOver);
        imageUploadArea.addEventListener('dragleave', handleDragLeave);
        imageUploadArea.addEventListener('drop', handleDrop);
        
        imageInput.addEventListener('change', handleImageSelect);
    }

    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', removeImage);
    }

    // Form validation
    const requiredInputs = document.querySelectorAll('input[required], textarea[required], select[required]');
    requiredInputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });

    // Character counter for description
    const descriptionTextarea = document.getElementById('productDescription');
    if (descriptionTextarea) {
        addCharacterCounter(descriptionTextarea, 1000);
    }

    // Price formatting
    const priceInput = document.getElementById('productPrice');
    if (priceInput) {
        priceInput.addEventListener('input', formatPriceInput);
    }
}

/**
 * Populate category dropdown
 */
function populateCategories() {
    const categorySelect = document.getElementById('productCategory');
    if (!categorySelect) return;

    // Clear existing options except the first one
    const firstOption = categorySelect.querySelector('option[value=""]');
    categorySelect.innerHTML = '';
    if (firstOption) {
        categorySelect.appendChild(firstOption);
    }

    // Add category options
    CATEGORIES.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
}

/**
 * Handle form submission with Cloudinary
 * @param {Event} e - Form submit event
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    console.log('Form submission started');
    console.log('Current user:', currentUser);
    
    if (!currentUser) {
        showMessage('Please log in to list a product', 'error');
        return;
    }
    
    if (!validateForm()) {
        showMessage('Please fix the errors in the form', 'error');
        return;
    }
    
    try {
        isSubmitting = true;
        showSubmitLoading(true);
        showLoading();
        
        // Get form data
        const formData = getFormData();
        console.log('Form data:', formData);
        
        // Upload image to Cloudinary if selected
        let imageUrl = null;
        if (selectedImageFile) {
            console.log('Uploading image to Cloudinary...');
            showMessage('Uploading image...', 'info');
            imageUrl = await uploadToCloudinary(selectedImageFile);
            console.log('Image uploaded successfully:', imageUrl);
            showMessage('Image uploaded successfully!', 'success');
        }
        async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
  formData.append('folder', 'ecofinds/products');
  
  try {
    console.log('Starting Cloudinary upload:', file.name, file.size);
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );
    
    console.log('Cloudinary response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudinary error response:', errorText);
      throw new Error(`Upload failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('Cloudinary API error:', data.error);
      throw new Error(data.error.message);
    }
    
    console.log('Cloudinary upload successful:', data.secure_url);
    return data.secure_url;
    
  } catch (error) {
    console.error('Cloudinary upload failed:', error);
    throw new Error('Failed to upload image: ' + error.message);
  }
}
        
        // Create product document
        const productData = {
            title: formData.title,
            description: formData.description,
            category: formData.category,
            price: parseFloat(formData.price),
            condition: formData.condition || 'Good',
            tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
            imageUrl: imageUrl,
            sellerId: currentUser.uid,
            sellerName: currentUser.username,
            status: 'available',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        console.log('Product data to save:', productData);
        
        // Save to Firestore
        showMessage('Saving product to database...', 'info');
        const docRef = await db.collection(COLLECTIONS.PRODUCTS).add(productData);
        console.log('Product saved with ID:', docRef.id);
        
        showMessage('Product listed successfully!', 'success');
        
        // Reset form
        resetForm();
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error adding product:', error);
        
        let errorMessage = 'Failed to list product. ';
        if (error.message.includes('Cloudinary') || error.message.includes('upload')) {
            errorMessage += 'Image upload failed. Please try a smaller image or check your internet connection.';
        } else if (error.code === 'permission-denied') {
            errorMessage += 'You do not have permission to create products. Check Firestore rules.';
        } else if (error.code === 'unavailable') {
            errorMessage += 'Service is currently unavailable. Please try again later.';
        } else {
            errorMessage += error.message || 'Please check your connection and try again.';
        }
        
        showMessage(errorMessage, 'error');
    } finally {
        isSubmitting = false;
        showSubmitLoading(false);
        hideLoading();
    }
}

/**
 * Get form data
 * @returns {Object} Form data object
 */
function getFormData() {
    return {
        title: document.getElementById('productTitle').value.trim(),
        category: document.getElementById('productCategory').value,
        description: document.getElementById('productDescription').value.trim(),
        price: document.getElementById('productPrice').value,
        condition: document.getElementById('productCondition').value,
        tags: document.getElementById('productTags').value.trim()
    };
}

/**
 * Reset form after successful submission
 */
function resetForm() {
    const form = document.getElementById('addProductForm');
    if (form) {
        form.reset();
    }
    
    // Reset image preview
    removeImage();
    
    // Clear any error states
    const errorElements = document.querySelectorAll('.error-text');
    errorElements.forEach(el => el.remove());
    
    const inputGroups = document.querySelectorAll('.input-group');
    inputGroups.forEach(group => {
        group.classList.remove('error', 'success');
    });
    
    // Reset character counter
    const charCounter = document.querySelector('.char-counter');
    if (charCounter) {
        charCounter.textContent = '0/1000';
        charCounter.classList.remove('warning', 'danger');
    }
}

/**
 * Validate entire form
 * @returns {boolean} True if form is valid
 */
function validateForm() {
    let isValid = true;
    
    const formData = getFormData();
    
    // Validate title
    if (!formData.title || formData.title.length < 5) {
        setFieldError('productTitle', 'Title must be at least 5 characters long');
        isValid = false;
    } else if (formData.title.length > 100) {
        setFieldError('productTitle', 'Title must be less than 100 characters');
        isValid = false;
    }
    
    // Validate category
    if (!formData.category) {
        setFieldError('productCategory', 'Please select a category');
        isValid = false;
    }
    
    // Validate description
    if (!formData.description || formData.description.length < 10) {
        setFieldError('productDescription', 'Description must be at least 10 characters long');
        isValid = false;
    } else if (formData.description.length > 1000) {
        setFieldError('productDescription', 'Description must be less than 1000 characters');
        isValid = false;
    }
    
    // Validate price
    const price = parseFloat(formData.price);
    if (!formData.price || isNaN(price) || price <= 0) {
        setFieldError('productPrice', 'Please enter a valid price greater than $0');
        isValid = false;
    } else if (price > 10000) {
        setFieldError('productPrice', 'Price cannot exceed $10,000');
        isValid = false;
    }
    
    // Validate terms acceptance
    const termsCheckbox = document.getElementById('acceptTerms');
    if (!termsCheckbox || !termsCheckbox.checked) {
        showMessage('Please accept the terms of service', 'error');
        isValid = false;
    }
    
    return isValid;
}

/**
 * Validate individual field
 * @param {Event} e - Blur event
 */
function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    
    clearFieldError(e);
    
    switch (field.id) {
        case 'productTitle':
            if (!value || value.length < 5) {
                setFieldError(field.id, 'Title must be at least 5 characters long');
            } else if (value.length > 100) {
                setFieldError(field.id, 'Title must be less than 100 characters');
            }
            break;
            
        case 'productDescription':
            if (!value || value.length < 10) {
                setFieldError(field.id, 'Description must be at least 10 characters long');
            } else if (value.length > 1000) {
                setFieldError(field.id, 'Description must be less than 1000 characters');
            }
            break;
            
        case 'productPrice':
            const price = parseFloat(value);
            if (!value || isNaN(price) || price <= 0) {
                setFieldError(field.id, 'Please enter a valid price greater than $0');
            } else if (price > 10000) {
                setFieldError(field.id, 'Price cannot exceed $10,000');
            }
            break;
            
        case 'productCategory':
            if (!value) {
                setFieldError(field.id, 'Please select a category');
            }
            break;
    }
}

/**
 * Set field error state and message
 * @param {string} fieldId - Field ID
 * @param {string} message - Error message
 */
function setFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    const inputGroup = field.closest('.input-group');
    if (!inputGroup) return;
    
    inputGroup.classList.add('error');
    inputGroup.classList.remove('success');
    
    // Remove existing error message
    const existingError = inputGroup.querySelector('.error-text');
    if (existingError) {
        existingError.remove();
    }
    
    // Add error message
    const errorElement = document.createElement('div');
    errorElement.className = 'error-text';
    errorElement.textContent = message;
    inputGroup.appendChild(errorElement);
}

/**
 * Clear field error state
 * @param {Event} e - Input event
 */
function clearFieldError(e) {
    const inputGroup = e.target.closest('.input-group');
    if (!inputGroup) return;
    
    inputGroup.classList.remove('error');
    
    const errorText = inputGroup.querySelector('.error-text');
    if (errorText) {
        errorText.remove();
    }
    
    // Add success state if field has value
    if (e.target.value.trim()) {
        inputGroup.classList.add('success');
    } else {
        inputGroup.classList.remove('success');
    }
}

/**
 * Add character counter to textarea
 * @param {HTMLElement} textarea - Textarea element
 * @param {number} maxLength - Maximum length
 */
function addCharacterCounter(textarea, maxLength) {
    const counter = document.createElement('div');
    counter.className = 'char-counter';
    textarea.parentNode.appendChild(counter);
    
    const updateCounter = () => {
        const current = textarea.value.length;
        const remaining = maxLength - current;
        
        counter.textContent = `${current}/${maxLength}`;
        
        counter.classList.remove('warning', 'danger');
        if (remaining < 50) {
            counter.classList.add('danger');
        } else if (remaining < 100) {
            counter.classList.add('warning');
        }
    };
    
    textarea.addEventListener('input', updateCounter);
    updateCounter(); // Initial update
}

/**
 * Format price input
 * @param {Event} e - Input event
 */
function formatPriceInput(e) {
    let value = e.target.value;
    
    // Remove non-numeric characters except decimal point
    value = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) {
        value = parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    e.target.value = value;
}

/**
 * Handle drag over event
 * @param {Event} e - Drag event
 */
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('dragover');
}

/**
 * Handle drag leave event
 * @param {Event} e - Drag event
 */
function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
}

/**
 * Handle drop event
 * @param {Event} e - Drop event
 */
function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleImageFile(files[0]);
    }
}

/**
 * Handle image selection
 * @param {Event} e - Change event
 */
function handleImageSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleImageFile(file);
    }
}

/**
 * Handle image file processing
 * @param {File} file - Selected image file
 */
async function handleImageFile(file) {
    console.log('Processing image file:', file.name, file.size, file.type);
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showMessage('Please select a valid image file', 'error');
        return;
    }
    
    // Validate file size (10MB limit for Cloudinary)
    if (file.size > 10 * 1024 * 1024) {
        showMessage('Image size must be less than 10MB', 'error');
        return;
    }
    
    try {
        showLoading();
        
        selectedImageFile = file;
        showImagePreview(file);
        showMessage('Image selected successfully!', 'success');
        
    } catch (error) {
        console.error('Error processing image:', error);
        showMessage('Error processing image. Please try another file.', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Show image preview
 * @param {File} file - Image file
 */
function showImagePreview(file) {
    const uploadArea = document.getElementById('imageUploadArea');
    const preview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    
    if (!uploadArea || !preview || !previewImg) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImg.src = e.target.result;
        uploadArea.style.display = 'none';
        preview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

/**
 * Remove selected image
 */
function removeImage() {
    selectedImageFile = null;
    
    const uploadArea = document.getElementById('imageUploadArea');
    const preview = document.getElementById('imagePreview');
    const imageInput = document.getElementById('productImage');
    
    if (uploadArea) uploadArea.style.display = 'block';
    if (preview) preview.classList.add('hidden');
    if (imageInput) imageInput.value = '';
    
    showMessage('Image removed', 'success');
}

/**
 * Show/hide submit loading state
 * @param {boolean} loading - Whether to show loading
 */
function showSubmitLoading(loading) {
    const submitBtn = document.querySelector('button[type="submit"]');
    if (!submitBtn) return;
    
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    if (loading) {
        submitBtn.disabled = true;
        if (btnText) btnText.classList.add('hidden');
        if (btnLoading) btnLoading.classList.remove('hidden');
    } else {
        submitBtn.disabled = false;
        if (btnText) btnText.classList.remove('hidden');
        if (btnLoading) btnLoading.classList.add('hidden');
    }
}
// Add this function for testing
async function testCloudinaryConnection() {
    try {
        // Create a tiny test image
        const canvas = document.createElement('canvas');
        canvas.width = 10;
        canvas.height = 10;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(0, 0, 10, 10);
        
        const blob = await new Promise(resolve => canvas.toBlob(resolve));
        const testUrl = await uploadToCloudinary(blob);
        
        console.log('Cloudinary test successful:', testUrl);
        showMessage('Cloudinary connection working!', 'success');
        
    } catch (error) {
        console.error('Cloudinary test failed:', error);
        showMessage('Cloudinary test failed: ' + error.message, 'error');
    }
}

// Call this function in your DOMContentLoaded event for testing

// Make functions globally available
window.removeImage = removeImage;