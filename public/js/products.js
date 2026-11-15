// products page (jquery + ajax)

let products = [];
let editingId = null;

// ajax get all products
function loadProducts() {
  $.getJSON('/api/products')
    .done(function (data) {
      products = data;
      render();
    })
    .fail(function () {
      $('#noResults').text('Could not reach the server. Run "node server.js" and open http://localhost:3000.').prop('hidden', false);
    });
}

function serverError(xhr) {
  let message = 'Could not reach the server.';
  if (xhr.responseJSON) message = xhr.responseJSON.errors.join(' ');
  $('#formAlert').text(message).prop('hidden', false);
}

function readProduct() {
  return {
    id: $('#id').val().trim(),
    description: $('#description').val().trim(),
    category: $('#category').val(),
    unit: $('#unit').val(),
    price: $('#price').val().trim(),
    additionalInfo: $('#additionalInfo').val().trim()
  };
}

// returns {field: error message}
function validate(p) {
  const errors = {};
  if (!/^[A-Za-z0-9-]{2,40}$/.test(p.id)) errors.id = 'ID must be 2 to 40 letters, numbers or hyphens.';
  else if (!editingId && products.some(function (x) { return x.id === p.id; })) errors.id = 'That ID is already used.';
  if (p.description.length < 2) errors.description = 'Enter a description.';
  if (!p.category) errors.category = 'Choose a category.';
  if (!p.unit) errors.unit = 'Choose a unit.';
  if (!(Number(p.price) > 0)) errors.price = 'Price must be a number above 0.';
  return errors;
}

function showErrors(errors) {
  $('#productForm [name]').each(function () {
    $(this).toggleClass('is-invalid', Boolean(errors[this.name]))
      .next('.invalid-feedback').text(errors[this.name] || '');
  });
  $('#productForm .is-invalid').first().trigger('focus');
}

// back to add mode
function resetForm() {
  editingId = null;
  $('#productForm')[0].reset();
  $('#id').prop('readonly', false);
  $('#formTitle').text('Add a product');
  $('#saveBtn').text('Add product');
  showErrors({});
}

function startEdit(p) {
  editingId = p.id;
  $('#id').val(p.id);
  $('#description').val(p.description);
  $('#category').val(p.category);
  $('#unit').val(p.unit);
  $('#price').val(p.price);
  $('#additionalInfo').val(p.additionalInfo);
  $('#id').prop('readonly', true);
  $('#formTitle').text('Edit ' + p.id);
  $('#saveBtn').text('Save changes');
  $('#formAlert').prop('hidden', true);
  $('#productForm')[0].scrollIntoView({ behavior: 'smooth' });
}

// same cart the cart page uses
function addToCart(p, button) {
  const cart = JSON.parse(localStorage.getItem('partwise.cart') || '[]');
  const item = cart.find(function (x) { return x.id === p.id; });
  if (item) item.quantity += 1;
  else cart.push({ id: p.id, description: p.description, category: p.category, unit: p.unit, price: p.price, quantity: 1 });
  localStorage.setItem('partwise.cart', JSON.stringify(cart));
  updateCartCount();
  $(button).text('Added!');
  setTimeout(function () { $(button).text('Add to cart'); }, 1000);
}

// one product card. using .text() so html doesnt get injected
function card(p) {
  const body = $('<div class="card-body d-flex flex-column">').append(
    $('<p class="small text-body-secondary mb-1">').text(p.category + ' · ' + p.id),
    $('<h3 class="h6 card-title">').text(p.description),
    $('<p class="card-text small">').text(p.additionalInfo),
    $('<p class="fw-bold mt-auto">').text('$' + p.price.toFixed(2) + ' / ' + p.unit),
    $('<div class="d-flex gap-2">').append(
      $('<button type="button" class="btn btn-sm btn-dark">Add to cart</button>').on('click', function () { addToCart(p, this); }),
      $('<button type="button" class="btn btn-sm btn-primary">Edit</button>').on('click', function () { startEdit(p); }),
      $('<button type="button" class="btn btn-sm btn-outline-danger">Delete</button>').on('click', function () {
        if (!confirm('Delete ' + p.description + '?')) return;
        $.ajax({ url: '/api/products/' + p.id, method: 'DELETE' })
          .done(function () {
            if (editingId === p.id) resetForm();
            loadProducts();
          })
          .fail(serverError);
      })
    )
  );
  const cardDiv = $('<div class="card h-100">');
  if (p.image) {
    cardDiv.append($('<img class="card-img-top p-3" height="180" style="object-fit: contain">').attr({ src: p.image, alt: p.description }));
  }
  cardDiv.append(body);
  return $('<div class="col-md-6 col-lg-4">').append(cardDiv);
}

// redraw cards + json
function render() {
  const term = $('#search').val().toLowerCase();
  const category = $('#filter').val();
  let count = 0;

  $('#productGrid').empty();
  products.forEach(function (p) {
    if (category && p.category !== category) return;
    if (!(p.id + ' ' + p.description + ' ' + p.additionalInfo).toLowerCase().includes(term)) return;
    $('#productGrid').append(card(p));
    count++;
  });
  $('#noResults').prop('hidden', count > 0);
  $('#productCount').text(products.length);
  $('#jsonView').text(JSON.stringify(products, null, 2));
}

$(function () {
  $('#search, #filter').on('input change', render);
  $('#cancelBtn').on('click', resetForm);

  $('#productForm').on('submit', function (event) {
    event.preventDefault();
    const p = readProduct();
    const errors = validate(p);
    showErrors(errors);
    $('#formAlert').prop('hidden', true);
    if (Object.keys(errors).length) return;

    p.price = Number(p.price);
    const editing = Boolean(editingId);
    // PUT if editing, POST if new
    $.ajax({
      url: editing ? '/api/products/' + editingId : '/api/products',
      method: editing ? 'PUT' : 'POST',
      contentType: 'application/json',
      data: JSON.stringify(p)
    }).done(function () {
      resetForm();
      loadProducts();
      $('#formAlert').text((editing ? 'Updated ' : 'Added ') + p.description + '.').prop('hidden', false);
    }).fail(serverError);
  });

  loadProducts();
});
