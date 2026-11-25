import { useEffect, useState } from 'react';
import './App.css';

const API = '/api';

async function request(url, options = {}) {
  const response = await fetch(API + url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Something went wrong.');
  return data;
}

function App() {
  const [foods, setFoods] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(false);
  const [page, setPage] = useState('menu');
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [adminForm, setAdminForm] = useState({ username: '', password: '' });
  const [foodForm, setFoodForm] = useState({
    name: '', price: '', image: '', description: ''
  });
  const [editingId, setEditingId] = useState(null);

  async function loadFoods() {
    try {
      setFoods(await request('/foods'));
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    loadFoods();
  }, []);

  function updateForm(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function register(event) {
    event.preventDefault();
    try {
      const result = await request('/register', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      setUser(result.user);
      setPage('menu');
      setForm({ name: '', email: '', password: '' });
      setMessage(result.message);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function login(event) {
    event.preventDefault();
    try {
      const result = await request('/login', {
        method: 'POST',
        body: JSON.stringify({ email: form.email, password: form.password })
      });
      setUser(result.user);
      setPage('menu');
      setForm({ name: '', email: '', password: '' });
      setMessage(result.message);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function adminLogin(event) {
    event.preventDefault();
    try {
      await request('/admin/login', {
        method: 'POST',
        body: JSON.stringify(adminForm)
      });
      setAdmin(true);
      setPage('admin');
      setAdminForm({ username: '', password: '' });
      setMessage('Welcome, Admin!');
    } catch (error) {
      setMessage(error.message);
    }
  }

  function addToCart(food) {
    setCart(current => {
      const found = current.find(item => item.id === food.id);
      if (found) {
        return current.map(item =>
          item.id === food.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...current, { ...food, quantity: 1 }];
    });
    setMessage(`${food.name} added to cart.`);
  }

  function changeQuantity(id, amount) {
    setCart(current => current
      .map(item => item.id === id
        ? { ...item, quantity: item.quantity + amount }
        : item)
      .filter(item => item.quantity > 0));
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  async function placeOrder() {
    if (!user) {
      setMessage('Please login before placing an order.');
      setPage('login');
      return;
    }
    if (!cart.length) {
      setMessage('Your cart is empty.');
      return;
    }
    try {
      const result = await request('/orders', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          customerName: user.name,
          items: cart.map(item => ({ foodId: item.id, quantity: item.quantity }))
        })
      });
      setCart([]);
      setMessage(result.message);
      setPage('history');
      loadOrders();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function loadOrders() {
    if (!user) return;
    try {
      setOrders(await request(`/orders/${user.id}`));
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function loadAllOrders() {
    try {
      setOrders(await request('/admin/orders'));
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function saveFood(event) {
    event.preventDefault();
    try {
      const url = editingId ? `/admin/foods/${editingId}` : '/admin/foods';
      const method = editingId ? 'PUT' : 'POST';
      await request(url, { method, body: JSON.stringify(foodForm) });
      setFoodForm({ name: '', price: '', image: '', description: '' });
      setEditingId(null);
      await loadFoods();
      setMessage(editingId ? 'Food updated.' : 'Food added.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  function editFood(food) {
    setEditingId(food.id);
    setFoodForm({
      name: food.name,
      price: food.price,
      image: food.image,
      description: food.description || ''
    });
  }

  async function deleteFood(id) {
    if (!window.confirm('Delete this food item?')) return;
    try {
      await request(`/admin/foods/${id}`, { method: 'DELETE' });
      await loadFoods();
      setMessage('Food deleted.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function updateOrder(id, status) {
    try {
      await request(`/admin/orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      await loadAllOrders();
      setMessage('Order status updated.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  function logout() {
    setUser(null);
    setAdmin(false);
    setCart([]);
    setPage('menu');
    setMessage('Logged out.');
  }

  function openAdmin() {
    setPage('adminLogin');
    setMessage('');
  }

  return (
    <div>
      <header className="topbar">
        <div>
          <h1>FoodExpress</h1>
          <p>Fresh food, delivered to your door</p>
        </div>
        <nav>
          <button onClick={() => setPage('menu')}>Menu</button>
          <button onClick={() => setPage('cart')}>Cart ({cart.reduce((n, item) => n + item.quantity, 0)})</button>
          {user && <button onClick={() => { setPage('history'); loadOrders(); }}>My Orders</button>}
          {!user && !admin && <button onClick={() => setPage('login')}>User Login</button>}
          {!user && !admin && <button onClick={() => setPage('register')}>Register</button>}
          {!user && !admin && <button onClick={openAdmin}>Admin</button>}
          {(user || admin) && <button onClick={logout}>Logout</button>}
        </nav>
      </header>

      <main>
        {message && <p className="message">{message}</p>}

        {page === 'menu' && (
          <>
            <section className="hero">
              <h2>Find your favourite food</h2>
              <input
                placeholder="Search food..."
                value={search}
                onChange={event => setSearch(event.target.value)}
              />
            </section>
            <h2 className="section-title">Our Menu</h2>
            <div className="food-list">
              {foods.filter(food => food.name.toLowerCase().includes(search.toLowerCase()))
                .map(food => (
                  <article className="food-card" key={food.id}>
                    <img src={food.image} alt={food.name} />
                    <div className="food-info">
                      <h3>{food.name}</h3>
                      <p>{food.description}</p>
                      <div className="food-bottom">
                        <strong>₹{food.price}</strong>
                        <button onClick={() => addToCart(food)}>Add to Cart</button>
                      </div>
                    </div>
                  </article>
                ))}
            </div>
          </>
        )}

        {page === 'register' && (
          <form className="form-card" onSubmit={register}>
            <h2>Create User Account</h2>
            <input name="name" placeholder="Full name" value={form.name} onChange={updateForm} required />
            <input name="email" type="email" placeholder="Email" value={form.email} onChange={updateForm} required />
            <input name="password" type="password" placeholder="Password" value={form.password} onChange={updateForm} required />
            <button>Register</button>
            <p>Already registered? <button type="button" className="link-button" onClick={() => setPage('login')}>Login</button></p>
          </form>
        )}

        {page === 'login' && (
          <form className="form-card" onSubmit={login}>
            <h2>User Login</h2>
            <input name="email" type="email" placeholder="Email" value={form.email} onChange={updateForm} required />
            <input name="password" type="password" placeholder="Password" value={form.password} onChange={updateForm} required />
            <button>Login</button>
            <p>New customer? <button type="button" className="link-button" onClick={() => setPage('register')}>Register</button></p>
          </form>
        )}

        {page === 'adminLogin' && (
          <form className="form-card" onSubmit={adminLogin}>
            <h2>Admin Login</h2>
            <input placeholder="Username" value={adminForm.username}
              onChange={e => setAdminForm({ ...adminForm, username: e.target.value })} required />
            <input type="password" placeholder="Password" value={adminForm.password}
              onChange={e => setAdminForm({ ...adminForm, password: e.target.value })} required />
            <button>Login as Admin</button>
            <p className="hint">Demo username: admin | Password: admin123</p>
          </form>
        )}

        {page === 'cart' && (
          <section className="panel">
            <h2>Your Cart</h2>
            {cart.length === 0 ? <p>Your cart is empty.</p> : cart.map(item => (
              <div className="cart-row" key={item.id}>
                <span>{item.name} — ₹{item.price}</span>
                <div className="quantity">
                  <button onClick={() => changeQuantity(item.id, -1)}>-</button>
                  <b>{item.quantity}</b>
                  <button onClick={() => changeQuantity(item.id, 1)}>+</button>
                </div>
              </div>
            ))}
            <h3>Total: ₹{total}</h3>
            <button onClick={placeOrder}>Place Order</button>
          </section>
        )}

        {page === 'history' && (
          <section className="panel">
            <h2>My Order History</h2>
            {orders.length === 0 ? <p>No orders yet.</p> : orders.map(order => (
              <div className="order-card" key={order.id}>
                <h3>Order #{order.id}</h3>
                <p>{order.date} | Status: <b>{order.status}</b></p>
                <p>{order.items.map(item => `${item.name} x ${item.quantity}`).join(', ')}</p>
                <strong>Total: ₹{order.total}</strong>
              </div>
            ))}
          </section>
        )}

        {page === 'admin' && admin && (
          <section className="admin-page">
            <h2>Admin Dashboard</h2>
            <form className="form-card wide" onSubmit={saveFood}>
              <h3>{editingId ? 'Edit Food' : 'Add New Food'}</h3>
              <input placeholder="Food name" value={foodForm.name}
                onChange={e => setFoodForm({ ...foodForm, name: e.target.value })} required />
              <input type="number" min="1" placeholder="Price" value={foodForm.price}
                onChange={e => setFoodForm({ ...foodForm, price: e.target.value })} required />
              <input placeholder="Image URL (optional)" value={foodForm.image}
                onChange={e => setFoodForm({ ...foodForm, image: e.target.value })} />
              <input placeholder="Description" value={foodForm.description}
                onChange={e => setFoodForm({ ...foodForm, description: e.target.value })} />
              <button>{editingId ? 'Update Food' : 'Add Food'}</button>
              {editingId && <button type="button" className="secondary" onClick={() => {
                setEditingId(null);
                setFoodForm({ name: '', price: '', image: '', description: '' });
              }}>Cancel Edit</button>}
            </form>

            <h3 className="section-title">Manage Food Items</h3>
            <div className="admin-food-list">
              {foods.map(food => (
                <div className="admin-row" key={food.id}>
                  <span>{food.name} — ₹{food.price}</span>
                  <div>
                    <button onClick={() => editFood(food)}>Edit</button>
                    <button className="danger" onClick={() => deleteFood(food.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="panel">
              <h3>Customer Orders</h3>
              <button onClick={loadAllOrders}>Refresh Orders</button>
              {orders.map(order => (
                <div className="order-card" key={order.id}>
                  <h3>Order #{order.id} — {order.customerName}</h3>
                  <p>{order.date} | Total: ₹{order.total}</p>
                  <p>{order.items.map(item => `${item.name} x ${item.quantity}`).join(', ')}</p>
                  <select value={order.status} onChange={e => updateOrder(order.id, e.target.value)}>
                    {['Placed', 'Preparing', 'Out for delivery', 'Delivered', 'Cancelled'].map(status =>
                      <option key={status}>{status}</option>
                    )}
                  </select>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer>© 2026 FoodExpress | Online Food Delivery</footer>
    </div>
  );
}

export default App;