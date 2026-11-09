// returns.js: jquery search + angular return form, sends json with ajax

angular.module('returnsApp', []).controller('ReturnsCtrl', function ($scope, $http) {
  $scope.form = { fullName: '', email: '', details: '' };
  $scope.items = [];
  $scope.errors = {};
  $scope.reasons = ['Defective', 'Arrived damaged', 'Wrong item', 'Not compatible', 'Changed my mind'];
  $scope.conditions = ['New, unopened', 'Opened', 'Used', 'Damaged'];

  // jquery return button calls this
  $scope.addItem = function (p) {
    if ($scope.items.some(function (item) { return item.id === p.id; })) return;
    $scope.items.push({ id: p.id, name: p.description, price: p.price, image: p.image, reason: '', condition: '' });
  };

  $scope.removeItem = function (i) { $scope.items.splice(i, 1); };

  // return json
  $scope.returnDoc = function () {
    return angular.extend({ items: $scope.items }, $scope.form);
  };

  function validate(f, items) {
    const errors = {};
    if (!/^[A-Za-z .'-]{2,60}$/.test(f.fullName)) errors.fullName = 'Name must be 2 to 60 letters.';
    if (!/^\S+@\S+\.\S+$/.test(f.email || '')) errors.email = 'Enter a valid email, like name@example.com.';
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
    if (Object.keys($scope.errors).length) return;

    // ajax post to node api
    $http.post('/api/returns', $scope.returnDoc()).then(function (res) {
      $scope.success = true;
      $scope.message = 'Return submitted! Your return number is ' + res.data.id + '.';
    }, function () {
      $scope.success = false;
      $scope.message = 'Could not reach the server. Run "node js/server.js" first.';
    });
  };
});

// jquery product search
let products = [];

function showResults() {
  const term = $('#search').val().toLowerCase();
  $('#results').empty();
  products.forEach(function (p) {
    if (!(p.id + ' ' + p.description + ' ' + p.category).toLowerCase().includes(term)) return;
    const row = $('<li class="list-group-item d-flex gap-2 align-items-center"></li>');
    row.append($('<img class="thumb">').attr({ src: p.image, alt: p.description }));
    row.append($('<span class="flex-grow-1 small"></span>').text(p.description + ' - $' + p.price.toFixed(2)));
    row.append($('<button class="btn btn-sm btn-primary">Return</button>').click(function () {
      // send product to angular
      const scope = angular.element(document.body).scope();
      scope.$apply(function () { scope.addItem(p); });
    }));
    $('#results').append(row);
  });
}

$(function () {
  $('#search').on('input', showResults);
  $.getJSON('data/products.json', function (data) {
    products = data;
    showResults();
  });
});
