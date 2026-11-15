// signup page

const signupForm = document.getElementById('signupForm');
const formAlert = document.getElementById('formAlert');

// type = success or danger
function showAlert(type, message) {
  formAlert.className = 'alert alert-' + type;
  formAlert.textContent = message;
}

signupForm.addEventListener('submit', function (event) {
  event.preventDefault();
  const data = readForm(signupForm);
  const errors = validateMember(data);
  // no duplicate emails
  if (emailTaken(data.email)) {
    errors.email = 'That email is already registered.';
  }

  showErrors(signupForm, errors);
  if (Object.keys(errors).length > 0) {
    showAlert('danger', 'Please fix the highlighted fields.');
    return;
  }

  const member = addMember(data);
  signupForm.reset();
  showAlert('success', 'Welcome, ' + member.fullName + '! Your account was created.');
});

// clear errors when Clear form is clicked
signupForm.addEventListener('reset', function () {
  showErrors(signupForm, {});
  formAlert.className = '';
  formAlert.textContent = '';
});
