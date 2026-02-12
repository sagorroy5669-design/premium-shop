/* ============================================
   PremiumShop - Main JavaScript File
   Version: 1.0.0
   Author: PremiumShop Team
   Date: November 2023
   ============================================ */

// DOM Ready Function
document.addEventListener('DOMContentLoaded', function() {
    console.log('PremiumShop Website Loaded');
    
    // Initialize all components
    initializeComponents();
    loadCartCount();
    loadUserData();
    setupEventListeners();
    
    // Show welcome message for first-time visitors
    showWelcomeMessage();
});

// ===== GLOBAL VARIABLES =====
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
let user = JSON.parse(localStorage.getItem('user')) || null;

// ===== INITIALIZATION FUNCTIONS =====
function initializeComponents() {
    // Initialize tooltips
    initializeTooltips();
    
    // Initialize counters
    initializeCounters();
    
    // Initialize product sliders
    initializeProductSliders();
    
    // Initialize category filters
    initializeCategoryFilters();
    
    // Initialize price range slider
    initializePriceRange();
    
    // Initialize mobile menu
    initializeMobileMenu();
    
    // Initialize back to top button
    initializeBackToTop();
    
    // Initialize newsletter form
    initializeNewsletter();
    
    // Initialize product zoom
    initializeProductZoom();
    
    // Initialize lazy loading
    initializeLazyLoading();
}

// ===== TOOLTIPS =====
function initializeTooltips() {
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => {
        new bootstrap.Tooltip(tooltip);
    });
}

// ===== COUNTERS =====
function initializeCounters() {
    const counters = document.querySelectorAll('.counter');
    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        const increment = target / 100;
        let current = 0;
        
        const updateCounter = () => {
            if (current < target) {
                current += increment;
                counter.textContent = Math.ceil(current);
                setTimeout(updateCounter, 10);
            } else {
                counter.textContent = target;
            }
        };
        
        // Start counter when in viewport
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    updateCounter();
                    observer.unobserve(entry.target);
                }
            });
        });
        
        observer.observe(counter);
    });
}

// ===== PRODUCT SLIDERS =====
function initializeProductSliders() {
    const sliders = document.querySelectorAll('.product-slider');
    
    sliders.forEach(slider => {
        const container = slider.querySelector('.slider-container');
        const prevBtn = slider.querySelector('.slider-prev');
        const nextBtn = slider.querySelector('.slider-next');
        const products = slider.querySelectorAll('.product-card');
        const dotsContainer = slider.querySelector('.slider-dots');
        
        if (!container || !prevBtn || !nextBtn) return;
        
        let currentSlide = 0;
        const slideWidth = products[0].offsetWidth + 20; // Include margin
        
        // Create dots
        if (dotsContainer) {
            products.forEach((_, index) => {
                const dot = document.createElement('button');
                dot.className = `slider-dot ${index === 0 ? 'active' : ''}`;
                dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
                dot.addEventListener('click', () => goToSlide(index));
                dotsContainer.appendChild(dot);
            });
        }
        
        // Navigation functions
        function goToSlide(index) {
            currentSlide = index;
            container.style.transform = `translateX(-${currentSlide * slideWidth}px)`;
            updateDots();
            updateButtons();
        }
        
        function nextSlide() {
            if (currentSlide < products.length - 1) {
                currentSlide++;
                goToSlide(currentSlide);
            }
        }
        
        function prevSlide() {
            if (currentSlide > 0) {
                currentSlide--;
                goToSlide(currentSlide);
            }
        }
        
        function updateDots() {
            const dots = slider.querySelectorAll('.slider-dot');
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentSlide);
            });
        }
        
        function updateButtons() {
            prevBtn.disabled = currentSlide === 0;
            nextBtn.disabled = currentSlide === products.length - 1;
        }
        
        // Event listeners
        prevBtn.addEventListener('click', prevSlide);
        nextBtn.addEventListener('click', nextSlide);
        
        // Touch/swipe support
        let startX = 0;
        let endX = 0;
        
        container.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });
        
        container.addEventListener('touchmove', (e) => {
            endX = e.touches[0].clientX;
        });
        
        container.addEventListener('touchend', () => {
            const diff = startX - endX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    nextSlide();
                } else {
                    prevSlide();
                }
            }
        });
        
        // Initialize
        updateButtons();
    });
}

// ===== CATEGORY FILTERS =====
function initializeCategoryFilters() {
    const filterButtons = document.querySelectorAll('.category-filter');
    const productGrids = document.querySelectorAll('.products-grid');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Filter products
            productGrids.forEach(grid => {
                const products = grid.querySelectorAll('.product-card');
                products.forEach(product => {
                    const productCategory = product.getAttribute('data-category');
                    if (category === 'all' || productCategory === category) {
                        product.style.display = 'block';
                        setTimeout(() => {
                            product.style.opacity = '1';
                            product.style.transform = 'translateY(0)';
                        }, 10);
                    } else {
                        product.style.opacity = '0';
                        product.style.transform = 'translateY(20px)';
                        setTimeout(() => {
                            product.style.display = 'none';
                        }, 300);
                    }
                });
            });
        });
    });
}

// ===== PRICE RANGE SLIDER =====
function initializePriceRange() {
    const priceRange = document.getElementById('priceRange');
    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');
    
    if (!priceRange || !minPrice || !maxPrice) return;
    
    const min = parseInt(priceRange.min);
    const max = parseInt(priceRange.max);
    
    priceRange.addEventListener('input', function() {
        const value = parseInt(this.value);
        minPrice.textContent = '৳0';
        maxPrice.textContent = `৳${value}`;
        
        // Filter products by price
        filterProductsByPrice(value);
    });
}

function filterProductsByPrice(maxPrice) {
    const products = document.querySelectorAll('.product-card');
    products.forEach(product => {
        const price = parseInt(product.getAttribute('data-price'));
        if (price <= maxPrice) {
            product.style.display = 'block';
        } else {
            product.style.display = 'none';
        }
    });
}

// ===== MOBILE MENU =====
function initializeMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenu = document.querySelector('.mobile-menu');
    const closeMenuBtn = document.querySelector('.close-mobile-menu');
    
    if (!mobileMenuBtn || !mobileMenu) return;
    
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    
    if (closeMenuBtn) {
        closeMenuBtn.addEventListener('click', closeMobileMenu);
    }
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (mobileMenu.classList.contains('active') && 
            !mobileMenu.contains(e.target) && 
            e.target !== mobileMenuBtn) {
            closeMobileMenu();
        }
    });
    
    // Close menu with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
            closeMobileMenu();
        }
    });
}

function closeMobileMenu() {
    const mobileMenu = document.querySelector('.mobile-menu');
    mobileMenu.classList.remove('active');
    document.body.style.overflow = '';
}

// ===== BACK TO TOP BUTTON =====
function initializeBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    
    if (!backToTopBtn) return;
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });
    
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ===== NEWSLETTER FORM =====
function initializeNewsletter() {
    const newsletterForm = document.getElementById('newsletterForm');
    
    if (!newsletterForm) return;
    
    newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = this.querySelector('input[type="email"]').value;
        
        if (validateEmail(email)) {
            subscribeNewsletter(email);
        } else {
            showNotification('দয়া করে একটি সঠিক ইমেইল ঠিকানা দিন।', 'error');
        }
    });
}

function subscribeNewsletter(email) {
    // Save to localStorage
    let subscribers = JSON.parse(localStorage.getItem('newsletterSubscribers')) || [];
    if (!subscribers.includes(email)) {
        subscribers.push(email);
        localStorage.setItem('newsletterSubscribers', JSON.stringify(subscribers));
    }
    
    // Show success message
    showNotification('সাবস্ক্রিপশন সফল! ধন্যবাদ।', 'success');
    
    // Reset form
    document.getElementById('newsletterForm').reset();
}

// ===== PRODUCT ZOOM =====
function initializeProductZoom() {
    const productImages = document.querySelectorAll('.product-image-zoom');
    
    productImages.forEach(image => {
        image.addEventListener('mousemove', function(e) {
            const width = this.offsetWidth;
            const height = this.offsetHeight;
            const mouseX = e.offsetX;
            const mouseY = e.offsetY;
            
            const bgPosX = (mouseX / width * 100);
            const bgPosY = (mouseY / height * 100);
            
            this.style.backgroundPosition = `${bgPosX}% ${bgPosY}%`;
        });
        
        image.addEventListener('mouseleave', function() {
            this.style.backgroundPosition = 'center';
        });
    });
}

// ===== LAZY LOADING =====
function initializeLazyLoading() {
    const lazyImages = document.querySelectorAll('img.lazy');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });
    
    lazyImages.forEach(img => imageObserver.observe(img));
}

// ===== CART MANAGEMENT =====
function loadCartCount() {
    const cartCounts = document.querySelectorAll('.cart-count');
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    
    cartCounts.forEach(element => {
        element.textContent = totalItems;
        element.style.display = totalItems > 0 ? 'flex' : 'none';
    });
    
    // Update cart total
    const cartTotalElement = document.getElementById('cartTotal');
    if (cartTotalElement) {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotalElement.textContent = `৳${total.toLocaleString()}`;
    }
}

function addToCart(productId, productName, productPrice, productImage) {
    // Check if product already in cart
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: productName,
            price: productPrice,
            image: productImage,
            quantity: 1
        });
    }
    
    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update cart count
    loadCartCount();
    
    // Show notification
    showNotification(`${productName} কার্টে যোগ করা হয়েছে!`, 'success');
    
    // Update cart modal if open
    updateCartModal();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCartCount();
    updateCartModal();
    showNotification('পণ্যটি কার্ট থেকে সরানো হয়েছে।', 'success');
}

function updateCartQuantity(productId, quantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        if (quantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = quantity;
            localStorage.setItem('cart', JSON.stringify(cart));
            loadCartCount();
            updateCartModal();
        }
    }
}

function clearCart() {
    if (confirm('আপনি কি নিশ্চিত যে আপনি সব পণ্য কার্ট থেকে মুছতে চান?')) {
        cart = [];
        localStorage.removeItem('cart');
        loadCartCount();
        updateCartModal();
        showNotification('কার্ট খালি করা হয়েছে।', 'success');
    }
}

function updateCartModal() {
    const cartModal = document.getElementById('cartModal');
    if (cartModal && cartModal.classList.contains('show')) {
        renderCartItems();
    }
}

function renderCartItems() {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartEmpty = document.getElementById('cartEmpty');
    const cartTable = document.getElementById('cartTable');
    const cartSubtotal = document.getElementById('cartSubtotal');
    const cartShipping = document.getElementById('cartShipping');
    const cartTotal = document.getElementById('cartTotal');
    
    if (!cartItemsContainer) return;
    
    if (cart.length === 0) {
        if (cartEmpty) cartEmpty.style.display = 'block';
        if (cartTable) cartTable.style.display = 'none';
        return;
    }
    
    if (cartEmpty) cartEmpty.style.display = 'none';
    if (cartTable) cartTable.style.display = 'block';
    
    // Clear existing items
    cartItemsContainer.innerHTML = '';
    
    // Calculate totals
    let subtotal = 0;
    let shipping = 120; // Fixed shipping cost
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center gap-3">
                    <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
                    <div>
                        <h6 class="mb-0 bangla">${item.name}</h6>
                        <small class="text-muted bangla">৳${item.price.toLocaleString()}</small>
                    </div>
                </div>
            </td>
            <td>
                <div class="quantity-control">
                    <button class="btn btn-sm btn-outline-secondary" onclick="updateCartQuantity('${item.id}', ${item.quantity - 1})">-</button>
                    <span class="mx-2">${item.quantity}</span>
                    <button class="btn btn-sm btn-outline-secondary" onclick="updateCartQuantity('${item.id}', ${item.quantity + 1})">+</button>
                </div>
            </td>
            <td class="bangla">৳${itemTotal.toLocaleString()}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="removeFromCart('${item.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        cartItemsContainer.appendChild(row);
    });
    
    // Update totals
    if (cartSubtotal) cartSubtotal.textContent = `৳${subtotal.toLocaleString()}`;
    if (cartShipping) cartShipping.textContent = `৳${shipping.toLocaleString()}`;
    if (cartTotal) {
        const total = subtotal + shipping;
        cartTotal.textContent = `৳${total.toLocaleString()}`;
    }
}

// ===== WISHLIST MANAGEMENT =====
function addToWishlist(productId, productName, productPrice, productImage) {
    // Check if already in wishlist
    if (wishlist.some(item => item.id === productId)) {
        showNotification('পণ্যটি ইতিমধ্যেই উইশলিস্টে আছে!', 'info');
        return;
    }
    
    wishlist.push({
        id: productId,
        name: productName,
        price: productPrice,
        image: productImage
    });
    
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    showNotification(`${productName} উইশলিস্টে যোগ করা হয়েছে!`, 'success');
    
    // Update wishlist count
    updateWishlistCount();
}

function removeFromWishlist(productId) {
    wishlist = wishlist.filter(item => item.id !== productId);
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    showNotification('পণ্যটি উইশলিস্ট থেকে সরানো হয়েছে।', 'success');
    updateWishlistCount();
}

function updateWishlistCount() {
    const wishlistCounts = document.querySelectorAll('.wishlist-count');
    const count = wishlist.length;
    
    wishlistCounts.forEach(element => {
        element.textContent = count;
        element.style.display = count > 0 ? 'flex' : 'none';
    });
}

// ===== USER MANAGEMENT =====
function loadUserData() {
    if (!user) return;
    
    // Update user name in navbar
    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(element => {
        element.textContent = user.name;
    });
    
    // Update user email
    const userEmailElements = document.querySelectorAll('.user-email');
    userEmailElements.forEach(element => {
        element.textContent = user.email;
    });
}

function loginUser(email, password) {
    // Mock authentication - In real app, this would be an API call
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const foundUser = users.find(u => u.email === email && u.password === password);
    
    if (foundUser) {
        user = {
            id: foundUser.id,
            name: foundUser.name,
            email: foundUser.email,
            phone: foundUser.phone
        };
        
        localStorage.setItem('user', JSON.stringify(user));
        showNotification('সফলভাবে লগইন করা হয়েছে!', 'success');
        
        // Redirect to dashboard or previous page
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
        
        return true;
    } else {
        showNotification('ভুল ইমেইল বা পাসওয়ার্ড!', 'error');
        return false;
    }
}

function registerUser(name, email, password, phone) {
    // Check if user already exists
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const existingUser = users.find(u => u.email === email);
    
    if (existingUser) {
        showNotification('এই ইমেইল দিয়ে ইতিমধ্যে রেজিস্ট্রেশন করা হয়েছে!', 'error');
        return false;
    }
    
    // Create new user
    const newUser = {
        id: Date.now().toString(),
        name: name,
        email: email,
        password: password,
        phone: phone,
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Auto login
    user = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone
    };
    
    localStorage.setItem('user', JSON.stringify(user));
    showNotification('রেজিস্ট্রেশন সফল!', 'success');
    
    // Redirect to dashboard
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1500);
    
    return true;
}

function logoutUser() {
    if (confirm('আপনি কি লগ আউট করতে চান?')) {
        user = null;
        localStorage.removeItem('user');
        showNotification('সফলভাবে লগ আউট করা হয়েছে।', 'success');
        
        // Redirect to home page
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

// ===== NOTIFICATIONS =====
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.custom-notification');
    existingNotifications.forEach(notification => {
        notification.remove();
    });
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `custom-notification ${type}`;
    
    // Set icon based on type
    let icon = 'fas fa-info-circle';
    if (type === 'success') icon = 'fas fa-check-circle';
    if (type === 'error') icon = 'fas fa-exclamation-circle';
    if (type === 'warning') icon = 'fas fa-exclamation-triangle';
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="${icon}"></i>
            <span class="bangla">${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : 
                    type === 'error' ? '#ef4444' : 
                    type === 'warning' ? '#f59e0b' : '#2563eb'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 15px;
        animation: slideInRight 0.3s ease;
        font-family: 'Hind Siliguri', sans-serif;
        max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, 3000);
    
    // Add CSS animations if not exists
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
                flex: 1;
            }
            .notification-close {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 0;
                font-size: 16px;
                opacity: 0.7;
                transition: opacity 0.3s;
            }
            .notification-close:hover {
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
    }
}

// ===== FORM VALIDATION =====
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^(?:\+88|88)?(01[3-9]\d{8})$/;
    return re.test(phone);
}

function validatePassword(password) {
    return password.length >= 6;
}

// ===== SEARCH FUNCTIONALITY =====
function searchProducts(query) {
    if (!query.trim()) return;
    
    // In a real app, this would be an API call
    const products = document.querySelectorAll('.product-card');
    let found = false;
    
    products.forEach(product => {
        const name = product.querySelector('.product-title').textContent.toLowerCase();
        const category = product.getAttribute('data-category') || '';
        const description = product.getAttribute('data-description') || '';
        
        if (name.includes(query.toLowerCase()) || 
            category.includes(query.toLowerCase()) || 
            description.includes(query.toLowerCase())) {
            product.style.display = 'block';
            found = true;
        } else {
            product.style.display = 'none';
        }
    });
    
    // Show no results message
    const noResults = document.getElementById('noResults');
    if (noResults) {
        noResults.style.display = found ? 'none' : 'block';
    }
    
    if (!found) {
        showNotification('কোনো পণ্য পাওয়া যায়নি।', 'info');
    }
}

// ===== CHECKOUT PROCESS =====
function proceedToCheckout() {
    if (cart.length === 0) {
        showNotification('কার্ট খালি! প্রথমে কিছু পণ্য যোগ করুন।', 'warning');
        return;
    }
    
    // Save current cart to session for checkout
    sessionStorage.setItem('checkoutCart', JSON.stringify(cart));
    
    // Redirect to checkout page
    window.location.href = 'checkout.html';
}

function processOrder(orderData) {
    // Generate order ID
    const orderId = 'ORD' + Date.now().toString().slice(-8);
    
    // Create order object
    const order = {
        id: orderId,
        date: new Date().toISOString(),
        customer: orderData.customer,
        items: cart,
        shipping: orderData.shipping,
        payment: orderData.payment,
        total: calculateOrderTotal(),
        status: 'pending'
    };
    
    // Save order
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Clear cart
    cart = [];
    localStorage.removeItem('cart');
    loadCartCount();
    
    // Show success message
    showNotification(`অর্ডার সফল! আপনার অর্ডার আইডি: ${orderId}`, 'success');
    
    // Redirect to order confirmation
    setTimeout(() => {
        window.location.href = `order-confirmation.html?orderId=${orderId}`;
    }, 2000);
    
    return orderId;
}

function calculateOrderTotal() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = 120; // Fixed shipping
    return subtotal + shipping;
}

// ===== PRODUCT COMPARISON =====
let comparisonProducts = [];

function addToComparison(productId) {
    // Get product data
    const productElement = document.querySelector(`[data-product-id="${productId}"]`);
    if (!productElement) return;
    
    const product = {
        id: productId,
        name: productElement.getAttribute('data-name'),
        price: productElement.getAttribute('data-price'),
        category: productElement.getAttribute('data-category'),
        image: productElement.getAttribute('data-image'),
        features: JSON.parse(productElement.getAttribute('data-features') || '{}')
    };
    
    // Check if already in comparison
    if (comparisonProducts.some(p => p.id === productId)) {
        showNotification('পণ্যটি ইতিমধ্যেই তুলনায় আছে!', 'info');
        return;
    }
    
    // Add to comparison (max 4 products)
    if (comparisonProducts.length >= 4) {
        showNotification('সর্বোচ্চ ৪টি পণ্য তুলনা করা যাবে।', 'warning');
        return;
    }
    
    comparisonProducts.push(product);
    showNotification(`${product.name} তুলনায় যোগ করা হয়েছে!`, 'success');
    
    // Update comparison button
    updateComparisonButton();
}

function removeFromComparison(productId) {
    comparisonProducts = comparisonProducts.filter(p => p.id !== productId);
    updateComparisonButton();
    showNotification('পণ্যটি তুলনা থেকে সরানো হয়েছে।', 'success');
}

function updateComparisonButton() {
    const comparisonBtn = document.getElementById('comparisonBtn');
    const comparisonCount = document.getElementById('comparisonCount');
    
    if (comparisonBtn && comparisonCount) {
        const count = comparisonProducts.length;
        comparisonCount.textContent = count;
        comparisonBtn.disabled = count === 0;
    }
}

function openComparisonModal() {
    if (comparisonProducts.length === 0) {
        showNotification('প্রথমে কিছু পণ্য তুলনায় যোগ করুন।', 'warning');
        return;
    }
    
    // Create and show comparison modal
    showProductComparison(comparisonProducts);
}

function showProductComparison(products) {
    // This would open a modal showing product comparison table
    console.log('Showing product comparison:', products);
    // Implementation would go here
}

// ===== RATING SYSTEM =====
function submitRating(productId, rating, comment) {
    const review = {
        id: Date.now().toString(),
        productId: productId,
        userId: user ? user.id : 'anonymous',
        userName: user ? user.name : 'অতিথি',
        rating: rating,
        comment: comment,
        date: new Date().toISOString(),
        verified: user ? true : false
    };
    
    // Save review
    let reviews = JSON.parse(localStorage.getItem('reviews')) || [];
    reviews.push(review);
    localStorage.setItem('reviews', JSON.stringify(reviews));
    
    // Update product rating
    updateProductRating(productId);
    
    showNotification('রিভিউ সাবমিট করা হয়েছে! ধন্যবাদ।', 'success');
    
    return review;
}

function updateProductRating(productId) {
    const reviews = JSON.parse(localStorage.getItem('reviews')) || [];
    const productReviews = reviews.filter(r => r.productId === productId);
    
    if (productReviews.length === 0) return;
    
    const averageRating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
    
    // Update product rating display
    const ratingElements = document.querySelectorAll(`[data-product-id="${productId}"] .product-rating`);
    ratingElements.forEach(element => {
        element.innerHTML = generateStarRating(averageRating);
    });
}

function generateStarRating(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating)) {
            stars += '<i class="fas fa-star text-warning"></i>';
        } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
            stars += '<i class="fas fa-star-half-alt text-warning"></i>';
        } else {
            stars += '<i class="far fa-star text-warning"></i>';
        }
    }
    return stars;
}

// ===== ANALYTICS =====
function trackEvent(eventName, eventData = {}) {
    // In a real app, this would send data to analytics service
    const analyticsData = {
        event: eventName,
        data: eventData,
        timestamp: new Date().toISOString(),
        userId: user ? user.id : null,
        page: window.location.pathname
    };
    
    console.log('Analytics Event:', analyticsData);
    
    // Save to localStorage for demo
    let events = JSON.parse(localStorage.getItem('analyticsEvents')) || [];
    events.push(analyticsData);
    localStorage.setItem('analyticsEvents', JSON.stringify(events.slice(-100))); // Keep last 100 events
}

// ===== UTILITY FUNCTIONS =====
function formatPrice(price) {
    return new Intl.NumberFormat('bn-BD', {
        style: 'currency',
        currency: 'BDT',
        minimumFractionDigits: 0
    }).format(price).replace('BDT', '৳');
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

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

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ===== SETUP EVENT LISTENERS =====
function setupEventListeners() {
    // Search form
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const query = this.querySelector('input[type="search"]').value;
            searchProducts(query);
        });
    }
    
    // Add to cart buttons
    document.addEventListener('click', function(e) {
        if (e.target.closest('.add-to-cart-btn')) {
            const button = e.target.closest('.add-to-cart-btn');
            const productId = button.getAttribute('data-product-id');
            const productName = button.getAttribute('data-product-name');
            const productPrice = parseFloat(button.getAttribute('data-product-price'));
            const productImage = button.getAttribute('data-product-image');
            
            addToCart(productId, productName, productPrice, productImage);
            
            // Track event
            trackEvent('add_to_cart', {
                productId: productId,
                productName: productName,
                price: productPrice
            });
        }
    });
    
    // Add to wishlist buttons
    document.addEventListener('click', function(e) {
        if (e.target.closest('.add-to-wishlist-btn')) {
            const button = e.target.closest('.add-to-wishlist-btn');
            const productId = button.getAttribute('data-product-id');
            const productName = button.getAttribute('data-product-name');
            const productPrice = parseFloat(button.getAttribute('data-product-price'));
            const productImage = button.getAttribute('data-product-image');
            
            addToWishlist(productId, productName, productPrice, productImage);
            
            // Track event
            trackEvent('add_to_wishlist', {
                productId: productId,
                productName: productName
            });
        }
    });
    
    // Quick view buttons
    document.addEventListener('click', function(e) {
        if (e.target.closest('.quick-view-btn')) {
            const button = e.target.closest('.quick-view-btn');
            const productId = button.getAttribute('data-product-id');
            showQuickView(productId);
        }
    });
    
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('#loginEmail').value;
            const password = this.querySelector('#loginPassword').value;
            
            if (validateEmail(email) && validatePassword(password)) {
                loginUser(email, password);
            } else {
                showNotification('দয়া করে সঠিক তথ্য প্রদান করুন।', 'error');
            }
        });
    }
    
    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = this.querySelector('#registerName').value;
            const email = this.querySelector('#registerEmail').value;
            const password = this.querySelector('#registerPassword').value;
            const phone = this.querySelector('#registerPhone').value;
            
            if (name && validateEmail(email) && validatePassword(password) && validatePhone(phone)) {
                registerUser(name, email, password, phone);
            } else {
                showNotification('দয়া করে সব তথ্য সঠিকভাবে পূরণ করুন।', 'error');
            }
        });
    }
    
    // Checkout form
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                customer: {
                    name: this.querySelector('#checkoutName').value,
                    email: this.querySelector('#checkoutEmail').value,
                    phone: this.querySelector('#checkoutPhone').value,
                    address: this.querySelector('#checkoutAddress').value,
                    city: this.querySelector('#checkoutCity').value,
                    postalCode: this.querySelector('#checkoutPostalCode').value
                },
                shipping: this.querySelector('input[name="shipping"]:checked').value,
                payment: this.querySelector('input[name="payment"]:checked').value,
                notes: this.querySelector('#orderNotes').value
            };
            
            if (validateCheckoutForm(formData)) {
                processOrder(formData);
            }
        });
    }
    
    // Track page views
    trackEvent('page_view', {
        page_title: document.title,
        page_url: window.location.href
    });
}

// ===== QUICK VIEW MODAL =====
function showQuickView(productId) {
    // Get product data - in real app, this would be an API call
    const productElement = document.querySelector(`[data-product-id="${productId}"]`);
    if (!productElement) return;
    
    const product = {
        id: productId,
        name: productElement.getAttribute('data-name'),
        price: productElement.getAttribute('data-price'),
        oldPrice: productElement.getAttribute('data-old-price'),
        image: productElement.getAttribute('data-image'),
        category: productElement.getAttribute('data-category'),
        description: productElement.getAttribute('data-description'),
        features: JSON.parse(productElement.getAttribute('data-features') || '[]'),
        stock: parseInt(productElement.getAttribute('data-stock') || '0')
    };
    
    // Create modal HTML
    const modalHTML = `
        <div class="modal fade" id="quickViewModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title bangla">দ্রুত দেখুন</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <img src="${product.image}" alt="${product.name}" class="img-fluid rounded">
                                <div class="mt-3 d-flex gap-2">
                                    <button class="btn btn-primary flex-grow-1 add-to-cart-btn"
                                            data-product-id="${product.id}"
                                            data-product-name="${product.name}"
                                            data-product-price="${product.price}"
                                            data-product-image="${product.image}">
                                        <i class="fas fa-cart-plus me-2"></i> কার্টে যোগ করুন
                                    </button>
                                    <button class="btn btn-outline-danger add-to-wishlist-btn"
                                            data-product-id="${product.id}"
                                            data-product-name="${product.name}"
                                            data-product-price="${product.price}"
                                            data-product-image="${product.image}">
                                        <i class="fas fa-heart"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <h4 class="bangla mb-3">${product.name}</h4>
                                <div class="product-price mb-3">
                                    <span class="price-current bangla">৳${parseInt(product.price).toLocaleString()}</span>
                                    ${product.oldPrice ? `<span class="price-old bangla">৳${parseInt(product.oldPrice).toLocaleString()}</span>` : ''}
                                </div>
                                <div class="product-stock mb-3">
                                    <span class="badge ${product.stock > 0 ? 'bg-success' : 'bg-danger'}">
                                        ${product.stock > 0 ? 'স্টক আছে' : 'স্টক নেই'}
                                    </span>
                                    <span class="text-muted ms-2">${product.stock} পিস</span>
                                </div>
                                <div class="product-description mb-4">
                                    <p class="bangla">${product.description}</p>
                                </div>
                                ${product.features.length > 0 ? `
                                    <div class="product-features mb-4">
                                        <h6 class="bangla">বৈশিষ্ট্য:</h6>
                                        <ul class="bangla">
                                            ${product.features.map(feature => `<li>${feature}</li>`).join('')}
                                        </ul>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal
    const existingModal = document.getElementById('quickViewModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add new modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('quickViewModal'));
    modal.show();
    
    // Track event
    trackEvent('quick_view', {
        productId: product.id,
        productName: product.name
    });
}

// ===== WELCOME MESSAGE =====
function showWelcomeMessage() {
    // Check if this is first visit
    const firstVisit = !localStorage.getItem('hasVisited');
    
    if (firstVisit) {
        setTimeout(() => {
            showNotification('PremiumShop এ স্বাগতম! বিশেষ অফার পেতে আজই অ্যাকাউন্ট তৈরি করুন।', 'info');
            localStorage.setItem('hasVisited', 'true');
        }, 2000);
    }
}

// ===== CHECKOUT FORM VALIDATION =====
function validateCheckoutForm(formData) {
    if (!formData.customer.name.trim()) {
        showNotification('দয়া করে আপনার নাম দিন।', 'error');
        return false;
    }
    
    if (!validateEmail(formData.customer.email)) {
        showNotification('দয়া করে একটি সঠিক ইমেইল ঠিকানা দিন।', 'error');
        return false;
    }
    
    if (!validatePhone(formData.customer.phone)) {
        showNotification('দয়া করে একটি সঠিক মোবাইল নম্বর দিন।', 'error');
        return false;
    }
    
    if (!formData.customer.address.trim()) {
        showNotification('দয়া করে আপনার ঠিকানা দিন।', 'error');
        return false;
    }
    
    return true;
}

// ===== EXPORT FUNCTIONS FOR GLOBAL USE =====
// Make functions available globally
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.clearCart = clearCart;
window.addToWishlist = addToWishlist;
window.removeFromWishlist = removeFromWishlist;
window.loginUser = loginUser;
window.registerUser = registerUser;
window.logoutUser = logoutUser;
window.proceedToCheckout = proceedToCheckout;
window.searchProducts = searchProducts;
window.showNotification = showNotification;
window.addToComparison = addToComparison;
window.openComparisonModal = openComparisonModal;
window.submitRating = submitRating;
window.formatPrice = formatPrice;
window.formatDate = formatDate;

// ===== INITIALIZE ON WINDOW LOAD =====
window.addEventListener('load', function() {
    // Load cart and wishlist counts
    loadCartCount();
    updateWishlistCount();
    updateComparisonButton();
    
    // Render cart items if on cart page
    if (document.getElementById('cartItems')) {
        renderCartItems();
    }
    
    // Initialize any page-specific functionality
    initializePageSpecificFeatures();
});

function initializePageSpecificFeatures() {
    const path = window.location.pathname;
    
    if (path.includes('product-details.html')) {
        initializeProductDetails();
    } else if (path.includes('cart.html')) {
        initializeCartPage();
    } else if (path.includes('checkout.html')) {
        initializeCheckoutPage();
    } else if (path.includes('dashboard.html')) {
        initializeDashboard();
    }
}

function initializeProductDetails() {
    // Product quantity controls
    const quantityInput = document.getElementById('productQuantity');
    const minusBtn = document.querySelector('.quantity-minus');
    const plusBtn = document.querySelector('.quantity-plus');
    
    if (quantityInput && minusBtn && plusBtn) {
        minusBtn.addEventListener('click', () => {
            let value = parseInt(quantityInput.value);
            if (value > 1) {
                quantityInput.value = value - 1;
            }
        });
        
        plusBtn.addEventListener('click', () => {
            let value = parseInt(quantityInput.value);
            quantityInput.value = value + 1;
        });
    }
    
    // Product image gallery
    const mainImage = document.getElementById('mainProductImage');
    const thumbnails = document.querySelectorAll('.product-thumbnail');
    
    if (mainImage && thumbnails) {
        thumbnails.forEach(thumbnail => {
            thumbnail.addEventListener('click', function() {
                mainImage.src = this.src;
                thumbnails.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }
}

function initializeCartPage() {
    // Initialize cart page specific features
    const checkoutBtn = document.getElementById('proceedCheckout');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', proceedToCheckout);
    }
    
    const clearCartBtn = document.getElementById('clearCartBtn');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', clearCart);
    }
}

function initializeCheckoutPage() {
    // Load saved shipping info if exists
    const savedShipping = JSON.parse(localStorage.getItem('shippingInfo'));
    if (savedShipping) {
        Object.keys(savedShipping).forEach(key => {
            const input = document.getElementById(`checkout${key.charAt(0).toUpperCase() + key.slice(1)}`);
            if (input) {
                input.value = savedShipping[key];
            }
        });
    }
    
    // Save shipping info on change
    const shippingInputs = document.querySelectorAll('#checkoutForm input, #checkoutForm textarea');
    shippingInputs.forEach(input => {
        input.addEventListener('change', function() {
            const formData = {
                name: document.getElementById('checkoutName')?.value || '',
                email: document.getElementById('checkoutEmail')?.value || '',
                phone: document.getElementById('checkoutPhone')?.value || '',
                address: document.getElementById('checkoutAddress')?.value || '',
                city: document.getElementById('checkoutCity')?.value || '',
                postalCode: document.getElementById('checkoutPostalCode')?.value || ''
            };
            localStorage.setItem('shippingInfo', JSON.stringify(formData));
        });
    });
}

function initializeDashboard() {
    // Load user orders
    loadUserOrders();
    
    // Load user reviews
    loadUserReviews();
    
    // Initialize dashboard charts
    initializeDashboardCharts();
}

function loadUserOrders() {
    if (!user) return;
    
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const userOrders = orders.filter(order => order.customer.email === user.email);
    
    // Display orders in dashboard
    const ordersContainer = document.getElementById('userOrders');
    if (ordersContainer) {
        if (userOrders.length === 0) {
            ordersContainer.innerHTML = '<p class="text-center text-muted bangla">কোনো অর্ডার নেই</p>';
        } else {
            ordersContainer.innerHTML = userOrders.map(order => `
                <div class="order-item card mb-3">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-1 bangla">অর্ডার #${order.id}</h6>
                                <p class="text-muted mb-0 bangla">${formatDate(order.date)}</p>
                            </div>
                            <div>
                                <span class="badge ${order.status === 'delivered' ? 'bg-success' : 
                                                     order.status === 'pending' ? 'bg-warning' : 
                                                     'bg-info'}">
                                    ${order.status === 'delivered' ? 'ডেলিভার্ড' : 
                                      order.status === 'pending' ? 'পেন্ডিং' : 'প্রসেসিং'}
                                </span>
                                <h5 class="mt-2 mb-0 bangla">৳${order.total.toLocaleString()}</h5>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }
}

function loadUserReviews() {
    if (!user) return;
    
    const reviews = JSON.parse(localStorage.getItem('reviews')) || [];
    const userReviews = reviews.filter(review => review.userId === user.id);
    
    // Display reviews in dashboard
    const reviewsContainer = document.getElementById('userReviews');
    if (reviewsContainer) {
        if (userReviews.length === 0) {
            reviewsContainer.innerHTML = '<p class="text-center text-muted bangla">কোনো রিভিউ নেই</p>';
        } else {
            reviewsContainer.innerHTML = userReviews.map(review => `
                <div class="review-item card mb-3">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="mb-1 bangla">${review.productId}</h6>
                                <div class="mb-2">${generateStarRating(review.rating)}</div>
                                <p class="mb-0 bangla">${review.comment}</p>
                            </div>
                            <small class="text-muted bangla">${formatDate(review.date)}</small>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }
}

function initializeDashboardCharts() {
    // This would initialize charts on dashboard
    // Implementation depends on chart library used
}

// ===== ERROR HANDLING =====
window.addEventListener('error', function(e) {
    console.error('JavaScript Error:', e.error);
    
    // Show user-friendly error message
    if (e.error && e.error.message) {
        showNotification('দুঃখিত, কিছু সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।', 'error');
    }
});

// ===== OFFLINE SUPPORT =====
window.addEventListener('online', function() {
    showNotification('ইন্টারনেট সংযোগ পুনরুদ্ধার করা হয়েছে।', 'success');
});

window.addEventListener('offline', function() {
    showNotification('ইন্টারনেট সংযোগ নেই। কিছু বৈশিষ্ট্য কাজ নাও করতে পারে।', 'warning');
});

// ===== PERFORMANCE MONITORING =====
if ('performance' in window) {
    window.addEventListener('load', function() {
        setTimeout(function() {
            const perfData = window.performance.timing;
            const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
            
            trackEvent('performance_metrics', {
                page_load_time: pageLoadTime,
                dom_content_loaded: perfData.domContentLoadedEventEnd - perfData.navigationStart
            });
        }, 0);
    });
}

// ===== END OF MAIN.JS =====