// members page
const memberRows = document.getElementById('memberRows');
const memberCount = document.getElementById('memberCount');
const searchInput = document.getElementById('searchInput');
const jsonView = document.getElementById('jsonView');

// textContent not innerHTML so nobody can inject html
function addCell(row, text) {
  const cell = document.createElement('td');
  cell.textContent = text;
  row.appendChild(cell);
}

function makeButton(label, style, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn btn-sm ' + style;
  button.textContent = label;
  button.addEventListener('click', onClick);
  return button;
}

function render() {
  const members = getMembers();
  const search = searchInput.value.toLowerCase();
  const shown = members.filter(function (m) {
    return (m.fullName + ' ' + m.email + ' ' + m.phone + ' ' + m.address).toLowerCase().includes(search);
  });

  memberCount.textContent = members.length;
  jsonView.textContent = JSON.stringify(members, null, 2);
  memberRows.textContent = '';

  if (shown.length === 0) {
    const row = memberRows.insertRow();
    addCell(row, members.length === 0 ? 'No members yet.' : 'No members match your search.');
    row.cells[0].colSpan = 9;
    return;
  }

  shown.forEach(function (m, index) {
    const row = memberRows.insertRow();
    addCell(row, index + 1);
    addCell(row, m.fullName);
    addCell(row, m.email);
    addCell(row, m.phone || '-');
    addCell(row, m.age);
    addCell(row, m.address);
    addCell(row, m.role);
    addCell(row, new Date(m.createdAt).toLocaleDateString());

    // edit/delete buttons
    const actions = document.createElement('td');
    actions.className = 'text-end text-nowrap';
    actions.append(
      makeButton('Edit', 'btn-primary me-1', function () { openEdit(m); }),
      makeButton('Delete', 'btn-outline-danger', function () { removeMember(m); })
    );
    row.appendChild(actions);
  });
}

searchInput.addEventListener('input', render);
render();

// edit modal
const editForm = document.getElementById('editForm');
const editModal = new bootstrap.Modal(document.getElementById('editModal'));
let editingId = null;

function openEdit(member) {
  editingId = member.id;
  FIELDS.forEach(function (name) {
    editForm.elements[name].value = member[name];
  });
  showErrors(editForm, {});
  editModal.show();
}

function removeMember(member) {
  if (confirm('Delete ' + member.fullName + '?')) {
    deleteMember(member.id);
    render();
  }
}

editForm.addEventListener('submit', function (event) {
  event.preventDefault();
  const data = readForm(editForm);
  const errors = validateMember(data);
  if (emailTaken(data.email, editingId)) {
    errors.email = 'That email is already registered.';
  }

  showErrors(editForm, errors);
  if (Object.keys(errors).length > 0) return;

  updateMember(editingId, data);
  editModal.hide();
  render();
});
