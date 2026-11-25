import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 5000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json());

function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function makeId(items) {
  return items.length ? Math.max(...items.map(item => item.id)) + 1 : 1;
}

// Get all food items
app.get('/api/foods', (req, res) => {
  res.json(readData().foods);
});

// Register a customer
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please fill all fields.' });
  }

  const data = readData();
  if (data.users.some(user => user.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ message: 'Email is already registered.' });
  }

  const user = { id: makeId(data.users), name, email, password };
  data.users.push(user);
  saveData(data);

  res.status(201).json({
    message: 'Registration successful.',
    user: { id: user.id, name: user.name, email: user.email }
  });
});

// Customer login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = readData().users.find(
    item => item.email.toLowerCase() === String(email).toLowerCase()
      && item.password === password
  );

  if (!user) {
    return res.status(401).json({ message: 'Incorrect email or password.' });
  }

  res.json({
    message: 'Login successful.',
    user: { id: user.id, name: user.name, email: user.email }
  });
});

// Admin login: fixed credentials
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    return res.json({ message: 'Admin login successful.' });
  }
  res.status(401).json({ message: 'Incorrect admin username or password.' });
});

// Admin adds a food item
app.post('/api/admin/foods', (req, res) => {
  const { name, price, image, description } = req.body;
  if (!name || Number(price) <= 0) {
    return res.status(400).json({ message: 'Enter a food name and valid price.' });
  }

  const data = readData();
  const food = {
    id: makeId(data.foods),
    name,
    price: Number(price),
    image: image || 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=600',
    description: description || ''
  };
  data.foods.push(food);
  saveData(data);
  res.status(201).json(food);
});

// Admin updates a food item
app.put('/api/admin/foods/:id', (req, res) => {
  const data = readData();
  const food = data.foods.find(item => item.id === Number(req.params.id));
  if (!food) return res.status(404).json({ message: 'Food not found.' });

  const { name, price, image, description } = req.body;
  food.name = name || food.name;
  food.price = Number(price) > 0 ? Number(price) : food.price;
  food.image = image ?? food.image;
  food.description = description ?? food.description;
  saveData(data);
  res.json(food);
});

// Admin deletes a food item
app.delete('/api/admin/foods/:id', (req, res) => {
  const data = readData();
  const oldLength = data.foods.length;
  data.foods = data.foods.filter(item => item.id !== Number(req.params.id));
  if (data.foods.length === oldLength) {
    return res.status(404).json({ message: 'Food not found.' });
  }
  saveData(data);
  res.json({ message: 'Food deleted.' });
});

// Customer places an order
app.post('/api/orders', (req, res) => {
  const { userId, customerName, items } = req.body;
  if (!userId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Invalid order.' });
  }

  const data = readData();
  const user = data.users.find(item => item.id === Number(userId));
  if (!user) return res.status(404).json({ message: 'Customer not found.' });

  const orderItems = [];
  for (const requested of items) {
    const food = data.foods.find(item => item.id === Number(requested.foodId));
    const quantity = Number(requested.quantity);
    if (food && Number.isInteger(quantity) && quantity > 0) {
      orderItems.push({
        foodId: food.id,
        name: food.name,
        price: food.price,
        quantity
      });
    }
  }

  if (!orderItems.length) return res.status(400).json({ message: 'No valid items.' });

  const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const order = {
    id: makeId(data.orders),
    userId: user.id,
    customerName: customerName || user.name,
    items: orderItems,
    total,
    status: 'Placed',
    date: new Date().toLocaleString()
  };

  data.orders.push(order);
  saveData(data);
  res.status(201).json({ message: 'Order placed successfully.', order });
});

// Customer order history
app.get('/api/orders/:userId', (req, res) => {
  const orders = readData().orders.filter(
    order => order.userId === Number(req.params.userId)
  );
  res.json(orders);
});

// Admin views all orders
app.get('/api/admin/orders', (req, res) => {
  res.json(readData().orders);
});

// Admin updates an order status
app.put('/api/admin/orders/:id', (req, res) => {
  const allowed = ['Placed', 'Preparing', 'Out for delivery', 'Delivered', 'Cancelled'];
  const data = readData();
  const order = data.orders.find(item => item.id === Number(req.params.id));
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  if (!allowed.includes(req.body.status)) {
    return res.status(400).json({ message: 'Invalid order status.' });
  }

  order.status = req.body.status;
  saveData(data);
  res.json(order);
});

app.listen(PORT, () => {
  console.log(`FoodExpress API running at http://localhost:${PORT}`);
});