// main.js

// Ensure GSAP and ScrollTrigger are loaded before this script
if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.error('GSAP or ScrollTrigger is not loaded. Please ensure the CDN links are correctly placed in your HTML.');
} else {
    gsap.registerPlugin(ScrollTrigger);
    console.log('GSAP and ScrollTrigger registered.');
}

document.addEventListener('DOMContentLoaded', function () {
    // --- Preloader Logic ---
    const preloader = document.getElementById('preloader');
    if (preloader) {
        window.addEventListener('load', () => {
            gsap.to(preloader, {
                opacity: 0,
                visibility: 'hidden',
                pointerEvents: 'none',
                duration: 1, // Matches CSS transition duration for fade-out
                ease: "power2.out",
                onComplete: () => {
                    document.body.style.overflow = ''; // Restore body scroll after preloader fades
                    console.log('Preloader hidden and scroll restored.');
                }
            });
        });
        document.body.style.overflow = 'hidden'; // Hide body scroll until preloader fades
    }

    // --- Locomotive Scroll Initialization ---
    let scroll;
    const scrollContainer = document.querySelector('[data-scroll-container]');
    if (scrollContainer) {
        scroll = new LocomotiveScroll({
            el: scrollContainer,
            smooth: true,
            // Adjust for fixed nav if needed
            // smoothMobile: true, // Consider for mobile
            // getSpeed: true,
            // getDirection: true,
            // etc.
        });

        // Update ScrollTrigger on Locomotive Scroll events
        scroll.on('scroll', ScrollTrigger.update);

        // Tell ScrollTrigger to use Locomotive Scroll's scroll proxy
        ScrollTrigger.scrollerProxy(scrollContainer, {
            scrollTop(value) {
                return arguments.length ? scroll.scrollTo(value, 0, 0) : scroll.scroll.instance.scroll.y;
            },
            getBoundingClientRect() {
                return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
            },
            pinType: scrollContainer.style.transform ? 'transform' : 'fixed'
        });

        // Refresh ScrollTrigger and Locomotive Scroll after all DOM changes
        ScrollTrigger.refresh();
        scroll.update();
        console.log('Locomotive Scroll initialized.');
    } else {
        console.warn('Locomotive Scroll container [data-scroll-container] not found.');
        // Fallback for ScrollTrigger if Locomotive Scroll is not used
        gsap.to(".nav", {
            backgroundColor: "#000",
            height: 80,
            boxShadow: "0 5px 20px rgba(0,0,0,0.5)",
            duration: 0.3,
            ease: "power1.inOut",
            scrollTrigger: {
                trigger: "body",
                start: "top -100",
                toggleActions: "play none reverse none",
                scrub: true,
            }
        });
    }

    // --- Search Bar and Product Filtering Logic ---
    const searchIcon = document.getElementById('search-icon');
    const searchContainer = document.querySelector('.search-container');
    const searchBar = document.getElementById('search-bar');
    const products = document.querySelectorAll('.product-grid .product'); // Select all products

    // Toggle search bar visibility
    searchIcon.addEventListener('click', function (event) {
        event.stopPropagation();
        searchContainer.classList.toggle('active');
        if (searchContainer.classList.contains('active')) {
            searchBar.focus();
        }
    });

    // Close search bar when clicking outside
    document.addEventListener('click', function (event) {
        if (!searchContainer.contains(event.target) && searchContainer.classList.contains('active')) {
            searchContainer.classList.remove('active');
        }
    });

    // Filter products based on search input
    searchBar.addEventListener('input', function () {
        const searchTerm = searchBar.value.toLowerCase().trim();
        products.forEach(function (product) {
            const title = product.querySelector('h4').textContent.toLowerCase();
            if (title.includes(searchTerm)) {
                gsap.to(product, { opacity: 1, display: 'flex', duration: 0.3, onComplete: () => product.style.display = 'flex' });
            } else {
                gsap.to(product, { opacity: 0, duration: 0.3, onComplete: () => product.style.display = 'none' });
            }
        });
        if (scroll) scroll.update(); // Update Locomotive Scroll after content changes
    });

    // --- Add to Cart Functionality ---
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalSpan = document.getElementById('cart-total');
    const cartItemCountSpan = document.getElementById('cart-item-count');
    const emptyCartMessage = document.querySelector('.empty-cart-message');
    const overlay = document.querySelector('.overlay'); // Ensure overlay is selected

    let cart = JSON.parse(localStorage.getItem('nikeShoppingCart')) || [];

    // In a real app, this would be fetched from a backend. We'll populate it from existing HTML for now.
    const productsData = [];
    products.forEach(productElement => {
        const id = parseInt(productElement.dataset.productId);
        const name = productElement.querySelector('h4').textContent;
        const priceText = productElement.querySelector('.price').textContent;
        const price = parseFloat(priceText.replace('$', ''));
        const image = productElement.querySelector('img').src;
        productsData.push({ id, name, price, image });
    });

    function saveCart() {
        localStorage.setItem('nikeShoppingCart', JSON.stringify(cart));
        updateCartDisplay();
    }

    function getProductById(id) {
        return productsData.find(product => product.id === id);
    }

    function updateCartDisplay() {
        cartItemsContainer.innerHTML = '';
        let total = 0;
        let itemCount = 0;

        if (cart.length === 0) {
            emptyCartMessage.style.display = 'block';
        } else {
            emptyCartMessage.style.display = 'none';
            cart.forEach(item => {
                const product = getProductById(item.id);
                if (product) {
                    const cartItemElement = document.createElement('div');
                    cartItemElement.classList.add('cart-item');
                    cartItemElement.innerHTML = `
                        <img src="${product.image}" alt="${product.name}" class="cart-item-image">
                        <div class="cart-item-details">
                            <h4>${product.name}</h4>
                            <p>$${product.price.toFixed(2)}</p>
                        </div>
                        <div class="cart-item-quantity">
                            <button type="button" data-id="${product.id}" class="decrease-quantity">-</button>
                            <span>${item.quantity}</span>
                            <button type="button" data-id="${product.id}" class="increase-quantity">+</button>
                        </div>
                        <button type="button" data-id="${product.id}" class="remove-item-btn">Remove</button>
                    `;
                    cartItemsContainer.appendChild(cartItemElement);

                    total += product.price * item.quantity;
                    itemCount += item.quantity;
                }
            });
        }

        cartTotalSpan.textContent = total.toFixed(2);
        cartItemCountSpan.textContent = itemCount;
        if (scroll) scroll.update(); // Update Locomotive Scroll after cart content changes
    }

    function addProductToCart(productId) {
        const existingItemIndex = cart.findIndex(item => item.id === productId);

        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity++;
        } else {
            cart.push({ id: productId, quantity: 1 });
        }
        saveCart();
    }

    function changeQuantity(productId, change) {
        const itemIndex = cart.findIndex(item => item.id === productId);

        if (itemIndex > -1) {
            cart[itemIndex].quantity += change;
            if (cart[itemIndex].quantity <= 0) {
                cart.splice(itemIndex, 1); // Remove if quantity is 0 or less
            }
            saveCart();
        }
    }

    function removeItemFromCart(productId) {
        cart = cart.filter(item => item.id !== productId);
        saveCart();
        console.log('Item removed from bag!');
    }

    // Global functions for HTML onclick attributes (if used)
    window.clearCart = function () {
        cart = [];
        saveCart();
        alert('Your Nike bag has been cleared!'); // You might want to replace this with a better UI notification
        toggleCart();
    }

    window.toggleCart = function () {
        cartSidebar.classList.toggle('open');
        document.body.classList.toggle('cart-open');
        if (overlay) overlay.classList.toggle('active');
        if (scroll) scroll.update(); // Update scroll on cart toggle
    }

    // Add to Cart button listener (using event delegation on product showcase)
    document.querySelector('.product-showcase').addEventListener('click', (event) => {
        if (event.target.classList.contains('add-to-cart-btn')) {
            const productId = parseInt(event.target.dataset.id);
            addProductToCart(productId);
            console.log(`${getProductById(productId).name} added to bag!`);
            toggleCart(); // Open cart after adding
        }
    });

    // Cart item quantity and remove button listeners (event delegation)
    cartItemsContainer.addEventListener('click', (event) => {
        const target = event.target;
        const productId = parseInt(target.dataset.id);

        if (target.classList.contains('increase-quantity')) {
            changeQuantity(productId, 1);
        } else if (target.classList.contains('decrease-quantity')) {
            changeQuantity(productId, -1);
        } else if (target.classList.contains('remove-item-btn')) {
            removeItemFromCart(productId);
            console.log('Item removed from bag!');
        }
    });

    updateCartDisplay(); // Initial display of cart items

    // --- GSAP Animations Integration ---

    // 1. Hero Section Entrance Animation (for both index and men pages)
    // Make sure your hero content has classes like 'hero-subtitle', 'hero-title', etc. as discussed previously.
    gsap.from(".hero-subtitle", {
        opacity: 0,
        y: 20,
        duration: 0.8,
        ease: "power2.out",
        delay: 0.5 // Start after preloader is mostly gone
    });
    // For more advanced text staggering, consider using SplitType or SplitText
    const heroTitle = document.querySelector(".hero-title");
    if (heroTitle) {
        // Using SplitType for a nice word stagger
        const splitTitle = new SplitType(heroTitle, { types: 'lines, words' });
        gsap.from(splitTitle.words, {
            opacity: 0,
            y: 50,
            rotationX: 90,
            stagger: 0.08,
            duration: 0.6,
            ease: "power3.out",
            delay: 0.7 // Start after subtitle
        });
    }

    gsap.from(".hero-description", {
        opacity: 0,
        y: 20,
        duration: 1,
        ease: "power2.out",
        delay: 1.2
    });

    gsap.from(".hero-button", {
        opacity: 0,
        y: 20,
        duration: 0.8,
        ease: "elastic.out(1, 0.7)",
        delay: 1.7
    });

    gsap.from(".hero-gif", { // Assuming you have a class for your main hero GIF/image
        opacity: 0,
        x: 100,
        scale: 0.8,
        duration: 1.5,
        ease: "power3.out",
        delay: 1
    });

    // 2. Product Card Hover Effects (replace CSS transitions for a smoother feel)
    // IMPORTANT: Remove or comment out the `transition` properties for .product img, .add-to-cart-btn, etc. in your CSS
    // Let GSAP control these.
    document.querySelectorAll(".product").forEach(product => {
        let img = product.querySelector("img");
        let info = product.querySelector(".product-info");
        let btn = product.querySelector(".add-to-cart-btn");

        let tl = gsap.timeline({ paused: true });

        // Define hover animation timeline
        tl.to(img, {
            scale: 1.15,
            rotate: 0,
            duration: 0.4,
            ease: "power2.out"
        }, 0) // Start at the same time
        .to(info, {
            opacity: 0,
            y: -20,
            duration: 0.2
        }, 0)
        .to(btn, {
            bottom: "20px",
            opacity: 1,
            duration: 0.3,
            ease: "back.out(1.7)"
        }, 0.1); // Slightly delay button for sequential feel

        product.addEventListener("mouseenter", () => tl.play());
        product.addEventListener("mouseleave", () => tl.reverse());
    });

    // 3. Scroll-Triggered Animations for Sections and Grids
    // Section Titles (Applies to all sections with h2)
    document.querySelectorAll(".product-showcase h2, .collaborations-section h2, .category-explore h2, .men-categories-section h2, .men-featured-products-section h2, .men-shop-by-sport-section h2").forEach(heading => {
        gsap.from(heading, {
            opacity: 0,
            y: 50,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
                trigger: heading,
                start: "top 80%", // When the top of the heading is 80% from the viewport top
                toggleActions: "play none none reverse", // Play on entry, reverse on exit
                scroller: scrollContainer // Link to Locomotive Scroll
                // markers: true // Uncomment for debugging
            }
        });
    });

    // Staggered Grid Animations (products, collaborations, categories)
    // Products Grid
    gsap.from(".product-grid .product", {
        opacity: 0,
        y: 50,
        scale: 0.8,
        stagger: 0.1, // Stagger each product
        duration: 0.8,
        ease: "back.out(1.7)",
        scrollTrigger: {
            trigger: ".product-grid",
            start: "top 75%", // When the top of the grid is 75% from the viewport top
            toggleActions: "play none none reverse",
            scroller: scrollContainer, // Link to Locomotive Scroll
            // markers: true
        }
    });

    // Collaboration Grid
    gsap.from(".collaboration-grid > div", { // Target direct children of collaboration-grid
        opacity: 0,
        y: 50,
        scale: 0.8,
        stagger: 0.12,
        duration: 0.9,
        ease: "back.out(1.7)",
        scrollTrigger: {
            trigger: ".collaboration-grid",
            start: "top 75%",
            toggleActions: "play none none reverse",
            scroller: scrollContainer,
            // markers: true
        }
    });

    // Category Grid
    gsap.from(".category-grid .category-card", {
        opacity: 0,
        y: 50,
        scale: 0.8,
        stagger: 0.1,
        duration: 0.8,
        ease: "back.out(1.7)",
        scrollTrigger: {
            trigger: ".category-grid",
            start: "top 75%",
            toggleActions: "play none none reverse",
            scroller: scrollContainer,
            // markers: true
        }
    });

    // Men's Category Grid
    gsap.from(".men-category-grid .men-category-card", {
        opacity: 0,
        y: 50,
        scale: 0.8,
        stagger: 0.1,
        duration: 0.8,
        ease: "back.out(1.7)",
        scrollTrigger: {
            trigger: ".men-category-grid",
            start: "top 75%",
            toggleActions: "play none none reverse",
            scroller: scrollContainer,
            // markers: true
        }
    });

    // Men's Shop by Sport Grid
    gsap.from(".sport-grid .sport-card", {
        opacity: 0,
        y: 50,
        scale: 0.8,
        stagger: 0.1,
        duration: 0.8,
        ease: "back.out(1.7)",
        scrollTrigger: {
            trigger: ".sport-grid",
            start: "top 75%",
            toggleActions: "play none none reverse",
            scroller: scrollContainer,
            // markers: true
        }
    });

    // 4. Navigation Bar Transitions (Shrink/Change Background on Scroll)
    // Note: If Locomotive Scroll is not present, this will default to window scroll.
    gsap.to(".nav", {
        backgroundColor: "#000", // Darker background
        height: 80, // Shrink height
        boxShadow: "0 5px 20px rgba(0,0,0,0.5)",
        duration: 0.3,
        ease: "power1.inOut",
        scrollTrigger: {
            trigger: "body", // Trigger when body scrolls
            start: "top -=100", // When scrolled 100px down from the top
            end: "top -=101", // End immediately after start (to trigger toggleActions)
            scrub: true, // Smoothly animate with scroll
            toggleActions: "play none reverse none", // Play on entry, reverse on exit
            scroller: scrollContainer // Link to Locomotive Scroll
        }
    });
});