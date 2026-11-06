// checkout.js angularjs order form that sends the order to the api with ajax.

const cart = JSON.parse(localStorage.getItem('partwise.cart') || '[]');

angular.module('checkoutApp', []).controller('CheckoutCtrl', function ($scope, $http) {
  $scope.form = { fullName: '', email: '', delivery: '', assembly: false };
  $scope.errors = {};

  // the JSON document: form options plus the cart items
  $scope.order = function () {
    return angular.extend({ items: cart }, $scope.form);
  };

  function validate(f) {
    const errors = {};
    if (!f.fullName.trim()) errors.fullName = 'Full name is required.';
    else if (!/^[A-Za-z .'-]{2,60}$/.test(f.fullName.trim())) errors.fullName = 'Name must be 2 to 60 letters.';
    if (!f.email) errors.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(f.email)) errors.email = 'Enter a valid email, like name@example.com.';
    if (!f.delivery) errors.delivery = 'Choose a delivery option.';
    return errors;
  }

  $scope.submit = function () {
    $scope.errors = validate($scope.form);
    $scope.message = '';
    if (Object.keys($scope.errors).length) return;

    // AJAX POST to the RESTful API (built in a later lab)
    $http.post('/api/orders', $scope.order()).then(function () {
      // order saved, so send them on to pay
      window.location.href = 'billing.html';
    }, function () {
      $scope.message = 'Order is valid. API not built yet, so order.json is ready to send.';
    });
  };
});

// start AngularJS by hand if it did not start on its own (a browser extension can stop the automatic start)
angular.element(function () {
  if (!angular.element(document.body).injector()) angular.bootstrap(document.body, ['checkoutApp']);
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
