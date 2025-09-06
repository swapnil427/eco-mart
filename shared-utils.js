// shared-utils.js - Shared functions across all pages

// Product Database - centralized for all pages
const PRODUCTS_DATABASE = [
    {
        id: 1,
        title: "Eco-Friendly Phone Case",
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
        title: "Recycled Yoga Mat",
        category: "Sports",
        price: 2899,
        rating: 4.7,
        reviews: 156,
        image: "🧘",
        description: "Non-slip yoga mat made from recycled materials. 6mm thickness for comfort and stability. Includes carrying strap and alignment guides."
    },
    {
        id: 6,
        title: "Sustainable Water Bottle",
        category: "Sports",
        price: 1299,
        rating: 4.9,
        reviews: 312,
        image: "🍃",
        description: "Stainless steel water bottle that keeps drinks cold for 24 hours or hot for 12 hours. BPA-free and comes with a lifetime warranty."
    },
    {
        id: 7,
        title: "Organic Cotton Bedsheet Set",
        category: "Home & Garden",
        price: 4999,
        rating: 4.4,
        reviews: 78,
        image: "🛏️",
        description: "Luxurious organic cotton bedsheet set includes fitted sheet, flat sheet, and 2 pillowcases. Hypoallergenic and gets softer with every wash."
    },
    {
        id: 8,
        title: "Biodegradable Phone Charger",
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

// Local Storage Keys
const STORAGE_KEYS = {
    CART: 'ecofinds_cart',
    WISHLIST: 'ecofinds_wishlist',
    USER: 'ecofinds_user',
    FILTERS: 'ecofinds_filters'
};

// Cart Management Functions
function getCart() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.CART) || '[]');
    } catch (e) {
        console.error('Error parsing cart data:', e);
        return [];
    }
}

function saveCart(cart) {
    try {
        localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
        return true;
    } catch (e) {
        console.error('Error saving cart data:', e);
        return false;
    }
}

function addToCart(productId, quantity = 1) {
    const product = PRODUCTS_DATABASE.find(p => p.id === productId);
    if (!product) {
        console.error('Product not found:', productId);
        return false;
    }

    const cart = getCart();
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            ...product,
            quantity: quantity
        });
    }
    
    return saveCart(cart);
}

function removeFromCart(productId) {
    const cart = getCart();
    const updatedCart = cart.filter(item => item.id !== productId);
    return saveCart(updatedCart);
}

function updateCartQuantity(productId, newQuantity) {
    const cart = getCart();
    const item = cart.find(item => item.id === productId);
    
    if (item) {
        if (newQuantity <= 0) {
            return removeFromCart(productId);
        } else {
            item.quantity = newQuantity;
            return saveCart(cart);
        }
    }
    return false;
}

function getCartTotalItems() {
    const cart = getCart();
    return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function getCartTotalValue() {
    const cart = getCart();
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// Wishlist Management Functions
function getWishlist() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.WISHLIST) || '[]');
    } catch (e) {
        console.error('Error parsing wishlist data:', e);
        return [];
    }
}

function saveWishlist(wishlist) {
    try {
        localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(wishlist));
        return true;
    } catch (e) {
        console.error('Error saving wishlist data:', e);
        return false;
    }
}

function addToWishlist(productId) {
    const wishlist = getWishlist();
    if (!wishlist.includes(productId)) {
        wishlist.push(productId);
        return saveWishlist(wishlist);
    }
    return true; // Already in wishlist
}

function removeFromWishlist(productId) {
    const wishlist = getWishlist();
    const updatedWishlist = wishlist.filter(id => id !== productId);
    return saveWishlist(updatedWishlist);
}

function toggleWishlist(productId) {
    const wishlist = getWishlist();
    
    if (wishlist.includes(productId)) {
        return removeFromWishlist(productId);
    } else {
        return addToWishlist(productId);
    }
}

function isInWishlist(productId) {
    const wishlist = getWishlist();
    return wishlist.includes(productId);
}

// Product Utility Functions
function getProductById(id) {
    return PRODUCTS_DATABASE.find(product => product.id === id);
}

function getProductsByCategory(category) {
    return PRODUCTS_DATABASE.filter(product => product.category === category);
}

function searchProducts(query) {
    const lowerQuery = query.toLowerCase();
    return PRODUCTS_DATABASE.filter(product =>
        product.title.toLowerCase().includes(lowerQuery) ||
        product.category.toLowerCase().includes(lowerQuery) ||
        product.description.toLowerCase().includes(lowerQuery)
    );
}

function filterProducts(filters) {
    let filtered = [...PRODUCTS_DATABASE];
    
    // Category filter
    if (filters.categories && filters.categories.length > 0) {
        filtered = filtered.filter(product => 
            filters.categories.includes(product.category)
        );
    }
    
    // Price range filter
    if (filters.priceRanges && filters.priceRanges.length > 0) {
        filtered = filtered.filter(product => {
            return filters.priceRanges.some(range => {
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
    
    // Rating filter
    if (filters.ratings && filters.ratings.length > 0) {
        filtered = filtered.filter(product => {
            return filters.ratings.some(rating => {
                switch (rating) {
                    case '4+': return product.rating >= 4;
                    case '3+': return product.rating >= 3;
                    default: return true;
                }
            });
        });
    }
    
    return filtered;
}

function sortProducts(products, sortType) {
    const productsCopy = [...products];
    
    switch (sortType) {
        case 'price-low':
            return productsCopy.sort((a, b) => a.price - b.price);
        case 'price-high':
            return productsCopy.sort((a, b) => b.price - a.price);
        case 'name':
            return productsCopy.sort((a, b) => a.title.localeCompare(b.title));
        case 'rating':
            return productsCopy.sort((a, b) => b.rating - a.rating);
        case 'newest':
            return productsCopy.sort((a, b) => b.id - a.id);
        default:
            return productsCopy;
    }
}

// UI Utility Functions
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

function formatCurrency(amount) {
    return `₹${amount.toLocaleString('en-IN')}`;
}

function showNotification(message, type = 'success', duration = 3000) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Notification styles
    const colors = {
        success: '#4caf50',
        error: '#f44336',
        info: '#2196f3',
        warning: '#ff9800'
    };
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 1000;
        font-weight: 500;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 350px;
        word-wrap: break-word;
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
    }, duration);
}

// Badge Update Functions
function updateCartBadge() {
    const totalItems = getCartTotalItems();
    const badges = document.querySelectorAll('#cartBadge, .cart-badge');
    
    badges.forEach(badge => {
        badge.textContent = totalItems;
        if (totalItems > 0) {
            badge.classList.add('pulse');
            setTimeout(() => badge.classList.remove('pulse'), 500);
        }
    });
}

function updateWishlistBadge() {
    const wishlist = getWishlist();
    const badges = document.querySelectorAll('#wishlistBadge, .wishlist-badge');
    
    badges.forEach(badge => {
        badge.textContent = wishlist.length;
        if (wishlist.length > 0) {
            badge.classList.add('pulse');
            setTimeout(() => badge.classList.remove('pulse'), 500);
        }
    });
}

function updateAllBadges() {
    updateCartBadge();
    updateWishlistBadge();
}

// Navigation Functions
function navigateToCart() {
    window.location.href = 'cart.html';
}

function navigateToWishlist() {
    window.location.href = 'wishlist.html';
}

function navigateToHome() {
    window.location.href = 'landing.html';
}

// Menu Functions
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

function closeMenu() {
    const sideMenu = document.getElementById('sideMenu');
    const overlay = document.querySelector('.menu-overlay');
    
    if (sideMenu && overlay) {
        sideMenu.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Update badges on page load
    updateAllBadges();
    
    // Close menu when clicking on overlay
    const menuOverlay = document.querySelector('.menu-overlay');
    if (menuOverlay) {
        menuOverlay.addEventListener('click', closeMenu);
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + K for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.focus();
        }
        
        // Escape to close modals/menus
        if (e.key === 'Escape') {
            closeMenu();
            // Close other modals/dropdowns
            const modals = document.querySelectorAll('.modal-overlay');
            modals.forEach(modal => modal.classList.remove('active'));
        }
    });
});

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PRODUCTS_DATABASE,
        STORAGE_KEYS,
        getCart,
        saveCart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        getCartTotalItems,
        getCartTotalValue,
        getWishlist,
        saveWishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        getProductById,
        getProductsByCategory,
        searchProducts,
        filterProducts,
        sortProducts,
        generateStars,
        formatCurrency,
        showNotification,
        updateCartBadge,
        updateWishlistBadge,
        updateAllBadges,
        navigateToCart,
        navigateToWishlist,
        navigateToHome,
        toggleMenu,
        closeMenu
    };
}