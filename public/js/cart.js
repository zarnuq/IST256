// cart page

let products = [];
let cart = JSON.parse(localStorage.getItem('partwise.cart') || '[]');

// jquery search
function showResults() {
  const term = $('#search').val().toLowerCase();
  $('#results').empty();
  products.forEach(function (p) {
    if (!(p.id + ' ' + p.description + ' ' + p.category).toLowerCase().includes(term)) return;
    const row = $('<li class="list-group-item d-flex justify-content-between align-items-center"></li>');
    row.append($('<span></span>').text(p.description + ' - $' + p.price.toFixed(2)));
    row.append($('<button class="btn btn-sm btn-primary">Add</button>').click(function () { addToCart(p); }));
    $('#results').append(row);
  });
}

// qty has to be 1-10
function addToCart(p) {
  const qty = Number($('#qty').val());
  if (!Number.isInteger(qty) || qty < 1 || qty > 10) {
    $('#qty').addClass('is-invalid');
    return;
  }
  $('#qty').removeClass('is-invalid');
  cart.push({ id: p.id, description: p.description, category: p.category, unit: p.unit, price: p.price, quantity: qty });
  showCart();
}

// redraw cart + total + json, then save to localStorage
function showCart() {
  let total = 0;
  $('#cartItems').empty();
  cart.forEach(function (item, i) {
    total += item.price * item.quantity;
    const row = $('<li class="list-group-item d-flex justify-content-between align-items-center"></li>');
    row.append($('<span></span>').text(item.quantity + ' x ' + item.description));
    row.append($('<button class="btn btn-sm btn-danger">Remove</button>').click(function () {
      cart.splice(i, 1);
      showCart();
    }));
    $('#cartItems').append(row);
  });
  $('#cartTotal').text(total.toFixed(2));
  $('#jsonView').text(JSON.stringify(cart, null, 2));
  localStorage.setItem('partwise.cart', JSON.stringify(cart));
  updateCartCount();
}

// ajax post to /api/cart
function saveCart() {
  if (!cart.length) {
    $('#saveMessage').attr('class', 'alert alert-danger mt-3').text('Your cart is empty. Add a product first.').prop('hidden', false);
    return;
  }
  $.ajax({
    url: '/api/cart',
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({ items: cart })
  }).done(function (res) {
    $('#saveMessage').attr('class', 'alert alert-success mt-3').text('Cart saved! ' + res.items.length + ' item(s).').prop('hidden', false);
  }).fail(function () {
    $('#saveMessage').attr('class', 'alert alert-danger mt-3').text('Could not reach the server. Run "node server.js" first.').prop('hidden', false);
  });
}

$(function () {
  showCart();
  $('#search').on('input', showResults);
  $('#saveCart').on('click', saveCart);

  // get products from the api
  $.getJSON('/api/products', function (data) {
    products = data;
    showResults();
  });
});
