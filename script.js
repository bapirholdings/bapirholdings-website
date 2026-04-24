// Navigation Logic
const navSlide = () => {
    const burger = document.querySelector('.burger');
    const nav = document.querySelector('.nav-links');
    if (burger && nav) {
        burger.addEventListener('click', () => {
            nav.classList.toggle('nav-active');
            burger.classList.toggle('toggle');
        });
    }
}

// Global Variables
let cart = [];
let allProducts = [];

// Cart Initialization
try {
    const savedCart = localStorage.getItem('bapirCart');
    cart = savedCart ? JSON.parse(savedCart) : [];
    if (!Array.isArray(cart)) cart = []; 
} catch (e) {
    console.error("Cart initialization failed:", e);
    cart = [];
}

const stateTaxRates = {
    "AL": 0.04, "AK": 0.00, "AZ": 0.056, "AR": 0.065, "CA": 0.0725,
    "CO": 0.029, "CT": 0.0635, "DE": 0.00, "DC": 0.06, "FL": 0.06,
    "GA": 0.04, "HI": 0.04, "ID": 0.06, "IL": 0.0625, "IN": 0.07,
    "IA": 0.06, "KS": 0.065, "KY": 0.06, "LA": 0.0445, "ME": 0.055,
    "MD": 0.06, "MA": 0.0625, "MI": 0.06, "MN": 0.06875, "MS": 0.07,
    "MO": 0.04225, "MT": 0.00, "NE": 0.055, "NV": 0.0685, "NH": 0.00,
    "NJ": 0.06625, "NM": 0.05125, "NY": 0.04, "NC": 0.0475, "ND": 0.05,
    "OH": 0.0575, "OK": 0.045, "OR": 0.00, "PA": 0.06, "RI": 0.07,
    "SC": 0.06, "SD": 0.045, "TN": 0.07, "TX": 0.0625, "UT": 0.0485,
    "VT": 0.06, "VA": 0.043, "WA": 0.065, "WV": 0.06, "WI": 0.05, "WY": 0.04
};

// Update Cart Count in Header
function updateCartCount() {
    const countElements = document.querySelectorAll('#cart-count, .cart-count');
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    countElements.forEach(el => {
        el.innerText = totalItems;
        el.style.display = totalItems > 0 ? "flex" : "none";
    });
}

// Load Products on Shop Page
async function loadProducts() {
    const grid = document.getElementById('productGrid') || document.getElementById('shop-container');
    if (!grid) return;

    try {
        const response = await fetch('products.json');
        allProducts = await response.json();
        
        grid.innerHTML = allProducts.map(product => `
            <div class="product-card" style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px; border: 1px solid #333; text-align: center; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <img src="${product.image}" alt="${product.name}" class="cigar-img" style="width: 100%; height: 200px; object-fit: contain; margin-bottom: 15px;">
                    <h2 style="color: #00ff88; font-size: 1.2rem; margin-bottom: 10px;">${product.name}</h2>
                    <p style="font-size: 0.9rem; color: #ccc; margin-bottom: 15px;">${product.description}</p>
                </div>
                <div>
                    <p style="font-weight: bold; font-size: 1.1rem; margin-bottom: 15px;">$${product.price.toFixed(2)}</p>
                    
                    <div class="quantity-selector">
                        <button onclick="adjustQty('qty-${product.id}', -1)">-</button>
                        <input type="number" id="qty-${product.id}" value="1" min="1" readonly>
                        <button onclick="adjustQty('qty-${product.id}', 1)">+</button>
                    </div>

                    <button class="add-to-cart-btn" onclick="addToCart(${product.id})" style="background: #00ff88; color: #000; border: none; padding: 10px 20px; border-radius: 4px; font-weight: bold; cursor: pointer; width: 100%;">
                        Add to Cart
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error("Loading error:", error);
        grid.innerHTML = `<p style="color: red; text-align: center; width: 100%;">Error loading products. Please ensure you are running a Local Server.</p>`;
    }
}

// Quantity adjust for Shop Page
window.adjustQty = (id, delta) => {
    const input = document.getElementById(id);
    if (!input) return;
    let newVal = parseInt(input.value) + delta;
    if (newVal < 1) newVal = 1;
    input.value = newVal;
};

// Add to Cart Logic
function addToCart(productId) {
    const qtyInput = document.getElementById(`qty-${productId}`);
    const quantityToAdd = qtyInput ? parseInt(qtyInput.value) : 1;
    const product = allProducts.find(p => p.id === productId);

    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += quantityToAdd;
    } else {
        cart.push({ ...product, quantity: quantityToAdd });
    }

    localStorage.setItem('bapirCart', JSON.stringify(cart));
    updateCartCount();
    
    if (qtyInput) qtyInput.value = 1;
}

// Render Cart on Checkout Page
function renderCart() {
    const container = document.getElementById('cart-items-display');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = '<p class="empty-cart-msg" style="color: #ccc; text-align: center; padding: 20px;">Your cart is empty.</p>';
        updateOrderSummary(0);
        return;
    }

    let subtotal = 0;
    container.innerHTML = cart.map((item, index) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        return `
            <div class="cart-item">
                <div class="cart-item-details" style="display: flex; gap: 15px; align-items: center;">
                    <img src="${item.image}" class="cart-item-img" style="width: 60px; height: 60px; object-fit: contain;">
                    <div class="cart-item-text">
                        <h4 style="color: #00ff88; margin: 0 0 5px 0;">${item.name}</h4>
                        <p style="margin: 0; color: #ccc;">$${item.price.toFixed(2)} each</p>
                    </div>
                </div>
                
                <div class="cart-controls" style="display: flex; flex-direction: column; align-items: flex-end; gap: 10px;">
                    <div class="quantity-selector" style="margin: 0;">
                        <button onclick="updateCartQty(${index}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateCartQty(${index}, 1)">+</button>
                    </div>
                    <button class="remove-btn" onclick="removeFromCart(${index})">Remove</button>
                </div>
            </div>
        `;
    }).join('');

    updateOrderSummary(subtotal);
}

// Update Quantity Inside the Checkout Cart
window.updateCartQty = (index, delta) => {
    cart[index].quantity += delta;
    if (cart[index].quantity < 1) {
        removeFromCart(index);
    } else {
        localStorage.setItem('bapirCart', JSON.stringify(cart));
        renderCart();
        updateCartCount();
    }
};

// Remove Item from Cart
window.removeFromCart = function(index) {
    cart.splice(index, 1);
    localStorage.setItem('bapirCart', JSON.stringify(cart));
    renderCart();
    updateCartCount();
};

// Calculate Taxes and Totals
function updateOrderSummary(subtotal) {
    const stateField = document.getElementById('state-input');
    const subtotalEl = document.getElementById('subtotal-val');
    if (!subtotalEl) return;

    const stateInput = stateField ? stateField.value.toUpperCase().trim() : "";
    const taxRate = stateTaxRates[stateInput] || 0;
    const salesTax = subtotal * taxRate;
    const total = subtotal + salesTax;

    subtotalEl.innerText = `$${subtotal.toFixed(2)}`;
    document.getElementById('tax-val').innerText = `$${salesTax.toFixed(2)}`;
    document.getElementById('total-val').innerText = `$${total.toFixed(2)}`;
}

// PayPal Integration Function
function initPayPalButton() {
    if (!window.paypal) return; // Prevent errors if PayPal script fails to load
    
    paypal.Buttons({
        style: {
            shape: 'rect',
            color: 'gold',
            layout: 'vertical',
            label: 'checkout',
        },
        createOrder: function(data, actions) {
            const totalStr = document.getElementById('total-val').innerText;
            const totalValue = totalStr.replace('$', '');

            if (parseFloat(totalValue) <= 0) {
                alert("Your cart is empty!");
                return;
            }

            return actions.order.create({
                purchase_units: [{
                    amount: {
                        currency_code: "USD",
                        value: totalValue
                    }
                }]
            });
        },
        onApprove: function(data, actions) {
            return actions.order.capture().then(function(orderData) {
                alert('Transaction completed by ' + orderData.payer.name.given_name + '!');
                localStorage.removeItem('bapirCart');
                window.location.href = "index.html"; // Send them home after success
            });
        },
        onError: function(err) {
            console.error('PayPal Error:', err);
        }
    }).render('#paypal-button-container');
}

// Privacy Modal Functions
window.openPrivacyModal = () => {
    const modal = document.getElementById("privacyModal");
    if (modal) modal.style.display = "block";
}

window.closePrivacyModal = () => {
    const modal = document.getElementById("privacyModal");
    if (modal) modal.style.display = "none";
}

// Initialization Logic
document.addEventListener('DOMContentLoaded', () => {
    navSlide();
    updateCartCount();

    // Shop Page
    if (document.getElementById('productGrid') || document.getElementById('shop-container')) {
        loadProducts(); 
    }

    // Checkout Page
    if (document.getElementById('cart-items-display')) {
        renderCart();   
        
        // Listen for state changes to update tax
        const stateInput = document.getElementById('state-input');
        if (stateInput) {
            stateInput.addEventListener('input', () => {
                let subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                updateOrderSummary(subtotal);
            });
        }

        // Initialize PayPal
        if (document.getElementById('paypal-button-container')) {
            initPayPalButton();
        }
    }
});