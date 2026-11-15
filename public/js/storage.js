// localStorage functions for members

const STORAGE_KEY = 'partwise.users';

function getMembers() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function saveMembers(members) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
}

// ignoreId is so editing yourself doesnt count
function emailTaken(email, ignoreId) {
  return getMembers().some(function (member) {
    return member.email === email && member.id !== ignoreId;
  });
}

function addMember(data) {
  const members = getMembers();
  const now = new Date().toISOString();
  const member = {
    id: String(Date.now()),
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    age: Number(data.age),
    address: data.address,
    role: 'customer',
    createdAt: now,
    updatedAt: now
  };
  members.push(member);
  saveMembers(members);
  return member;
}

function updateMember(id, data) {
  const members = getMembers();
  const member = members.find(function (m) { return m.id === id; });
  FIELDS.forEach(function (name) {
    member[name] = data[name];
  });
  member.age = Number(data.age);
  member.updatedAt = new Date().toISOString();
  saveMembers(members);
}

function deleteMember(id) {
  saveMembers(getMembers().filter(function (m) { return m.id !== id; }));
}
