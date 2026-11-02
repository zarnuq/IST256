// checkout.js angularjs order form that sends the order to the api with ajax.

const cart = JSON.parse(localStorage.getItem('partwise.cart') || '[]');

angular.module('checkoutApp', []).controller('CheckoutCtrl', function ($scope, $http) {
  $scope.form = { fullName: '', email: '', delivery: 'Standard shipping', date: null, assembly: false };
  $scope.errors = {};

  // the JSON document: form options plus the cart items
  $scope.order = function () {
    return angular.extend({ items: cart }, $scope.form);
  };

  function validate(f) {
    const errors = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!/^[A-Za-z .'-]{2,60}$/.test(f.fullName.trim())) errors.fullName = 'Name must be 2 to 60 letters.';
    if (!/^\S+@\S+\.\S+$/.test(f.email || '')) errors.email = 'Enter a valid email, like name@example.com.';
    if (!f.date || f.date < today) errors.date = 'Choose today or a later date.';
    return errors;
  }

  $scope.submit = function () {
    $scope.errors = validate($scope.form);
    $scope.message = '';
    if (Object.keys($scope.errors).length) return;

    // AJAX POST to the RESTful API (built in a later lab)
    $http.post('/api/orders', $scope.order()).then(function () {
      $scope.message = 'Order placed!';
    }, function () {
      $scope.message = 'Order is valid. API not built yet, so order.json is ready to send.';
    });
  };
});

// jQuery: show the cart items saved by the Cart page
$(function () {
  let total = 0;
  cart.forEach(function (item) {
    total += item.price * item.quantity;
    $('#summary').append($('<li class="list-group-item d-flex justify-content-between"></li>')
      .append($('<span></span>').text(item.quantity + ' x ' + item.description))
      .append($('<span></span>').text('$' + (item.price * item.quantity).toFixed(2))));
  });
  $('#total').text(total.toFixed(2));
});
