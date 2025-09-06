// Product Database
const productsDatabase = [
    {
        id: 1,
        title: "Phone Case",
        category: "Electronics",
        price: 1999,
        rating: 4.5,
        reviews: 128,
        image: "📱",
        description: "Made from 100% biodegradable materials, this phone case protects your device while protecting the environment. Features shock absorption and wireless charging compatibility."
    },
    {
        id: 2,
        title: "Organic Cotton T-Shirt",
        category: "Clothing",
        price: 2699,
        rating: 4.8,
        reviews: 89,
        image: "👕",
        description: "Super soft organic cotton t-shirt made with sustainable farming practices. Available in multiple colors and sizes. Machine washable and long-lasting."
    },
    {
        id: 3,
        title: "Bamboo Plant Pot Set",
        category: "Home & Garden",
        price: 1599,
        rating: 4.2,
        reviews: 45,
        image: "🌿",
        description: "Beautiful set of 3 bamboo plant pots in different sizes. Perfect for herbs, succulents, or small plants. Includes drainage holes and matching saucers."
    },
    {
        id: 4,
        title: "Solar Power Bank",
        category: "Electronics",
        price: 3499,
        rating: 4.6,
        reviews: 234,
        image: "🔋",
        description: "20,000mAh solar power bank with fast charging capability. Weather-resistant design perfect for outdoor adventures. Charges via solar or USB-C."
    },
    {
        id: 5,
        title: " Yoga Mat",
        category: "Sports",
        price: 2899,
        rating: 4.7,
        reviews: 156,
        image: "🧘",
        description: "Non-slip yoga mat made from recycled materials. 6mm thickness for comfort and stability. Includes carrying strap and alignment guides."
    },
    {
        id: 6,
        title: "Water Bottle",
        category: "Sports",
        price: 1299,
        rating: 4.9,
        reviews: 312,
        image: "🍃",
        description: "Stainless steel water bottle that keeps drinks cold for 24 hours or hot for 12 hours. BPA-free and comes with a lifetime warranty."
    },
    {
        id: 7,
        title: "Cotton Bedsheet Set",
        category: "Home & Garden",
        price: 4999,
        rating: 4.4,
        reviews: 78,
        image: "🛏️",
        description: "Luxurious organic cotton bedsheet set includes fitted sheet, flat sheet, and 2 pillowcases. Hypoallergenic and gets softer with every wash."
    },
    {
        id: 8,
        title: " Phone Charger",
        category: "Electronics",
        price: 899,
        rating: 4.1,
        reviews: 67,
        image: "🔌",
        description: "Fast-charging cable made from biodegradable materials. Compatible with all major phone brands. 3-foot length with reinforced connectors."
    },
    {
        id: 9,
        title: "Eco-Friendly Notebook Set",
        category: "Books",
        price: 799,
        rating: 4.3,
        reviews: 92,
        image: "📚",
        description: "Set of 3 notebooks made from recycled paper with soy-based ink. Perfect for journaling, note-taking, or sketching. Includes lined, dotted, and blank pages."
    }
];

// Application State
let currentProducts = [...productsDatabase];
let activeFilters = {
    categories: [],
    priceRanges: [],
    ratings: []
};
let currentSort = 'newest';

// localStorage functions for cart
function getCart() {
    return JSON.parse(localStorage.getItem('ecofinds_cart') || '[]');
}

function saveCart(cart) {
    localStorage.setItem('ecofinds_cart', JSON.stringify(cart));
}

// localStorage functions for wishlist
function getWishlist() {
    return JSON.parse(localStorage.getItem('ecofinds_wishlist') || '[]');
}

function saveWishlist(wishlist) {
    localStorage.setItem('ecofinds_wishlist', JSON.stringify(wishlist));
}

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    renderProducts();
    setupEventListeners();
    updateCartBadge();
    updateWishlistBadge();
    
    // Check if we should open a specific product (from wishlist page)
    const openProductId = localStorage.getItem('openProductId');
    if (openProductId) {
        localStorage.removeItem('openProductId');
        setTimeout(() => {
            openProduct(parseInt(openProductId));
        }, 500);
    }
    
    // Welcome notification
    setTimeout(() => {
        showNotification('🌱 Welcome to EcoFinds! Discover sustainable products.', 'success');
    }, 1000);
});

// Event Listeners Setup
function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    let searchTimeout;
    
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const query = this.value.trim().toLowerCase();
        
        searchTimeout = setTimeout(() => {
            if (query.length === 0) {
                currentProducts = [...productsDatabase];
            } else {
                currentProducts = productsDatabase.filter(product =>
                    product.title.toLowerCase().includes(query) ||
                    product.category.toLowerCase().includes(query) ||
                    product.description.toLowerCase().includes(query)
                );
            }
            applyCurrentFiltersAndSort();
            renderProducts();
        }, 300);
    });

    // Close modals on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeProductModal();
            closeSortDropdown();
            closeFilterPanel();
        }
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.action-buttons')) {
            closeSortDropdown();
            closeFilterPanel();
        }
    });
}

// Product Rendering
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    
    if (currentProducts.length === 0) {
        grid.innerHTML = `
            <div class="no-products">
                <div style="text-align: center; padding: 40px; color: #6c757d;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
                    <h3>No products found</h3>
                    <p>Try adjusting your search or filters</p>
                </div>
            </div>
        `;
        return;
    }

    const wishlist = getWishlist();
    
    grid.innerHTML = currentProducts.map(product => `
        <div class="product-card" onclick="openProduct(${product.id})">
            <div class="product-image">${product.image}</div>
            <div class="product-info">
                <h3 class="product-title">${product.title}</h3>
                <div class="product-category">${product.category}</div>
                <div class="product-rating">
                    <span class="stars">${generateStars(product.rating)}</span>
                    <span class="rating-text">(${product.reviews} reviews)</span>
                </div>
                <div class="product-price">₹${product.price.toLocaleString()}</div>
                <div class="product-actions">
                    <button class="btn-primary" onclick="event.stopPropagation(); addToCart(${product.id})">
                        Add to Cart
                    </button>
                    <button class="btn-secondary ${wishlist.includes(product.id) ? 'active' : ''}" 
                            onclick="event.stopPropagation(); toggleWishlist(${product.id})" 
                            title="Add to Wishlist">
                        ❤️
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '⭐';
    }
    if (hasHalfStar) {
        stars += '⭐';
    }
    
    return stars;
}

// Product Modal
function openProduct(id) {
    const product = productsDatabase.find(p => p.id === id);
    if (!product) return;

    const wishlist = getWishlist();
    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = `
        <div class="modal-product-image">${product.image}</div>
        <h2 class="modal-product-title">${product.title}</h2>
        <div class="modal-product-category">${product.category}</div>
        <div class="modal-product-rating">
            <span class="stars">${generateStars(product.rating)}</span>
            <span>${product.rating}/5</span>
            <span class="rating-text">(${product.reviews} reviews)</span>
        </div>
        <div class="modal-product-price">₹${product.price.toLocaleString()}</div>
        <p class="modal-product-description">${product.description}</p>
        <div class="modal-actions">
            <button class="modal-btn modal-btn-primary" onclick="addToCartFromModal(${product.id})">
                Add to Cart
            </button>
            <button class="modal-btn modal-btn-secondary ${wishlist.includes(product.id) ? 'active' : ''}" 
                    onclick="toggleWishlistFromModal(${product.id})">
                ${wishlist.includes(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
            </button>
        </div>
    `;

    document.getElementById('productModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
    document.body.style.overflow = '';
}

function addToCartFromModal(id) {
    addToCart(id);
}

function toggleWishlistFromModal(id) {
    toggleWishlist(id);
    // Update button text and style
    const wishlist = getWishlist();
    const wishlistBtn = document.querySelector('.modal-btn-secondary');
    if (wishlistBtn) {
        wishlistBtn.textContent = wishlist.includes(id) ? 'Remove from Wishlist' : 'Add to Wishlist';
        wishlistBtn.className = `modal-btn modal-btn-secondary ${wishlist.includes(id) ? 'active' : ''}`;
    }
}

// Cart Functionality
function addToCart(id) {
    const product = productsDatabase.find(p => p.id === id);
    if (!product) return;

    const cart = getCart();
    const existingItem = cart.find(item => item.id === id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }

    saveCart(cart);
    updateCartBadge();
    showNotification(`🛒 ${product.title} added to cart!`, 'success');
    
    // Animate the add to cart button
    const buttons = document.querySelectorAll(`button[onclick*="addToCart(${id})"]`);
    buttons.forEach(button => {
        const originalText = button.textContent;
        button.textContent = 'Adding...';
        button.style.background = '#4caf50';
        
        setTimeout(() => {
            button.textContent = '✅ Added';
            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = '';
            }, 1000);
        }, 300);
    });
}

function updateCartBadge() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.getElementById('cartBadge');
    if (badge) {
        badge.textContent = totalItems;
        
        if (totalItems > 0) {
            badge.classList.add('pulse');
            setTimeout(() => badge.classList.remove('pulse'), 500);
        }
    }
}

// Navigate to cart page
function toggleCart() {
    window.location.href = 'cart.html';
}

// Wishlist Functionality
function toggleWishlist(id) {
    const product = productsDatabase.find(p => p.id === id);
    if (!product) return;

    const wishlist = getWishlist();
    
    if (wishlist.includes(id)) {
        const updatedWishlist = wishlist.filter(itemId => itemId !== id);
        saveWishlist(updatedWishlist);
        showNotification(`💔 ${product.title} removed from wishlist`, 'info');
    } else {
        wishlist.push(id);
        saveWishlist(wishlist);
        showNotification(`❤️ ${product.title} added to wishlist!`, 'success');
    }

    updateWishlistBadge();
    renderProducts(); // Re-render to update wishlist button states
}

function updateWishlistBadge() {
    const wishlist = getWishlist();
    const badge = document.getElementById('wishlistBadge');
    if (badge) {
        badge.textContent = wishlist.length;
        
        if (wishlist.length > 0) {
            badge.classList.add('pulse');
            setTimeout(() => badge.classList.remove('pulse'), 500);
        }
    }
}

// Navigate to wishlist page
function showWishlist() {
    window.location.href = 'wishlist.html';
}

// Sort Functionality
function showSortOptions() {
    const dropdown = document.getElementById('sortDropdown');
    const isVisible = dropdown.style.display === 'block';
    
    closeSortDropdown();
    closeFilterPanel();
    
    if (!isVisible) {
        dropdown.style.display = 'block';
    }
}

function closeSortDropdown() {
    document.getElementById('sortDropdown').style.display = 'none';
}

function sortProducts(sortType) {
    currentSort = sortType;
    
    switch (sortType) {
        case 'price-low':
            currentProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            currentProducts.sort((a, b) => b.price - a.price);
            break;
        case 'name':
            currentProducts.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'rating':
            currentProducts.sort((a, b) => b.rating - a.rating);
            break;
        case 'newest':
            currentProducts.sort((a, b) => b.id - a.id);
            break;
    }
    
    renderProducts();
    closeSortDropdown();
    
    const sortLabels = {
        'price-low': 'Price: Low to High',
        'price-high': 'Price: High to Low',
        'name': 'Name A-Z',
        'rating': 'Highest Rated',
        'newest': 'Newest First'
    };
    
    showNotification(`📊 Sorted by: ${sortLabels[sortType]}`, 'info');
}

// Filter Functionality
function showFilters() {
    const panel = document.getElementById('filterPanel');
    const isVisible = panel.style.display === 'block';
    
    closeFilterPanel();
    closeSortDropdown();
    
    if (!isVisible) {
        panel.style.display = 'block';
    }
}

function closeFilterPanel() {
    document.getElementById('filterPanel').style.display = 'none';
}

function applyFilters() {
    // Get selected categories
    const categoryCheckboxes = document.querySelectorAll('input[type="checkbox"][value="Electronics"], input[type="checkbox"][value="Clothing"], input[type="checkbox"][value="Home & Garden"], input[type="checkbox"][value="Books"], input[type="checkbox"][value="Sports"]');
    activeFilters.categories = Array.from(categoryCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);

    // Get selected price ranges
    const priceCheckboxes = document.querySelectorAll('input[type="checkbox"][value="0-1000"], input[type="checkbox"][value="1000-2500"], input[type="checkbox"][value="2500-5000"], input[type="checkbox"][value="5000+"]');
    activeFilters.priceRanges = Array.from(priceCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);

    // Get selected ratings
    const ratingCheckboxes = document.querySelectorAll('input[type="checkbox"][value="4+"], input[type="checkbox"][value="3+"]');
    activeFilters.ratings = Array.from(ratingCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);

    applyCurrentFiltersAndSort();
    renderProducts();
    updateFilterBar();
}

function applyCurrentFiltersAndSort() {
    // Start with search results
    let filtered = [...currentProducts];

    // Apply category filter
    if (activeFilters.categories.length > 0) {
        filtered = filtered.filter(product => 
            activeFilters.categories.includes(product.category)
        );
    }

    // Apply price filter
    if (activeFilters.priceRanges.length > 0) {
        filtered = filtered.filter(product => {
            return activeFilters.priceRanges.some(range => {
                switch (range) {
                    case '0-1000': return product.price < 1000;
                    case '1000-2500': return product.price >= 1000 && product.price <= 2500;
                    case '2500-5000': return product.price >= 2500 && product.price <= 5000;
                    case '5000+': return product.price > 5000;
                    default: return true;
                }
            });
        });
    }

    // Apply rating filter
    if (activeFilters.ratings.length > 0) {
        filtered = filtered.filter(product => {
            return activeFilters.ratings.some(rating => {
                switch (rating) {
                    case '4+': return product.rating >= 4;
                    case '3+': return product.rating >= 3;
                    default: return true;
                }
            });
        });
    }

    currentProducts = filtered;
    
    // Re-apply current sort
    if (currentSort) {
        sortProducts(currentSort);
    }
}

function updateFilterBar() {
    const filterBar = document.getElementById('filterBar');
    const activeFiltersContainer = document.getElementById('activeFilters');
    
    if (!filterBar || !activeFiltersContainer) return;
    
    const allActiveFilters = [
        ...activeFilters.categories,
        ...activeFilters.priceRanges.map(range => {
            switch (range) {
                case '0-1000': return 'Under ₹1,000';
                case '1000-2500': return '₹1,000 - ₹2,500';
                case '2500-5000': return '₹2,500 - ₹5,000';
                case '5000+': return 'Above ₹5,000';
                default: return range;
            }
        }),
        ...activeFilters.ratings.map(rating => rating + ' Stars')
    ];

    if (allActiveFilters.length > 0) {
        filterBar.style.display = 'block';
        activeFiltersContainer.innerHTML = allActiveFilters.map(filter => 
            `<span class="filter-tag">${filter} <span class="remove" onclick="removeFilter('${filter}')">×</span></span>`
        ).join('');
    } else {
        filterBar.style.display = 'none';
    }
}

function removeFilter(filterText) {
    // Remove from categories
    activeFilters.categories = activeFilters.categories.filter(cat => cat !== filterText);
    
    // Remove from price ranges
    const priceMap = {
        'Under ₹1,000': '0-1000',
        '₹1,000 - ₹2,500': '1000-2500',
        '₹2,500 - ₹5,000': '2500-5000',
        'Above ₹5,000': '5000+'
    };
    
    if (priceMap[filterText]) {
        activeFilters.priceRanges = activeFilters.priceRanges.filter(range => range !== priceMap[filterText]);
    }
    
    // Remove from ratings
    if (filterText.includes('Stars')) {
        const ratingValue = filterText.replace(' Stars', '');
        activeFilters.ratings = activeFilters.ratings.filter(rating => rating !== ratingValue);
    }
    
    // Update checkboxes
    updateFilterCheckboxes();
    applyCurrentFiltersAndSort();
    renderProducts();
    updateFilterBar();
}

function updateFilterCheckboxes() {
    // Update category checkboxes
    const categoryCheckboxes = document.querySelectorAll('input[type="checkbox"][value="Electronics"], input[type="checkbox"][value="Clothing"], input[type="checkbox"][value="Home & Garden"], input[type="checkbox"][value="Books"], input[type="checkbox"][value="Sports"]');
    categoryCheckboxes.forEach(cb => {
        cb.checked = activeFilters.categories.includes(cb.value);
    });

    // Update price checkboxes
    const priceCheckboxes = document.querySelectorAll('input[type="checkbox"][value="0-1000"], input[type="checkbox"][value="1000-2500"], input[type="checkbox"][value="2500-5000"], input[type="checkbox"][value="5000+"]');
    priceCheckboxes.forEach(cb => {
        cb.checked = activeFilters.priceRanges.includes(cb.value);
    });

    // Update rating checkboxes
    const ratingCheckboxes = document.querySelectorAll('input[type="checkbox"][value="4+"], input[type="checkbox"][value="3+"]');
    ratingCheckboxes.forEach(cb => {
        cb.checked = activeFilters.ratings.includes(cb.value);
    });
}

function clearFilters() {
    // Reset all filters
    activeFilters = {
        categories: [],
        priceRanges: [],
        ratings: []
    };
    
    // Reset search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    currentProducts = [...productsDatabase];
    
    // Update UI
    updateFilterCheckboxes();
    renderProducts();
    updateFilterBar();
    closeFilterPanel();
    
    showNotification('🔄 All filters cleared', 'info');
}

// Menu Functionality
function toggleMenu() {
    const sideMenu = document.getElementById('sideMenu');
    const overlay = document.querySelector('.menu-overlay');
    
    if (sideMenu && overlay) {
        sideMenu.classList.toggle('active');
        overlay.classList.toggle('active');
        
        if (sideMenu.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }
}

// Profile Functionality
function toggleProfile() {
    const profileDropdown = document.getElementById('profileDropdown');
    if (profileDropdown) {
        const isVisible = profileDropdown.style.display === 'block';
        profileDropdown.style.display = isVisible ? 'none' : 'block';
    }
}

// Categories Functionality
function showAllCategories() {
    const categories = [
        { name: 'Electronics', icon: '🔌', count: 3 },
        { name: 'Clothing', icon: '👕', count: 1 },
        { name: 'Home & Garden', icon: '🏠', count: 2 },
        { name: 'Books', icon: '📚', count: 1 },
        { name: 'Sports', icon: '⚽', count: 2 }
    ];
    
    const categoryList = categories.map(cat => 
        `${cat.icon} ${cat.name} (${cat.count} items)`
    ).join('\n');
    
    alert(`🌱 All Categories:\n\n${categoryList}\n\nClick on any category to filter products.`);
}

// Notification System
function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4caf50' : type === 'info' ? '#2196f3' : '#ff9800'};
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 1000;
        font-weight: 500;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Hide and remove notification
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// Enhanced features
function setupSearchSuggestions() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    searchInput.addEventListener('focus', function() {
        if (!this.value) {
            const popularSearches = ['Organic Cotton', 'Solar Power', 'Bamboo', 'Recycled', 'Biodegradable'];
            console.log('Popular searches:', popularSearches);
        }
    });
}

function setupMobileEnhancements() {
    const interactiveElements = document.querySelectorAll('button, .product-card, .menu-item, .banner-btn');
    
    interactiveElements.forEach(element => {
        element.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.98)';
        }, { passive: true });
        
        element.addEventListener('touchend', function() {
            this.style.transform = '';
        }, { passive: true });
    });
}

// Keyboard Shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.focus();
    }
    
    // Ctrl/Cmd + Shift + C for cart
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        toggleCart();
    }
    
    // Ctrl/Cmd + Shift + W for wishlist
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'W') {
        e.preventDefault();
        showWishlist();
    }
});

// Error handling
window.addEventListener('error', function(e) {
    console.error('Application error:', e.error);
    showNotification('⚠️ Something went wrong. Please try again.', 'error');
});

// Initialize enhanced features
document.addEventListener('DOMContentLoaded', function() {
    setupSearchSuggestions();
    setupMobileEnhancements();
    
    // Close profile dropdown when clicking outside
    document.addEventListener('click', function(event) {
        const profileBtn = event.target.closest('.icon-btn[title="Profile"]');
        const dropdown = document.getElementById('profileDropdown');
        
        if (!profileBtn && dropdown && !dropdown.contains(event.target)) {
            dropdown.style.display = 'none';
        }
    });
});

// Export functions for external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        addToCart,
        toggleWishlist,
        sortProducts,
        applyFilters,
        clearFilters,
        getCart,
        getWishlist,
        saveCart,
        saveWishlist
    };
}