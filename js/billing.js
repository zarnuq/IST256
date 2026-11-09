// billing.js: angular billing form, sends json with ajax

const cart = JSON.parse(localStorage.getItem('partwise.cart') || '[]');

angular.module('billingApp', []).controller('BillingCtrl', function ($scope, $http) {
  $scope.form = { fullName: '', address: '', cardNumber: '', expiration: '', cvv: '' };
  $scope.errors = {};
  $scope.items = cart;

  $scope.total = function () {
    return cart.reduce(function (sum, item) { return sum + item.price * item.quantity; }, 0);
  };

  // billing json, only last 4 card digits, no security code
  $scope.billing = function () {
    const f = $scope.form;
    return {
      fullName: f.fullName,
      address: f.address,
      payment: { method: 'Credit card', cardNumber: '************' + f.cardNumber.slice(-4), expiration: f.expiration },
      items: cart,
      total: $scope.total()
    };
  };

  function validate(f) {
    const errors = {};
    if (!/^[A-Za-z .'-]{2,60}$/.test(f.fullName)) errors.fullName = 'Name must be 2 to 60 letters.';
    if (f.address.length < 5) errors.address = 'Enter your full address.';
    if (!/^\d{16}$/.test(f.cardNumber)) errors.cardNumber = 'Card number must be 16 digits.';
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(f.expiration)) errors.expiration = 'Use MM/YY, like 08/28.';
    if (!/^\d{3}$/.test(f.cvv)) errors.cvv = 'Security code must be 3 digits.';
    return errors;
  }

  $scope.submit = function () {
    $scope.errors = validate($scope.form);
    $scope.message = '';
    if (Object.keys($scope.errors).length) return;

    // ajax post to node api
    $http.post('/api/billing', $scope.billing()).then(function (res) {
      $scope.success = true;
      $scope.message = 'Payment approved! Your confirmation number is ' + res.data.id + '.';
    }, function () {
      $scope.success = false;
      $scope.message = 'Could not reach the server. Run "node js/server.js" first.';
    });
  };
});
