// ======================= 
// Firebase Configuration (Compat SDK) 
// ======================= 
const firebaseConfig = {
  apiKey: "AIzaSyDxZKNLXbIlDIt9lk-pwGja7qVNOcJLEjM",
  authDomain: "ecofinds-4d53d.firebaseapp.com",
  databaseURL: "https://ecofinds-4d53d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ecofinds-4d53d",
  storageBucket: "ecofinds-4d53d.firebasestorage.app",
  messagingSenderId: "925199812358",
  appId: "1:925199812358:web:c1132ac9dd230ab9314087",
  measurementId: "G-TWGQMCCB92"
};

// ======================= 
// Initialize Firebase (Compat SDK) 
// ======================= 
firebase.initializeApp(firebaseConfig);

// ======================= 
// Firebase Services (Compat SDK) 
// ======================= 
const auth = firebase.auth();
const db = firebase.firestore();
// Removed storage reference since we're using Cloudinary

// ======================= 
// Cloudinary Configuration 
// ======================= 
const CLOUDINARY_CONFIG = {
  cloudName: 'dvun5gh9m', // Replace with your actual cloud name from Cloudinary dashboard
  uploadPreset: 'ecofinds_products' // Replace with your upload preset name
};

// ======================= 
// Firestore Collections 
// ======================= 
const COLLECTIONS = {
  USERS: "users",
  PRODUCTS: "products",
  CARTS: "carts",
  PURCHASES: "purchases"
};

// ======================= 
// Product Categories 
// ======================= 
const CATEGORIES = [
  "Electronics",
  "Clothing & Accessories",
  "Home & Garden",
  "Books & Media",
  "Sports & Outdoors",
  "Toys & Games",
  "Health & Beauty",
  "Automotive",
  "Art & Crafts",
  "Other"
];

// ======================= 
// Application Constants 
// ======================= 
const APP_CONFIG = {
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10 MB (Cloudinary can handle larger files)
  PRODUCTS_PER_PAGE: 12,
  SUPPORTED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"]
};

// ======================= 
// Cloudinary Upload Function
// ======================= 
async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
  formData.append('folder', 'ecofinds/products'); // Organize images in folders
  
  try {
    showMessage('Uploading image to Cloudinary...', 'info');
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }
    
    console.log('Image uploaded to Cloudinary:', data.secure_url);
    return data.secure_url;
    
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image: ' + error.message);
  }
}

// ======================= 
// Debug Firebase Initialization 
// ======================= 
console.log("✅ Firebase initialized successfully (Compat SDK)");
console.log("🔐 Auth instance:", auth);
console.log("🗄️ Firestore instance:", db);
console.log("☁️ Cloudinary config:", CLOUDINARY_CONFIG);

// Test Firebase connection
auth.onAuthStateChanged((user) => {
  console.log("👤 Auth state changed:", user ? `User: ${user.email}` : "No user");
});