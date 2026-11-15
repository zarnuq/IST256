// cart number in the navbar
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('partwise.cart') || '[]');
  let count = 0;
  cart.forEach(function (item) { count += item.quantity; });
  const badge = document.getElementById('cartCount');
  if (!badge) return;
  badge.textContent = count;
  badge.hidden = count === 0;
  badge.parentElement.setAttribute('aria-label', 'Cart, ' + count + ' items');
}

document.addEventListener('DOMContentLoaded', updateCartCount);
