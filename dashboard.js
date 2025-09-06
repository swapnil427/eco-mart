// ===== DASHBOARD FUNCTIONALITY WITH CLOUDINARY SUPPORT =====

let currentUser = null;
let products = [];
let filteredProducts = [];
let currentPage = 1;
let isLoading = false;
let searchTimeout = null;

document.addEventListener('DOMContentLoaded', function() {
    initializePage(handleUserAuthenticated);
    initializeEventListeners();
    updateCartCount();
});

/**
 * Handle authenticated user
 * @param {Object} user - Firebase user object
 */
function handleUserAuthenticated(user) {
    currentUser = getCurrentUser();
    if (currentUser) {
        console.log('User authenticated:', currentUser);
        updateUserDisplay();
        loadProducts();
        updateCartCount();
    }
}

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }

    // View toggle
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', handleViewToggle);
    });

    // Sort functionality
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', handleSort);
    }

    // Price filters
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');
    
    if (minPriceInput) {
        minPriceInput.addEventListener('input', debounce(handlePriceFilter, 300));
    }
    
    if (maxPriceInput) {
        maxPriceInput.addEventListener('input', debounce(handlePriceFilter, 300));
    }

    // Load more button
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreProducts);
    }

    // Quick view modal
    const closeQuickView = document.getElementById('closeQuickView');
    const quickViewModal = document.getElementById('quickViewModal');
    
    if (closeQuickView) {
        closeQuickView.addEventListener('click', closeQuickViewModal);
    }
    
    if (quickViewModal) {
        quickViewModal.addEventListener('click', (e) => {
            if (e.target === quickViewModal) {
                closeQuickViewModal();
            }
        });
    }

    // Initialize category filters
    initializeCategoryFilters();
}

/**
 * Update user display
 */
function updateUserDisplay() {
    const userNameElement = document.getElementById('userName');
    if (userNameElement && currentUser) {
        userNameElement.textContent = currentUser.username || currentUser.displayName || 'User';
    }
}

/**
 * Initialize category filters
 */
function initializeCategoryFilters() {
    const categoryFilters = document.getElementById('categoryFilters');
    const categorySelect = document.getElementById('categoryFilter');
    
    // Handle button-style category filters
    if (categoryFilters) {
        // Clear existing filters except "All"
        const allButton = categoryFilters.querySelector('[data-category="all"]');
        categoryFilters.innerHTML = '';
        
        // Add "All" button
        const allBtn = document.createElement('button');
        allBtn.className = 'filter-btn active';
        allBtn.textContent = 'All';
        allBtn.setAttribute('data-category', 'all');
        allBtn.addEventListener('click', handleCategoryFilter);
        categoryFilters.appendChild(allBtn);

        // Add category buttons
        CATEGORIES.forEach(category => {
            const button = document.createElement('button');
            button.className = 'filter-btn';
            button.textContent = category;
            button.setAttribute('data-category', category.toLowerCase().replace(/\s+/g, '-'));
            button.addEventListener('click', handleCategoryFilter);
            categoryFilters.appendChild(button);
        });
    }
    
    // Handle select-style category filter
    if (categorySelect) {
        // Clear existing options
        categorySelect.innerHTML = '';
        
        // Add "All Categories" option
        const allOption = document.createElement('option');
        allOption.value = '';
        allOption.textContent = 'All Categories';
        categorySelect.appendChild(allOption);
        
        // Add category options
        CATEGORIES.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
        
        categorySelect.addEventListener('change', handleCategoryFilter);
    }
}

/**
 * Load products from Firestore
 */
async function loadProducts() {
    try {
        showLoading();
        console.log('Loading products...');
        
        const query = db.collection(COLLECTIONS.PRODUCTS)
            .where('status', '==', 'available')
            .orderBy('createdAt', 'desc')
            .limit(APP_CONFIG.PRODUCTS_PER_PAGE || 12);
            
        const snapshot = await query.get();
        
        products = [];
        snapshot.forEach(doc => {
            products.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log('Loaded products:', products.length);
        filteredProducts = [...products];
        displayProducts();
        updateResultsCount();
        
    } catch (error) {
        console.error('Error loading products:', error);
        showMessage('Failed to load products. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Display products in the grid
 */
function displayProducts() {
    const productsGrid = document.getElementById('productsGrid') || document.getElementById('productGrid');
    const emptyState = document.getElementById('emptyState') || document.getElementById('noProducts');
    
    if (!productsGrid) {
        console.error('Product grid element not found');
        return;
    }

    if (filteredProducts.length === 0) {
        productsGrid.classList.add('hidden');
        productsGrid.style.display = 'none';
        if (emptyState) {
            emptyState.classList.remove('hidden');
            emptyState.style.display = 'block';
        }
        return;
    }
    
    productsGrid.classList.remove('hidden');
    productsGrid.style.display = 'grid';
    if (emptyState) {
        emptyState.classList.add('hidden');
        emptyState.style.display = 'none';
    }
    
    productsGrid.innerHTML = '';
    
    filteredProducts.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
}

/**
 * Create product card element with Cloudinary support
 * @param {Object} product - Product data
 * @returns {HTMLElement} Product card element
 */
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('data-product-id', product.id);
    
    // Handle Cloudinary image URL with optimization
    let imageHtml;
    if (product.imageUrl) {
        let optimizedImageUrl = product.imageUrl;
        if (product.imageUrl.includes('cloudinary.com')) {
            // Add Cloudinary transformations for better performance
            optimizedImageUrl = product.imageUrl.replace('/upload/', '/upload/w_400,h_300,c_fill,q_auto,f_auto/');
        }
        imageHtml = `<img src="${optimizedImageUrl}" alt="${sanitizeHTML(product.title)}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'product-placeholder\\'><div class=\\'placeholder-icon\\'>📦</div><span>No Image</span></div>';">`;
    } else {
        imageHtml = `<div class="product-placeholder"><div class="placeholder-icon">📦</div><span>No Image</span></div>`;
    }
    
    const sellerInitial = product.sellerName ? product.sellerName.charAt(0).toUpperCase() : 'U';
    
    card.innerHTML = `
        <div class="product-status available">Available</div>
        <div class="product-image">
            ${imageHtml}
            ${product.condition ? `<span class="condition-badge">${sanitizeHTML(product.condition)}</span>` : ''}
        </div>
        <div class="product-info">
            <h3 class="product-title">${sanitizeHTML(product.title)}</h3>
            <div class="product-price">${formatPrice(product.price)}</div>
            <div class="product-category">${sanitizeHTML(product.category)}</div>
            <p class="product-description">${truncateText(sanitizeHTML(product.description), 80)}</p>
            <div class="product-actions">
                <button class="btn btn-primary btn-small add-to-cart-btn" data-product-id="${product.id}">
                    Add to Cart
                </button>
                <button class="btn btn-secondary btn-small view-details-btn" data-product-id="${product.id}">
                    Quick View
                </button>
            </div>
            <div class="seller-info">
                <div class="seller-avatar">${sellerInitial}</div>
                <span>by ${sanitizeHTML(product.sellerName || 'Unknown Seller')}</span>
            </div>
            <div class="product-date">${formatDate(product.createdAt?.toDate ? product.createdAt.toDate() : product.createdAt)}</div>
        </div>
    `;
    
    // Add event listeners
    const addToCartBtn = card.querySelector('.add-to-cart-btn');
    const viewDetailsBtn = card.querySelector('.view-details-btn');
    
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            addToCart(product.id);
        });
    }
    
    if (viewDetailsBtn) {
        viewDetailsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showQuickView(product.id);
        });
    }
    
    // Add click handler for product details
    card.addEventListener('click', (e) => {
        // Don't navigate if clicking on buttons
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
            return;
        }
        window.location.href = `product-detail.html?id=${product.id}`;
    });
    
    return card;
}

/**
 * Handle search functionality
 */
function handleSearch() {
    clearTimeout(searchTimeout);
    
    searchTimeout = setTimeout(() => {
        applyAllFilters();
    }, 300);
}

/**
 * Handle category filtering
 * @param {Event} e - Click event
 */
function handleCategoryFilter(e) {
    e.preventDefault();
    
    // Handle button-style filters
    if (e.target.classList.contains('filter-btn')) {
        // Update active state
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');
    }
    
    applyAllFilters();
}

/**
 * Handle price filtering
 */
function handlePriceFilter() {
    applyAllFilters();
}

/**
 * Apply all filters (search, category, price)
 */
function applyAllFilters() {
    const searchTerm = document.getElementById('searchInput')?.value?.trim().toLowerCase() || '';
    
    // Get selected category from either button or select
    let selectedCategory = '';
    const activeCategoryBtn = document.querySelector('.filter-btn.active');
    const categorySelect = document.getElementById('categoryFilter');
    
    if (activeCategoryBtn) {
        const categoryData = activeCategoryBtn.getAttribute('data-category');
        if (categoryData !== 'all') {
            selectedCategory = CATEGORIES.find(cat => 
                cat.toLowerCase().replace(/\s+/g, '-') === categoryData
            ) || '';
        }
    } else if (categorySelect) {
        selectedCategory = categorySelect.value;
    }
    
    // Get price range
    const minPrice = parseFloat(document.getElementById('minPrice')?.value) || 0;
    const maxPrice = parseFloat(document.getElementById('maxPrice')?.value) || Infinity;
    
    // Apply filters
    filteredProducts = products.filter(product => {
        const matchesSearch = !searchTerm || 
            product.title.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm) ||
            (product.tags && product.tags.some(tag => tag.toLowerCase().includes(searchTerm)));
        
        const matchesCategory = !selectedCategory || product.category === selectedCategory;
        const matchesPrice = product.price >= minPrice && product.price <= maxPrice;
        
        return matchesSearch && matchesCategory && matchesPrice;
    });
    
    displayProducts();
    updateResultsCount();
}

/**
 * Handle view toggle (grid/list)
 * @param {Event} e - Click event
 */
function handleViewToggle(e) {
    e.preventDefault();
    
    // Update active state
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');
    
    const view = e.target.getAttribute('data-view');
    const productsGrid = document.getElementById('productsGrid') || document.getElementById('productGrid');
    
    if (view === 'list') {
        productsGrid.classList.add('list-view');
        productsGrid.className = productsGrid.className.replace('grid-4', 'grid-1');
    } else {
        productsGrid.classList.remove('list-view');
        productsGrid.className = productsGrid.className.replace('grid-1', 'grid-4');
    }
}

/**
 * Handle sorting
 */
function handleSort() {
    const sortValue = document.getElementById('sortSelect')?.value || 'newest';
    
    switch (sortValue) {
        case 'newest':
            filteredProducts.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                return dateB - dateA;
            });
            break;
        case 'oldest':
            filteredProducts.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                return dateA - dateB;
            });
            break;
        case 'price-low':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'title':
            filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
            break;
    }
    
    displayProducts();
}

/**
 * Update results count display
 */
function updateResultsCount() {
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
        const count = filteredProducts.length;
        const total = products.length;
        resultsCount.textContent = `Showing ${count} of ${total} products`;
    }
}

/**
 * Add product to cart
 * @param {string} productId - Product ID to add to cart
 */
async function addToCart(productId) {
    if (!currentUser) {
        showMessage('Please log in to add items to cart', 'error');
        return;
    }
    
    try {
        const product = filteredProducts.find(p => p.id === productId) || products.find(p => p.id === productId);
        if (!product) {
            showMessage('Product not found', 'error');
            return;
        }
        
        // Check if product is user's own product
        if (product.sellerId === currentUser.uid) {
            showMessage('You cannot add your own product to cart', 'warning');
            return;
        }
        
        showLoading();
        
        // Try Firestore first, fallback to localStorage
        try {
            // Add to cart in Firestore
            const cartRef = db.collection(COLLECTIONS.CARTS).doc(currentUser.uid);
            const cartDoc = await cartRef.get();
            
            let cartItems = [];
            if (cartDoc.exists) {
                cartItems = cartDoc.data().items || [];
            }
            
            // Check if item already in cart
            const existingItemIndex = cartItems.findIndex(item => item.productId === productId);
            
            if (existingItemIndex >= 0) {
                cartItems[existingItemIndex].quantity += 1;
            } else {
                cartItems.push({
                    productId: productId,
                    quantity: 1,
                    addedAt: new Date()
                });
            }
            
            await cartRef.set({
                userId: currentUser.uid,
                items: cartItems,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (firestoreError) {
            console.log('Firestore cart failed, using localStorage:', firestoreError);
            
            // Fallback to localStorage
            let cart = JSON.parse(localStorage.getItem('cart') || '[]');
            
            // Check if product already in cart
            const existingIndex = cart.findIndex(item => item.id === productId);
            
            if (existingIndex >= 0) {
                showMessage('Product is already in your cart', 'warning');
                return;
            }
            
            // Add product to cart
            cart.push({
                id: product.id,
                title: product.title,
                price: product.price,
                imageUrl: product.imageUrl,
                sellerId: product.sellerId,
                sellerName: product.sellerName,
                quantity: 1,
                addedAt: new Date().toISOString()
            });
            
            localStorage.setItem('cart', JSON.stringify(cart));
        }
        
        showMessage('Product added to cart!', 'success');
        updateCartCount();
        
    } catch (error) {
        console.error('Error adding to cart:', error);
        showMessage('Failed to add product to cart', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Update cart count display
 */
async function updateCartCount() {
    if (!currentUser) {
        // Update from localStorage for non-authenticated users
        const cartCountElement = document.getElementById('cartCount');
        const mobileCartCount = document.getElementById('mobileCartCount');
        
        if (cartCountElement || mobileCartCount) {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const count = cart.length;
            
            if (cartCountElement) cartCountElement.textContent = count;
            if (mobileCartCount) mobileCartCount.textContent = count;
        }
        return;
    }
    
    try {
        // Try Firestore first
        const cartDoc = await db.collection(COLLECTIONS.CARTS).doc(currentUser.uid).get();
        
        let totalItems = 0;
        if (cartDoc.exists) {
            const cartData = cartDoc.data();
            totalItems = cartData.items ? cartData.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
        }
        
        // Update both desktop and mobile cart counts
        const cartCount = document.getElementById('cartCount');
        const mobileCartCount = document.getElementById('mobileCartCount');
        
        if (cartCount) cartCount.textContent = totalItems;
        if (mobileCartCount) mobileCartCount.textContent = totalItems;
        
    } catch (error) {
        console.error('Error updating cart count from Firestore, using localStorage:', error);
        
        // Fallback to localStorage
        const cartCountElement = document.getElementById('cartCount');
        const mobileCartCount = document.getElementById('mobileCartCount');
        
        if (cartCountElement || mobileCartCount) {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const count = cart.length;
            
            if (cartCountElement) cartCountElement.textContent = count;
            if (mobileCartCount) mobileCartCount.textContent = count;
        }
    }
}

/**
 * Show quick view modal
 * @param {string} productId - Product ID to show
 */
function showQuickView(productId) {
    const product = filteredProducts.find(p => p.id === productId) || products.find(p => p.id === productId);
    if (!product) return;
    
    const modal = document.getElementById('quickViewModal');
    const content = document.getElementById('quickViewContent');
    
    if (!modal || !content) return;
    
    // Handle Cloudinary image URL with optimization
    let imageHtml;
    if (product.imageUrl) {
        let optimizedImageUrl = product.imageUrl;
        if (product.imageUrl.includes('cloudinary.com')) {
            optimizedImageUrl = product.imageUrl.replace('/upload/', '/upload/w_500,h_400,c_fill,q_auto,f_auto/');
        }
        imageHtml = `<img src="${optimizedImageUrl}" alt="${sanitizeHTML(product.title)}" onerror="this.parentElement.innerHTML='<div class=\\'placeholder-icon\\'>📦</div>';">`;
    } else {
        imageHtml = `<div class="placeholder-icon">📦</div>`;
    }
    
    content.innerHTML = `
        <div class="quick-view-image">
            ${imageHtml}
        </div>
        <div class="quick-view-details">
            <div class="detail-row">
                <span class="detail-label">Title:</span>
                <span class="detail-value">${sanitizeHTML(product.title)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Price:</span>
                <span class="detail-value">${formatPrice(product.price)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Category:</span>
                <span class="detail-value">${sanitizeHTML(product.category)}</span>
            </div>
            ${product.condition ? `
            <div class="detail-row">
                <span class="detail-label">Condition:</span>
                <span class="detail-value">${sanitizeHTML(product.condition)}</span>
            </div>` : ''}
            <div class="detail-row">
                <span class="detail-label">Seller:</span>
                <span class="detail-value">${sanitizeHTML(product.sellerName || 'Unknown')}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Posted:</span>
                <span class="detail-value">${formatDate(product.createdAt?.toDate ? product.createdAt.toDate() : product.createdAt)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Description:</span>
                <span class="detail-value">${sanitizeHTML(product.description)}</span>
            </div>
            <div class="mt-3">
                <button class="btn btn-primary" onclick="addToCart('${product.id}'); closeQuickViewModal();">
                    Add to Cart
                </button>
                <button class="btn btn-secondary" onclick="window.location.href='product-detail.html?id=${product.id}'">
                    View Details
                </button>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
    modal.style.display = 'flex';
}

/**
 * Close quick view modal
 */
function closeQuickViewModal() {
    const modal = document.getElementById('quickViewModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
}

/**
 * Load more products (pagination)
 */
async function loadMoreProducts() {
    if (isLoading || products.length === 0) return;
    
    try {
        isLoading = true;
        showLoading();
        
        const lastProduct = products[products.length - 1];
        const query = db.collection(COLLECTIONS.PRODUCTS)
            .where('status', '==', 'available')
            .orderBy('createdAt', 'desc')
            .startAfter(lastProduct.createdAt)
            .limit(APP_CONFIG.PRODUCTS_PER_PAGE || 12);
            
        const snapshot = await query.get();
        
        if (snapshot.empty) {
            const loadMoreSection = document.getElementById('loadMoreSection');
            if (loadMoreSection) {
                loadMoreSection.style.display = 'none';
            }
            showMessage('No more products to load', 'info');
            return;
        }
        
        const newProducts = [];
        snapshot.forEach(doc => {
            newProducts.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        products.push(...newProducts);
        
        // Reapply current filters
        applyAllFilters();
        
    } catch (error) {
        console.error('Error loading more products:', error);
        showMessage('Failed to load more products', 'error');
    } finally {
        isLoading = false;
        hideLoading();
    }
}

/**
 * Clear all filters
 */
function clearFilters() {
    const searchInput = document.getElementById('searchInput');
    const categorySelect = document.getElementById('categoryFilter');
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');
    const sortSelect = document.getElementById('sortSelect') || document.getElementById('sortBy');
    
    if (searchInput) searchInput.value = '';
    if (categorySelect) categorySelect.value = '';
    if (minPriceInput) minPriceInput.value = '';
    if (maxPriceInput) maxPriceInput.value = '';
    if (sortSelect) sortSelect.value = 'newest';
    
    // Reset category buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-category') === 'all') {
            btn.classList.add('active');
        }
    });
    
    filteredProducts = [...products];
    displayProducts();
    updateResultsCount();
}

/**
 * Debounce function for search and filters
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
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

// Make functions globally available
window.addToCart = addToCart;
window.showQuickView = showQuickView;
window.closeQuickViewModal = closeQuickViewModal;
window.clearFilters = clearFilters;
window.loadProducts = loadProducts;