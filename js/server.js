// server.js: Node.js RESTful service for billing details and returns.
// Run it with `node js/server.js`, then open http://localhost:3000

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
// the website folder is one level up from js/
const SITE = path.join(__dirname, '..');

// file types the browser needs to know about
const TYPES = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp'
};

// Reads the saved records from a JSON file in data/ (empty if there isn't one yet).
function load(file) {
  const full = path.join(SITE, 'data', file);
  return fs.existsSync(full) ? JSON.parse(fs.readFileSync(full, 'utf8')) : [];
}

// Adds a record to a JSON file in data/.
function save(file, record) {
  const records = load(file);
  records.push(record);
  fs.writeFileSync(path.join(SITE, 'data', file), JSON.stringify(records, null, 2));
}

// Sends a JSON response.
function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data, null, 2));
}

// Returns a list of problems with the billing details (empty means it's good).
function checkBilling(b) {
  const errors = [];
  if (!b.fullName) errors.push('Full name is required.');
  if (!b.address || !b.address.street || !b.address.city || !b.address.state || !b.address.zip) {
    errors.push('Full address is required.');
  }
  if (!b.payment || !b.payment.cardNumber || !b.payment.expiration) errors.push('Payment details are required.');
  if (!b.delivery || !b.delivery.method) errors.push('Delivery option is required.');
  if (!b.items || b.items.length === 0) errors.push('Cart is empty.');
  return errors;
}

// Returns a list of problems with the return request (empty means it's good).
function checkReturn(r) {
  const errors = [];
  if (!r.fullName || !r.email) errors.push('Name and email are required.');
  if (!r.items || r.items.length === 0) errors.push('Pick at least one product to return.');
  (r.items || []).forEach(function (item) {
    if (!item.reason || !item.condition) errors.push(item.name + ' needs a reason and a condition.');
  });
  return errors;
}

// Handles the REST endpoints.
function handleApi(req, res, body) {
  // GET lists everything saved so far
  if (req.method === 'GET' && req.url === '/api/billing') return sendJson(res, 200, load('billing.json'));
  if (req.method === 'GET' && req.url === '/api/returns') return sendJson(res, 200, load('returns.json'));

  // the Cart page posts its cart JSON here; we give it an id and send it back
  if (req.method === 'POST' && req.url === '/api/cart') {
    if (!Array.isArray(body) || body.length === 0) return sendJson(res, 400, { errors: ['Cart is empty.'] });
    return sendJson(res, 201, { id: 'C-' + Date.now(), items: body });
  }

  // the Checkout page posts here; we just give the order an id
  if (req.method === 'POST' && req.url === '/api/orders') {
    return sendJson(res, 201, Object.assign({ id: 'PW-' + Date.now() }, body));
  }

  // receive and process billing details
  if (req.method === 'POST' && req.url === '/api/billing') {
    const errors = checkBilling(body);
    if (errors.length) return sendJson(res, 400, { errors: errors });
    const record = Object.assign({ id: 'B-' + Date.now(), status: 'Payment approved', date: new Date() }, body);
    save('billing.json', record);
    return sendJson(res, 201, record);
  }

  // receive and process a return request
  if (req.method === 'POST' && req.url === '/api/returns') {
    const errors = checkReturn(body);
    if (errors.length) return sendJson(res, 400, { errors: errors });
    const record = Object.assign({ id: 'R-' + Date.now(), status: 'Pending', date: new Date() }, body);
    save('returns.json', record);
    return sendJson(res, 201, record);
  }

  sendJson(res, 404, { errors: ['Not found.'] });
}

const server = http.createServer(function (req, res) {
  // API requests
  if (req.url.startsWith('/api/')) {
    let body = '';
    req.on('data', function (chunk) { body += chunk; });
    req.on('end', function () {
      try {
        handleApi(req, res, body ? JSON.parse(body) : {});
      } catch (e) {
        sendJson(res, 400, { errors: ['Request must be valid JSON.'] });
      }
    });
    return;
  }

  // everything else is a file from the website (html, css, js, images)
  let url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/') url = '/index.html';
  const file = path.join(SITE, url);
  fs.readFile(file, function (err, data) {
    if (err) {
      res.writeHead(404);
      return res.end('Not found');
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'text/plain' });
    res.end(data);
  });
});

server.listen(PORT, function () {
  console.log('Partwise running at http://localhost:' + PORT);
});
