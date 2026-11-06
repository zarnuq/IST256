// returns.js: jQuery product search plus an angularjs return form that sends the return to the api with ajax.

angular.module('returnsApp', []).controller('ReturnsCtrl', function ($scope, $http) {
  $scope.form = { fullName: '', email: '', details: '' };
  $scope.items = [];
  $scope.errors = {};
  $scope.reasons = ['Defective', 'Arrived damaged', 'Wrong item', 'Not compatible', 'Changed my mind'];
  $scope.conditions = ['New, unopened', 'Opened', 'Used', 'Damaged'];

  // called by the jQuery search when someone clicks "Return"
  $scope.addItem = function (p) {
    if ($scope.items.some(function (item) { return item.id === p.id; })) return;
    $scope.items.push({ id: p.id, name: p.description, price: p.price, image: p.image, reason: '', condition: '' });
  };

  $scope.removeItem = function (i) { $scope.items.splice(i, 1); };

  $scope.refundTotal = function () {
    return $scope.items.reduce(function (sum, item) { return sum + item.price; }, 0);
  };

  // the JSON document: who is returning what, and why
  $scope.returnDoc = function () {
    return {
      fullName: $scope.form.fullName.trim(),
      email: $scope.form.email.trim(),
      items: $scope.items,
      details: $scope.form.details.trim(),
      refundTotal: $scope.refundTotal()
    };
  };

  function validate(f, items) {
    const errors = {};
    if (!/^[A-Za-z .'-]{2,60}$/.test(f.fullName.trim())) errors.fullName = 'Name must be 2 to 60 letters.';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) errors.email = 'Enter a valid email, like name@example.com.';
    if (!items.length) errors.items = 'Search for a product and click Return to add it.';
    items.forEach(function (item, i) {
      if (!item.reason) errors['reason' + i] = 'Choose a reason.';
      if (!item.condition) errors['condition' + i] = 'Choose a condition.';
    });
    return errors;
  }

  $scope.submit = function () {
    $scope.errors = validate($scope.form, $scope.items);
    $scope.message = '';
    $scope.response = null;
    if (Object.keys($scope.errors).length) return;

    // AJAX POST to the Node.js RESTful API
    $http.post('/api/returns', $scope.returnDoc()).then(function (res) {
      $scope.success = true;
      $scope.response = res.data;
      $scope.message = 'Return submitted! Your return number is ' + res.data.id + '.';
    }, function (res) {
      $scope.success = false;
      $scope.message = res.data && res.data.errors ? res.data.errors.join(' ') : 'Could not reach the server. Run "node js/server.js" first.';
    });
  };
});

// start AngularJS by hand if it did not start on its own (a browser extension can stop the automatic start)
angular.element(function () {
  if (!angular.element(document.body).injector()) angular.bootstrap(document.body, ['returnsApp']);
});

// jQuery: search the products JSON document for things to return
let returnProducts = [];

// Shows the products that match the search box.
function showResults() {
  const term = $('#search').val().toLowerCase();
  $('#results').empty();
  returnProducts.forEach(function (p) {
    if (!(p.id + ' ' + p.description + ' ' + p.category).toLowerCase().includes(term)) return;
    const row = $('<li class="list-group-item d-flex gap-2 align-items-center"></li>');
    row.append($('<img class="thumb">').attr({ src: p.image, alt: p.description }));
    row.append($('<span class="flex-grow-1 small"></span>').text(p.description + ' - $' + p.price.toFixed(2)));
    row.append($('<button class="btn btn-sm btn-primary">Return</button>').click(function () {
      // hand the product to the AngularJS controller
      const scope = angular.element(document.body).scope();
      scope.$apply(function () { scope.addItem(p); });
    }));
    $('#results').append(row);
  });
}

$(function () {
  $('#search').on('input', showResults);
  $.getJSON('data/products.json', function (data) {
    returnProducts = data;
    showResults();
  });
});
