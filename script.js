// script.js
function openPrivacyModal() {
    document.getElementById('privacyModal').style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevents scrolling behind the modal
}

function closePrivacyModal() {
    document.getElementById('privacyModal').style.display = 'none';
    document.body.style.overflow = 'auto'; // Restores scrolling
}

// Close the modal if the user clicks anywhere outside of the modal content
window.onclick = function(event) {
    var modal = document.getElementById('privacyModal');
    if (event.target == modal) {
        closePrivacyModal();
    }
}

async function loadProducts() {
    const grid = document.getElementById('product-grid');
    
    try {
        const response = await fetch('products.json'); // Grabs your data
        const products = await response.json();
        
        grid.innerHTML = ''; 

        products.forEach(product => {
            const saleBadge = product.onSale ? `<div class="sale-badge">SALE</div>` : '';
            const priceHTML = product.onSale 
                ? `<span class="sale-price">$${product.price}</span> <span class="original-price">$${product.originalPrice}</span>`
                : `$${product.price}`;

            const card = `
                <div class="product-card ${product.onSale ? 'sale-item' : ''}">
                    ${saleBadge}
                    <img src="${product.image}" alt="${product.name}" class="product-image">
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <p class="price">${priceHTML}</p>
                        <a href="${product.chaseLink}" class="btn-checkout">Buy Now</a>
                    </div>
                </div>
            `;
            grid.innerHTML += card;
        });
    } catch (error) {
        console.error("Error loading products:", error);
        grid.innerHTML = '<p>Unable to load products at this time.</p>';
    }
}