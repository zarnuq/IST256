// cart-count.js: shows how many items are in the cart on the cart icon in the navbar.

// Reads the cart and updates the number on the cart icon (hidden when the cart is empty).
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('partwise.cart') || '[]');
  const count = cart.reduce(function (sum, item) { return sum + item.quantity; }, 0);
  const badge = document.getElementById('cartCount');
  if (!badge) return;
  badge.textContent = count;
  badge.hidden = count === 0;
  badge.parentElement.setAttribute('aria-label', 'Cart, ' + count + ' items');
}

document.addEventListener('DOMContentLoaded', updateCartCount);
