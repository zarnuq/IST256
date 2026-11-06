// billing.js: angularjs billing form that sends the billing details to the api with ajax.

const billingCart = JSON.parse(localStorage.getItem('partwise.cart') || '[]');
const DELIVERY = { 'Standard shipping': 9.99, 'Express shipping': 24.99, 'Store pickup': 0 };

angular.module('billingApp', []).controller('BillingCtrl', function ($scope, $http) {
  // delivery starts empty so the shopper has to pick one, same as checkout
  $scope.form = {
    fullName: '', street: '', city: '', state: '', zip: '',
    cardNumber: '', expiration: '', cvv: '', delivery: ''
  };
  $scope.errors = {};
  $scope.items = billingCart;
  $scope.deliveryOptions = Object.keys(DELIVERY);

  // totals update on their own when the delivery choice changes
  $scope.subtotal = function () {
    return $scope.items.reduce(function (sum, item) { return sum + item.price * item.quantity; }, 0);
  };
  $scope.deliveryCost = function () { return DELIVERY[$scope.form.delivery] || 0; };
  $scope.total = function () { return $scope.subtotal() + $scope.deliveryCost(); };

  // the JSON document: name, address and payment method
  // only the last 4 card digits go in it, and the security code is never sent
  $scope.billing = function () {
    const f = $scope.form;
    const digits = f.cardNumber.replace(/\D/g, '');
    return {
      fullName: f.fullName.trim(),
      address: { street: f.street.trim(), city: f.city.trim(), state: f.state.trim().toUpperCase(), zip: f.zip.trim() },
      payment: { method: 'Credit card', cardNumber: digits ? '************' + digits.slice(-4) : '', expiration: f.expiration },
      delivery: { method: f.delivery, cost: $scope.deliveryCost() },
      items: $scope.items,
      total: Number($scope.total().toFixed(2))
    };
  };

  function validate(f) {
    const errors = {};
    const digits = f.cardNumber.replace(/\D/g, '');

    // required first, then the format (same as checkout)
    if (!f.fullName.trim()) errors.fullName = 'Full name is required.';
    else if (!/^[A-Za-z .'-]{2,60}$/.test(f.fullName.trim())) errors.fullName = 'Name must be 2 to 60 letters.';
    if (!f.street.trim()) errors.street = 'Street address is required.';
    else if (f.street.trim().length < 5) errors.street = 'Street address must be at least 5 characters.';
    if (!f.city.trim()) errors.city = 'City is required.';
    else if (!/^[A-Za-z .'-]{2,50}$/.test(f.city.trim())) errors.city = 'City must be 2 to 50 letters.';
    if (!f.state.trim()) errors.state = 'State is required.';
    else if (!/^[A-Za-z]{2}$/.test(f.state.trim())) errors.state = 'Use 2 letters, like PA.';
    if (!f.zip.trim()) errors.zip = 'ZIP code is required.';
    else if (!/^\d{5}$/.test(f.zip.trim())) errors.zip = 'ZIP must be 5 digits.';
    if (!digits) errors.cardNumber = 'Card number is required.';
    else if (!/^\d{16}$/.test(digits)) errors.cardNumber = 'Card number must be 16 digits.';
    if (!f.expiration) {
      errors.expiration = 'Expiration date is required.';
    } else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(f.expiration)) {
      errors.expiration = 'Use MM/YY, like 08/28.';
    } else {
      // the card works until the end of its expiration month
      const parts = f.expiration.split('/');
      if (new Date(2000 + Number(parts[1]), Number(parts[0]), 1) <= new Date()) errors.expiration = 'This card has expired.';
    }
    if (!f.cvv) errors.cvv = 'Security code is required.';
    else if (!/^\d{3}$/.test(f.cvv)) errors.cvv = 'Security code must be 3 digits.';
    if (!f.delivery) errors.delivery = 'Choose a delivery option.';
    if (!$scope.items.length) errors.items = 'Your cart is empty.';
    return errors;
  }

  $scope.submit = function () {
    $scope.errors = validate($scope.form);
    $scope.message = '';
    $scope.response = null;
    if (Object.keys($scope.errors).length) return;

    // AJAX POST to the Node.js RESTful API
    $http.post('/api/billing', $scope.billing()).then(function (res) {
      $scope.success = true;
      $scope.response = res.data;
      $scope.message = 'Payment approved! Your confirmation number is ' + res.data.id + '.';
    }, function (res) {
      $scope.success = false;
      $scope.message = res.data && res.data.errors ? res.data.errors.join(' ') : 'Could not reach the server. Run "node js/server.js" first.';
    });
  };
});

// start AngularJS by hand if it did not start on its own (a browser extension can stop the automatic start)
angular.element(function () {
  if (!angular.element(document.body).injector()) angular.bootstrap(document.body, ['billingApp']);
});
