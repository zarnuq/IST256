// partwise backend (express + mongoose)
// npm install, then node server.js and go to localhost:3000

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const PORT = 3000;
const MONGO_URL = 'mongodb://127.0.0.1:27017/partwise';

const app = express();
app.use(express.json());
// serves everything in public/
app.use(express.static(path.join(__dirname, 'public')));

// schemas

const Product = mongoose.model('Product', new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  unit: { type: String, required: true },
  price: { type: Number, required: true, min: 0.01 },
  additionalInfo: String,
  image: String
}));

const Cart = mongoose.model('Cart', new mongoose.Schema({
  id: String,
  items: { type: Array, required: true },
  date: { type: Date, default: Date.now }
}), 'shoppingcart');

const Shipping = mongoose.model('Shipping', new mongoose.Schema({
  id: String,
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  delivery: { type: String, required: true },
  assembly: Boolean,
  items: Array,
  date: { type: Date, default: Date.now }
}), 'shipping');

const Billing = mongoose.model('Billing', new mongoose.Schema({
  id: String,
  status: { type: String, default: 'Payment approved' },
  date: { type: Date, default: Date.now },
  fullName: { type: String, required: true },
  address: { type: String, required: true },
  payment: { method: String, cardNumber: String, expiration: String },
  items: Array,
  total: Number
}), 'billing');

const Return = mongoose.model('Return', new mongoose.Schema({
  id: String,
  status: { type: String, default: 'Pending' },
  date: { type: Date, default: Date.now },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  details: String,
  items: Array
}), 'returns');

// server side validation

function checkCart(c) {
  return (!c.items || c.items.length === 0) ? ['Cart is empty.'] : [];
}

function checkBilling(b) {
  const errors = [];
  if (!b.fullName || !b.address) errors.push('Name and address are required.');
  if (!b.payment || !b.payment.cardNumber || !b.payment.expiration) errors.push('Payment details are required.');
  if (!b.items || b.items.length === 0) errors.push('Cart is empty.');
  return errors;
}

function checkReturn(r) {
  const errors = [];
  if (!r.fullName || !r.email) errors.push('Name and email are required.');
  if (!r.items || r.items.length === 0) errors.push('Pick at least one product to return.');
  (r.items || []).forEach(function (item) {
    if (!item.reason || !item.condition) errors.push(item.name + ' needs a reason and a condition.');
  });
  return errors;
}

// products (full crud)

app.get('/api/products', async function (req, res) {
  res.json(await Product.find());
});

app.post('/api/products', async function (req, res) {
  const product = await Product.create(req.body);
  res.status(201).json(product);
});

app.put('/api/products/:id', async function (req, res) {
  const product = await Product.findOneAndUpdate({ id: req.params.id }, req.body, { returnDocument: 'after', runValidators: true });
  if (!product) return res.status(404).json({ errors: ['Product not found.'] });
  res.json(product);
});

app.delete('/api/products/:id', async function (req, res) {
  const product = await Product.findOneAndDelete({ id: req.params.id });
  if (!product) return res.status(404).json({ errors: ['Product not found.'] });
  res.json({ deleted: req.params.id });
});

// billing (full crud)

app.get('/api/billing', async function (req, res) {
  res.json(await Billing.find());
});

app.post('/api/billing', async function (req, res) {
  const errors = checkBilling(req.body);
  if (errors.length > 0) return res.status(400).json({ errors: errors });
  req.body.id = 'B-' + Date.now();
  const bill = await Billing.create(req.body);
  res.status(201).json(bill);
});

app.put('/api/billing/:id', async function (req, res) {
  const bill = await Billing.findOneAndUpdate({ id: req.params.id }, req.body, { returnDocument: 'after', runValidators: true });
  if (!bill) return res.status(404).json({ errors: ['Bill not found.'] });
  res.json(bill);
});

app.delete('/api/billing/:id', async function (req, res) {
  const bill = await Billing.findOneAndDelete({ id: req.params.id });
  if (!bill) return res.status(404).json({ errors: ['Bill not found.'] });
  res.json({ deleted: req.params.id });
});

// cart, shipping and returns just get saved

app.post('/api/cart', async function (req, res) {
  const errors = checkCart(req.body);
  if (errors.length > 0) return res.status(400).json({ errors: errors });
  req.body.id = 'C-' + Date.now();
  const cart = await Cart.create(req.body);
  res.status(201).json(cart);
});

app.post('/api/shipping', async function (req, res) {
  req.body.id = 'S-' + Date.now();
  const order = await Shipping.create(req.body);
  res.status(201).json(order);
});

app.post('/api/returns', async function (req, res) {
  const errors = checkReturn(req.body);
  if (errors.length > 0) return res.status(400).json({ errors: errors });
  req.body.id = 'R-' + Date.now();
  const ret = await Return.create(req.body);
  res.status(201).json(ret);
});

// mongoose errors (missing fields, duplicate id) -> 400
app.use(function (err, req, res, next) {
  res.status(400).json({ errors: [err.message] });
});

// load products.json into the db if it's empty
async function seed(Model, file) {
  if (await Model.countDocuments() > 0) return;
  const docs = require('./public/data/' + file);
  await Model.insertMany(docs);
  console.log('Added ' + docs.length + ' documents from ' + file);
}

mongoose.connect(MONGO_URL)
  .then(async function () {
    console.log('Connected to MongoDB at ' + MONGO_URL);
    await seed(Product, 'products.json');
    app.listen(PORT, function () {
      console.log('Partwise running at http://localhost:' + PORT);
    });
  })
  .catch(function (err) {
    console.log('Could not connect to MongoDB. Is it running? ' + err.message);
  });
