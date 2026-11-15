// checkout page (angular + jquery)

const cart = JSON.parse(localStorage.getItem('partwise.cart') || '[]');

angular.module('checkoutApp', []).controller('CheckoutCtrl', function ($scope, $http) {
  $scope.form = { fullName: '', email: '', delivery: '', assembly: false };
  $scope.errors = {};

  // order json = form + cart
  $scope.order = function () {
    return angular.extend({ items: cart }, $scope.form);
  };

  function validate(f) {
    const errors = {};
    if (!f.fullName.trim()) errors.fullName = 'Full name is required.';
    else if (!/^[A-Za-z .'-]{2,60}$/.test(f.fullName.trim())) errors.fullName = 'Name must be 2 to 60 letters.';
    if (!/^\S+@\S+\.\S+$/.test(f.email || '')) errors.email = 'Enter a valid email, like name@example.com.';
    if (!f.delivery) errors.delivery = 'Choose a delivery option.';
    return errors;
  }

  $scope.submit = function () {
    $scope.errors = validate($scope.form);
    $scope.message = '';
    if (Object.keys($scope.errors).length) return;

    // save to shipping collection then go to billing
    $http.post('/api/shipping', $scope.order()).then(function () {
      window.location.href = 'billing.html';
    }, function () {
      $scope.message = 'Could not reach the server. Run "node server.js" first.';
    });
  };
});

// order summary from the cart
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
