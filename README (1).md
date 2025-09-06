# 🌍 EcoFinds – Sustainable Second-Hand Marketplace

EcoFinds is a sustainable second-hand marketplace built during a hackathon to **empower responsible consumption** by extending product lifecycles, reducing waste, and promoting a circular economy.  
The platform allows users to **buy, sell, and manage pre-owned goods** with an easy-to-use interface for both desktop and mobile.

---

## 🚀 Vision
To become the go-to destination for a **conscious community** seeking unique finds and sustainable shopping, while fostering trust and community.

---

## 🎯 Mission
Develop a **cross-platform prototype (desktop + mobile)** that:  
- Is **user-friendly and engaging**.  
- Offers **core marketplace features** (authentication, product listing, browsing).  
- Promotes **sustainable choices** through reusability and community trust.  

---

## ❓ Problem Statement
The challenge is to create a **foundational version of EcoFinds** with:  
- Secure user authentication.  
- Product listing and management.  
- Product browsing with **search + filter**.  
- Cart and purchase history views.  
- Efficient data management ensuring stability and responsiveness.  

---

## ⚙️ Core Features

### 🔑 User Authentication
- Register and log in with email + password (Firebase Authentication).  
- Basic profile creation with username.  

### 👤 User Dashboard
- View all profile fields.  
- Edit and update profile info (Firebase Realtime Database / Firestore).  

### 🛍️ Product Listings
- Add new products with title, description, category, price, and image placeholder.  
- CRUD operations: View, edit, delete listings.  
- Dedicated **My Listings** page for user-owned items.  

### 📖 Product Browsing
- Product feed with title, price, and image.  
- Search listings by keywords.  
- Filter by predefined categories.  
- Detailed product view (title, description, category, price, image).  

### 🛒 Cart & Purchases
- Cart page with all added products.  
- Previous Purchases page with past orders.  

---

## 🖼️ Wireframes
- **Login / Sign Up:** Logo, email, password, login button, sign-up option.  
- **Product Feed:** Header with logo, search bar, category filter, product list, and **+ Add Product** button.  
- **Add New Product:** Input fields (title, category, description, price, image placeholder) + Submit.  
- **My Listings:** User’s listed products with edit/delete options.  
- **Product Detail:** Large image, title, category, price, description.  
- **User Dashboard:** Profile picture, editable fields, update option.  
- **Cart:** Product cards showing added items.  
- **Previous Purchases:** List of purchased products.  

---

## 🛠️ Tech Stack
- **Frontend:** HTML, CSS, JavaScript  
- **Backend / Database:** Firebase (Authentication, Firestore/Realtime Database, Storage)  

---

## ⚡ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/ecofinds.git
cd ecofinds
