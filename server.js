// server.js: express + mongodb (mongoose) rest api for the partwise store
// run: npm install (first time), then node server.js, open http://localhost:3000

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const PORT = 3000;
const MONGO_URL = 'mongodb://127.0.0.1:27017/partwise';

const app = express();
app.use(express.json());                                 // read json request bodies
app.use(express.static(path.join(__dirname, 'public'))); // serve html, css, js, images, json

// ---------- schemas (one collection each) ----------

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

// ---------- extra checks before saving ----------

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

// ---------- crud routes ----------
// makes GET all, GET one, POST, PUT and DELETE for one collection, e.g. /api/billing and /api/billing/B-123
function crud(name, Model, prefix, check) {
  const url = '/api/' + name;

  // read all
  app.get(url, async function (req, res) {
    res.json(await Model.find().sort({ _id: 1 }));
  });

  // read one
  app.get(url + '/:id', async function (req, res) {
    const doc = await Model.findOne({ id: req.params.id });
    if (!doc) return res.status(404).json({ errors: ['Not found.'] });
    res.json(doc);
  });

  // create (products bring their own id, the rest get one like B-1731600000000)
  app.post(url, async function (req, res) {
    const errors = check ? check(req.body) : [];
    if (errors.length) return res.status(400).json({ errors: errors });
    const doc = await Model.create(Object.assign({ id: prefix + Date.now() }, req.body));
    res.status(201).json(doc);
  });

  // update
  app.put(url + '/:id', async function (req, res) {
    const doc = await Model.findOneAndUpdate({ id: req.params.id }, req.body, { returnDocument: 'after', runValidators: true });
    if (!doc) return res.status(404).json({ errors: ['Not found.'] });
    res.json(doc);
  });

  // delete
  app.delete(url + '/:id', async function (req, res) {
    const doc = await Model.findOneAndDelete({ id: req.params.id });
    if (!doc) return res.status(404).json({ errors: ['Not found.'] });
    res.json({ deleted: req.params.id });
  });
}

crud('products', Product, 'P-');
crud('cart', Cart, 'C-', checkCart);
crud('shipping', Shipping, 'S-');
crud('billing', Billing, 'B-', checkBilling);
crud('returns', Return, 'R-', checkReturn);

// bad data (like a missing required field or a duplicate product id) comes back as 400
app.use(function (err, req, res, next) {
  res.status(400).json({ errors: [err.message] });
});

// ---------- start ----------

// first run: fill empty collections from the json files in public/data
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
    await seed(Billing, 'billing.json');
    await seed(Return, 'returns.json');
    app.listen(PORT, function () {
      console.log('Partwise running at http://localhost:' + PORT);
    });
  })
  .catch(function (err) {
    console.log('Could not connect to MongoDB. Is it running? ' + err.message);
  });
