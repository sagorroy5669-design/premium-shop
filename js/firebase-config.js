// firebase-config.js
// PremiumShop - Firebase Configuration & Services
// সম্পূর্ণ ব্যাকএন্ড কনফিগারেশন ফাইল

// ============================================
// FIREBASE কনফিগারেশন
// ============================================

const firebaseConfig = {
    // ⚠️ আপনার Firebase প্রজেক্টের তথ্য এখানে বসান
    // Firebase Console → Project Settings → Your apps → Firebase SDK snippet → Config
    
    apiKey: "AIzaSyABC123YOUR_API_KEY_HERE",
    authDomain: "premiumshop-bd.firebaseapp.com",
    projectId: "premiumshop-bd",
    storageBucket: "premiumshop-bd.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abc123def456ghi789",
    measurementId: "G-ABC123DEF45" // Google Analytics (optional)
};

// ============================================
// FIREBASE INITIALIZE
// ============================================

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
const functions = firebase.functions();
const analytics = firebase.analytics();

// ============================================
// FIREBASE SETTINGS
// ============================================

// Firestore Settings
db.settings({
    timestampsInSnapshots: true,
    ignoreUndefinedProperties: true,
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

// Enable Persistence (offline support)
db.enablePersistence()
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            console.log('Multiple tabs open, persistence enabled in single tab only');
        } else if (err.code === 'unimplemented') {
            console.log('Browser doesn\'t support persistence');
        }
    });

// ============================================
// AUTHENTICATION SERVICES
// ============================================

const authService = {
    // Register new user
    registerUser: async (email, password, userData) => {
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Save additional user data to Firestore
            await db.collection('users').doc(user.uid).set({
                uid: user.uid,
                email: user.email,
                ...userData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                role: 'customer',
                isActive: true,
                orders: 0,
                wishlist: [],
                addresses: []
            });
            
            // Send verification email
            await user.sendEmailVerification();
            
            return { success: true, user };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: error.message };
        }
    },

    // Login user
    loginUser: async (email, password) => {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Update last login
            await db.collection('users').doc(user.uid).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return { success: true, user };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    },

    // Logout user
    logoutUser: async () => {
        try {
            await auth.signOut();
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: error.message };
        }
    },

    // Reset password
    resetPassword: async (email) => {
        try {
            await auth.sendPasswordResetEmail(email);
            return { success: true };
        } catch (error) {
            console.error('Password reset error:', error);
            return { success: false, error: error.message };
        }
    },

    // Update password
    updatePassword: async (newPassword) => {
        try {
            const user = auth.currentUser;
            await user.updatePassword(newPassword);
            return { success: true };
        } catch (error) {
            console.error('Password update error:', error);
            return { success: false, error: error.message };
        }
    },

    // Social login
    socialLogin: async (provider) => {
        try {
            let authProvider;
            if (provider === 'google') {
                authProvider = new firebase.auth.GoogleAuthProvider();
            } else if (provider === 'facebook') {
                authProvider = new firebase.auth.FacebookAuthProvider();
            } else if (provider === 'apple') {
                authProvider = new firebase.auth.OAuthProvider('apple.com');
            }
            
            const userCredential = await auth.signInWithPopup(authProvider);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Social login error:', error);
            return { success: false, error: error.message };
        }
    },

    // Get current user
    getCurrentUser: () => {
        return auth.currentUser;
    },

    // Auth state observer
    onAuthStateChanged: (callback) => {
        return auth.onAuthStateChanged(callback);
    }
};

// ============================================
// FIRESTORE DATABASE SERVICES
// ============================================

const dbService = {
    // ========== PRODUCTS ==========
    
    // Get all products
    getProducts: async (filters = {}) => {
        try {
            let query = db.collection('products').where('isActive', '==', true);
            
            if (filters.category) {
                query = query.where('category', '==', filters.category);
            }
            if (filters.minPrice) {
                query = query.where('price', '>=', parseFloat(filters.minPrice));
            }
            if (filters.maxPrice) {
                query = query.where('price', '<=', parseFloat(filters.maxPrice));
            }
            if (filters.brand) {
                query = query.where('brand', '==', filters.brand);
            }
            if (filters.rating) {
                query = query.where('rating', '>=', parseFloat(filters.rating));
            }
            
            // Sort
            if (filters.sortBy) {
                switch(filters.sortBy) {
                    case 'price-low':
                        query = query.orderBy('price', 'asc');
                        break;
                    case 'price-high':
                        query = query.orderBy('price', 'desc');
                        break;
                    case 'newest':
                        query = query.orderBy('createdAt', 'desc');
                        break;
                    case 'popular':
                        query = query.orderBy('soldCount', 'desc');
                        break;
                }
            }
            
            const snapshot = await query.get();
            const products = [];
            
            snapshot.forEach(doc => {
                products.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return { success: true, products };
        } catch (error) {
            console.error('Get products error:', error);
            return { success: false, error: error.message };
        }
    },

    // Get single product
    getProduct: async (productId) => {
        try {
            const doc = await db.collection('products').doc(productId).get();
            
            if (doc.exists) {
                return { 
                    success: true, 
                    product: {
                        id: doc.id,
                        ...doc.data()
                    }
                };
            } else {
                return { success: false, error: 'Product not found' };
            }
        } catch (error) {
            console.error('Get product error:', error);
            return { success: false, error: error.message };
        }
    },

    // ========== ORDERS ==========
    
    // Create order
    createOrder: async (orderData) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');

            const orderRef = db.collection('orders').doc();
            
            const order = {
                orderId: orderRef.id,
                userId: user.uid,
                ...orderData,
                status: 'pending',
                paymentStatus: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await orderRef.set(order);
            
            // Update product stock
            for (const item of orderData.items) {
                await db.collection('products').doc(item.productId).update({
                    stock: firebase.firestore.FieldValue.increment(-item.quantity),
                    soldCount: firebase.firestore.FieldValue.increment(item.quantity)
                });
            }
            
            // Update user orders count
            await db.collection('users').doc(user.uid).update({
                orders: firebase.firestore.FieldValue.increment(1)
            });
            
            return { success: true, orderId: orderRef.id };
        } catch (error) {
            console.error('Create order error:', error);
            return { success: false, error: error.message };
        }
    },

    // Get user orders
    getUserOrders: async () => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');
            
            const snapshot = await db.collection('orders')
                .where('userId', '==', user.uid)
                .orderBy('createdAt', 'desc')
                .get();
            
            const orders = [];
            snapshot.forEach(doc => {
                orders.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return { success: true, orders };
        } catch (error) {
            console.error('Get user orders error:', error);
            return { success: false, error: error.message };
        }
    },

    // Track order
    trackOrder: async (orderId) => {
        try {
            const doc = await db.collection('orders').doc(orderId).get();
            
            if (doc.exists) {
                return { 
                    success: true, 
                    order: {
                        id: doc.id,
                        ...doc.data()
                    }
                };
            } else {
                return { success: false, error: 'Order not found' };
            }
        } catch (error) {
            console.error('Track order error:', error);
            return { success: false, error: error.message };
        }
    },

    // ========== CART ==========
    
    // Get cart
    getCart: async () => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');
            
            const doc = await db.collection('carts').doc(user.uid).get();
            
            if (doc.exists) {
                return { 
                    success: true, 
                    cart: doc.data() 
                };
            } else {
                return { success: true, cart: { items: [], total: 0 } };
            }
        } catch (error) {
            console.error('Get cart error:', error);
            return { success: false, error: error.message };
        }
    },

    // Update cart
    updateCart: async (cartItems) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');
            
            let total = 0;
            for (const item of cartItems) {
                total += item.price * item.quantity;
            }
            
            await db.collection('carts').doc(user.uid).set({
                userId: user.uid,
                items: cartItems,
                total: total,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            return { success: true };
        } catch (error) {
            console.error('Update cart error:', error);
            return { success: false, error: error.message };
        }
    },

    // ========== WISHLIST ==========
    
    // Get wishlist
    getWishlist: async () => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');
            
            const doc = await db.collection('wishlists').doc(user.uid).get();
            
            if (doc.exists) {
                return { 
                    success: true, 
                    wishlist: doc.data().items || [] 
                };
            } else {
                return { success: true, wishlist: [] };
            }
        } catch (error) {
            console.error('Get wishlist error:', error);
            return { success: false, error: error.message };
        }
    },

    // Add to wishlist
    addToWishlist: async (productId) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');
            
            const wishlistRef = db.collection('wishlists').doc(user.uid);
            const doc = await wishlistRef.get();
            
            if (doc.exists) {
                const items = doc.data().items || [];
                if (!items.includes(productId)) {
                    items.push(productId);
                    await wishlistRef.update({ items });
                }
            } else {
                await wishlistRef.set({
                    userId: user.uid,
                    items: [productId],
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            
            return { success: true };
        } catch (error) {
            console.error('Add to wishlist error:', error);
            return { success: false, error: error.message };
        }
    },

    // Remove from wishlist
    removeFromWishlist: async (productId) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');
            
            const wishlistRef = db.collection('wishlists').doc(user.uid);
            const doc = await wishlistRef.get();
            
            if (doc.exists) {
                const items = doc.data().items || [];
                const newItems = items.filter(id => id !== productId);
                await wishlistRef.update({ items: newItems });
            }
            
            return { success: true };
        } catch (error) {
            console.error('Remove from wishlist error:', error);
            return { success: false, error: error.message };
        }
    },

    // ========== REVIEWS ==========
    
    // Add review
    addReview: async (productId, reviewData) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');
            
            const review = {
                userId: user.uid,
                userName: user.displayName || 'Anonymous',
                userPhoto: user.photoURL || null,
                productId,
                ...reviewData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isVerified: true
            };
            
            await db.collection('reviews').add(review);
            
            // Update product rating
            const productRef = db.collection('products').doc(productId);
            const productDoc = await productRef.get();
            const product = productDoc.data();
            
            const newRating = ((product.rating * product.reviewCount) + reviewData.rating) / (product.reviewCount + 1);
            
            await productRef.update({
                rating: newRating,
                reviewCount: firebase.firestore.FieldValue.increment(1)
            });
            
            return { success: true };
        } catch (error) {
            console.error('Add review error:', error);
            return { success: false, error: error.message };
        }
    },

    // Get product reviews
    getReviews: async (productId) => {
        try {
            const snapshot = await db.collection('reviews')
                .where('productId', '==', productId)
                .orderBy('createdAt', 'desc')
                .get();
            
            const reviews = [];
            snapshot.forEach(doc => {
                reviews.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return { success: true, reviews };
        } catch (error) {
            console.error('Get reviews error:', error);
            return { success: false, error: error.message };
        }
    }
};

// ============================================
// STORAGE SERVICES (Image Upload)
// ============================================

const storageService = {
    // Upload product image
    uploadProductImage: async (file, productId) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');
            
            const timestamp = Date.now();
            const fileName = `${productId}_${timestamp}_${file.name}`;
            const storageRef = storage.ref(`products/${fileName}`);
            
            const uploadTask = await storageRef.put(file);
            const downloadURL = await storageRef.getDownloadURL();
            
            return { 
                success: true, 
                url: downloadURL,
                fileName: fileName
            };
        } catch (error) {
            console.error('Upload image error:', error);
            return { success: false, error: error.message };
        }
    },

    // Upload user avatar
    uploadAvatar: async (file) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');
            
            const timestamp = Date.now();
            const fileName = `avatar_${user.uid}_${timestamp}.jpg`;
            const storageRef = storage.ref(`users/${user.uid}/${fileName}`);
            
            await storageRef.put(file);
            const downloadURL = await storageRef.getDownloadURL();
            
            // Update user profile
            await user.updateProfile({
                photoURL: downloadURL
            });
            
            return { 
                success: true, 
                url: downloadURL 
            };
        } catch (error) {
            console.error('Upload avatar error:', error);
            return { success: false, error: error.message };
        }
    },

    // Delete image
    deleteImage: async (url) => {
        try {
            const storageRef = storage.refFromURL(url);
            await storageRef.delete();
            return { success: true };
        } catch (error) {
            console.error('Delete image error:', error);
            return { success: false, error: error.message };
        }
    }
};

// ============================================
// USER PROFILE SERVICES
// ============================================

const userService = {
    // Get user profile
    getUserProfile: async () => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');
            
            const doc = await db.collection('users').doc(user.uid).get();
            
            if (doc.exists) {
                return { 
                    success: true, 
                    profile: {
                        uid: user.uid,
                        email: user.email,
                        emailVerified: user.emailVerified,
                        ...doc.data()
                    }
                };
            } else {
                return { success: false, error: 'Profile not found' };
            }
        } catch (error) {
            console.error('Get profile error:', error);
            return { success: false, error: error.message };
        }
    },

    // Update user profile
    updateUserProfile: async (profileData) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');
            
            // Update Auth profile
            if (profileData.displayName) {
                await user.updateProfile({
                    displayName: profileData.displayName
                });
            }
            
            // Update Firestore profile
            await db.collection('users').doc(user.uid).update({
                ...profileData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return { success: true };
        } catch (error) {
            console.error('Update profile error:', error);
            return { success: false, error: error.message };
        }
    },

    // Add address
    addAddress: async (addressData) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');
            
            const userRef = db.collection('users').doc(user.uid);
            const doc = await userRef.get();
            
            if (doc.exists) {
                const addresses = doc.data().addresses || [];
                addresses.push({
                    id: Date.now().toString(),
                    ...addressData,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                await userRef.update({ addresses });
            }
            
            return { success: true };
        } catch (error) {
            console.error('Add address error:', error);
            return { success: false, error: error.message };
        }
    },

    // Delete address
    deleteAddress: async (addressId) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');
            
            const userRef = db.collection('users').doc(user.uid);
            const doc = await userRef.get();
            
            if (doc.exists) {
                const addresses = doc.data().addresses || [];
                const newAddresses = addresses.filter(addr => addr.id !== addressId);
                await userRef.update({ addresses: newAddresses });
            }
            
            return { success: true };
        } catch (error) {
            console.error('Delete address error:', error);
            return { success: false, error: error.message };
        }
    }
};

// ============================================
// ADMIN SERVICES (For Admin Panel)
// ============================================

const adminService = {
    // Check if user is admin
    isAdmin: async () => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');
            
            const doc = await db.collection('admins').doc(user.uid).get();
            return doc.exists;
        } catch (error) {
            console.error('Check admin error:', error);
            return false;
        }
    },

    // Get dashboard stats
    getDashboardStats: async () => {
        try {
            // Total products
            const productsSnapshot = await db.collection('products').get();
            const totalProducts = productsSnapshot.size;
            
            // Total orders
            const ordersSnapshot = await db.collection('orders').get();
            const totalOrders = ordersSnapshot.size;
            
            // Total users
            const usersSnapshot = await db.collection('users').get();
            const totalUsers = usersSnapshot.size;
            
            // Total revenue
            const orders = ordersSnapshot.docs;
            let totalRevenue = 0;
            orders.forEach(doc => {
                totalRevenue += doc.data().finalAmount || 0;
            });
            
            // Recent orders
            const recentOrdersSnapshot = await db.collection('orders')
                .orderBy('createdAt', 'desc')
                .limit(10)
                .get();
            
            const recentOrders = [];
            recentOrdersSnapshot.forEach(doc => {
                recentOrders.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return {
                success: true,
                stats: {
                    totalProducts,
                    totalOrders,
                    totalUsers,
                    totalRevenue,
                    recentOrders
                }
            };
        } catch (error) {
            console.error('Get dashboard stats error:', error);
            return { success: false, error: error.message };
        }
    },

    // Add product (admin only)
    addProduct: async (productData) => {
        try {
            const isUserAdmin = await adminService.isAdmin();
            if (!isUserAdmin) throw new Error('Unauthorized');
            
            const product = {
                ...productData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                isActive: true,
                soldCount: 0,
                rating: 0,
                reviewCount: 0
            };
            
            const docRef = await db.collection('products').add(product);
            
            return { 
                success: true, 
                productId: docRef.id 
            };
        } catch (error) {
            console.error('Add product error:', error);
            return { success: false, error: error.message };
        }
    },

    // Update product (admin only)
    updateProduct: async (productId, productData) => {
        try {
            const isUserAdmin = await adminService.isAdmin();
            if (!isUserAdmin) throw new Error('Unauthorized');
            
            await db.collection('products').doc(productId).update({
                ...productData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return { success: true };
        } catch (error) {
            console.error('Update product error:', error);
            return { success: false, error: error.message };
        }
    },

    // Delete product (admin only)
    deleteProduct: async (productId) => {
        try {
            const isUserAdmin = await adminService.isAdmin();
            if (!isUserAdmin) throw new Error('Unauthorized');
            
            // Soft delete
            await db.collection('products').doc(productId).update({
                isActive: false,
                deletedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return { success: true };
        } catch (error) {
            console.error('Delete product error:', error);
            return { success: false, error: error.message };
        }
    },

    // Update order status (admin only)
    updateOrderStatus: async (orderId, status) => {
        try {
            const isUserAdmin = await adminService.isAdmin();
            if (!isUserAdmin) throw new Error('Unauthorized');
            
            await db.collection('orders').doc(orderId).update({
                status: status,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return { success: true };
        } catch (error) {
            console.error('Update order status error:', error);
            return { success: false, error: error.message };
        }
    }
};

// ============================================
// EXPORT ALL SERVICES
// ============================================

export {
    auth,
    db,
    storage,
    functions,
    analytics,
    authService,
    dbService,
    storageService,
    userService,
    adminService,
    firebaseConfig
};

// ============================================
// FIREBASE INITIALIZATION SCRIPT
// ============================================

console.log('🔥 Firebase initialized successfully!');
console.log('📦 Project:', firebaseConfig.projectId);
console.log('✅ Services: Auth, Firestore, Storage, Functions, Analytics');