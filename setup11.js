const fs = require('fs');
const path = require('path');

const ROOT = 'carpool-platform';

// Clean previous
if (fs.existsSync(ROOT)) fs.rmSync(ROOT, { recursive: true, force: true });

// Helper
const write = (p, content) => {
  const full = path.join(ROOT, p);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content.trimStart(), 'utf8');
};

// ============ BACKEND ============
write('backend/package.json', `{
  "name": "carpool-backend",
  "version": "1.0.0",
  "main": "server.js",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.5.0",
    "morgan": "^1.10.0"
  },
  "devDependencies": { "nodemon": "^3.1.4" }
}
`);

write('backend/.env.example', `PORT=5000
MONGO_URI=mongodb://localhost:27017/carpool
JWT_SECRET=supersecret_change_me
NODE_ENV=development
`);
write('backend/.env', `PORT=5000
MONGO_URI=mongodb://localhost:27017/carpool
JWT_SECRET=supersecret_change_me
NODE_ENV=development
`);

write('backend/.gitignore', `node_modules
.env
*.log
dist
`);

write('backend/server.js', `import app from './src/app.js';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';

dotenv.config();
const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => console.log('Server on http://localhost:' + PORT));
};
start();
`);

write('backend/src/app.js', `import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes.js';
import vehicleRoutes from './routes/vehicle.routes.js';
import bookingRoutes from './routes/booking.routes.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});
export default app;
`);

write('backend/src/config/db.js', `import mongoose from 'mongoose';
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected: ' + conn.connection.host);
  } catch (error) {
    console.error('MongoDB error: ' + error.message);
    process.exit(1);
  }
};
export default connectDB;
`);

write('backend/src/models/User.js', `import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  avatar: { type: String, default: '' },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};
export default mongoose.model('User', userSchema);
`);

write('backend/src/models/Vehicle.js', `import mongoose from 'mongoose';
const vehicleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['Sedan', 'SUV', 'Hatchback', 'Van'], required: true },
  plate: { type: String, required: true, unique: true },
  seats: { type: Number, required: true, min: 1, max: 15 },
  pricePerMile: { type: Number, required: true, default: 0.35 },
  status: {
    type: String,
    enum: ['pending','approved','rejected','available','requested','confirmed','ongoing','completed'],
    default: 'pending',
  },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  image: { type: String, default: '' },
}, { timestamps: true });
export default mongoose.model('Vehicle', vehicleSchema);
`);

write('backend/src/models/Booking.js', `import mongoose from 'mongoose';
const bookingSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pickup: { type: String, required: true },
  dropoff: { type: String, required: true },
  tripDate: { type: Date, required: true },
  status: { type: String, enum: ['pending','confirmed','ongoing','completed','cancelled'], default: 'pending' },
  feedback: { type: String, default: '' },
  rating: { type: Number, min: 1, max: 5 },
}, { timestamps: true });
export default mongoose.model('Booking', bookingSchema);
`);

write('backend/src/middleware/auth.middleware.js', `import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ message: 'Not authorized' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch { res.status(401).json({ message: 'Invalid token' }); }
};
export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  next();
};
`);

write('backend/src/controllers/auth.controller.js', `import jwt from 'jsonwebtoken';
import User from '../models/User.js';
const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

export const register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'All fields are required' });
  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: 'Email already registered' });
  const user = await User.create({ name, email, password });
  const token = signToken(user._id);
  res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) return res.status(401).json({ message: 'Invalid credentials' });
  const token = signToken(user._id);
  res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
};

export const me = async (req, res) => res.json({ user: req.user });
`);

write('backend/src/controllers/vehicle.controller.js', `import Vehicle from '../models/Vehicle.js';

export const getVehicles = async (req, res) => {
  const { status, type, search } = req.query;
  const query = {};
  if (status && status !== 'all') query.status = status;
  if (type && type !== 'all') query.type = type;
  if (search) query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { plate: { $regex: search, $options: 'i' } },
  ];
  const vehicles = await Vehicle.find(query).populate('owner', 'name email');
  res.json(vehicles);
};
export const getVehicle = async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id).populate('owner', 'name email');
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
  res.json(vehicle);
};
export const createVehicle = async (req, res) => {
  const vehicle = await Vehicle.create({ ...req.body, owner: req.user._id });
  res.status(201).json(vehicle);
};
export const updateVehicle = async (req, res) => {
  const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
  res.json(vehicle);
};
export const deleteVehicle = async (req, res) => {
  const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
  res.json({ message: 'Vehicle deleted' });
};
`);

write('backend/src/controllers/booking.controller.js', `import Booking from '../models/Booking.js';
import Vehicle from '../models/Vehicle.js';

export const createBooking = async (req, res) => {
  const { vehicle: vehicleId, pickup, dropoff, tripDate } = req.body;
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
  const booking = await Booking.create({ vehicle: vehicleId, passenger: req.user._id, pickup, dropoff, tripDate, status: 'pending' });
  vehicle.status = 'requested';
  await vehicle.save();
  res.status(201).json(booking);
};
export const getBookings = async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { passenger: req.user._id };
  const bookings = await Booking.find(filter).populate('vehicle', 'name type plate').populate('passenger', 'name email');
  res.json(bookings);
};
export const updateBookingStatus = async (req, res) => {
  const { status } = req.body;
  const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  const map = { confirmed: 'confirmed', ongoing: 'ongoing', completed: 'completed' };
  if (map[status]) await Vehicle.findByIdAndUpdate(booking.vehicle, { status: map[status] });
  res.json(booking);
};
export const submitFeedback = async (req, res) => {
  const { feedback, rating } = req.body;
  const booking = await Booking.findByIdAndUpdate(req.params.id, { feedback, rating }, { new: true });
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  res.json(booking);
};
`);

write('backend/src/routes/auth.routes.js', `import { Router } from 'express';
import { register, login, me } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
const router = Router();
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, me);
export default router;
`);

write('backend/src/routes/vehicle.routes.js', `import { Router } from 'express';
import { getVehicles, getVehicle, createVehicle, updateVehicle, deleteVehicle } from '../controllers/vehicle.controller.js';
import { protect } from '../middleware/auth.middleware.js';
const router = Router();
router.get('/', getVehicles);
router.get('/:id', getVehicle);
router.post('/', protect, createVehicle);
router.put('/:id', protect, updateVehicle);
router.delete('/:id', protect, deleteVehicle);
export default router;
`);

write('backend/src/routes/booking.routes.js', `import { Router } from 'express';
import { createBooking, getBookings, updateBookingStatus, submitFeedback } from '../controllers/booking.controller.js';
import { protect } from '../middleware/auth.middleware.js';
const router = Router();
router.post('/', protect, createBooking);
router.get('/', protect, getBookings);
router.patch('/:id/status', protect, updateBookingStatus);
router.post('/:id/feedback', protect, submitFeedback);
export default router;
`);

// ============ FRONTEND ============
write('frontend/package.json', `{
  "name": "carpool-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.7.2",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.24.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.39",
    "tailwindcss": "^3.4.4",
    "vite": "^5.3.3"
  }
}
`);

write('frontend/.env.example', `VITE_API_URL=http://localhost:5000/api
`);
write('frontend/.env', `VITE_API_URL=http://localhost:5000/api
`);

write('frontend/.gitignore', `node_modules
dist
.env
*.log
`);

write('frontend/index.html', `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
    <title>Velocity Pool</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`);

write('frontend/vite.config.js', `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } },
  },
});
`);

write('frontend/tailwind.config.js', `export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#0B2B4F', light: '#1D4A7A' },
        accent: { DEFAULT: '#00A3C4', soft: '#E6F7FC' },
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
    },
  },
  plugins: [],
};
`);

write('frontend/postcss.config.js', `export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
`);

write('frontend/src/index.css', `@tailwind base;
@tailwind components;
@tailwind utilities;
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
body { font-family: 'Inter', sans-serif; background-color: #F8FAFC; color: #0F172A; -webkit-font-smoothing: antialiased; }
.status-badge { @apply absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide text-white shadow-sm; }
.status-pending { @apply bg-amber-500; }
.status-approved { @apply bg-emerald-500; }
.status-rejected { @apply bg-red-500; }
.status-available { @apply bg-blue-500; }
.status-requested { @apply bg-violet-500; }
.status-confirmed { @apply bg-cyan-500; }
.status-ongoing { @apply bg-orange-500; }
.status-completed { @apply bg-slate-500; }
.btn { @apply inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full font-semibold text-sm transition; }
.btn-primary { @apply bg-accent text-white shadow-md hover:bg-[#008fad] hover:-translate-y-0.5; }
.btn-outline { @apply bg-transparent border border-slate-200 text-slate-800 hover:bg-slate-100; }
`);

write('frontend/src/main.jsx', `import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><BrowserRouter><App /></BrowserRouter></React.StrictMode>
);
`);

write('frontend/src/App.jsx', `import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Vehicles from './pages/Vehicles.jsx';
import Bookings from './pages/Bookings.jsx';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 max-w-[1400px] mx-auto w-full">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/bookings" element={<Bookings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
`);

write('frontend/src/services/api.js', `import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});
export default api;
export const vehicleService = {
  getAll: (params) => api.get('/vehicles', { params }),
  getOne: (id) => api.get('/vehicles/' + id),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put('/vehicles/' + id, data),
  remove: (id) => api.delete('/vehicles/' + id),
};
export const bookingService = {
  getAll: () => api.get('/bookings'),
  create: (data) => api.post('/bookings', data),
  updateStatus: (id, status) => api.patch('/bookings/' + id + '/status', { status }),
  feedback: (id, data) => api.post('/bookings/' + id + '/feedback', data),
};
export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};
`);

write('frontend/src/components/Navbar.jsx', `import { Link, useLocation } from 'react-router-dom';
export default function Navbar() {
  const { pathname } = useLocation();
  const links = [
    { to: '/', label: 'Dashboard', icon: 'fa-tachometer-alt' },
    { to: '/vehicles', label: 'Vehicles', icon: 'fa-car' },
    { to: '/bookings', label: 'Trips', icon: 'fa-route' },
  ];
  return (
    <header className="sticky top-0 z-50 h-[70px] px-4 md:px-6 flex items-center justify-between bg-primary/95 backdrop-blur border-b border-white/10 text-white shadow-md">
      <div className="flex items-center gap-3 font-bold text-xl">
        <i className="fas fa-car-side text-accent text-2xl"></i>
        <span className="hidden sm:inline">Velocity Pool</span>
      </div>
      <nav className="hidden md:flex items-center gap-8 font-medium text-sm">
        {links.map((l) => (
          <Link key={l.to} to={l.to} className={'flex items-center gap-2 transition ' + (pathname === l.to ? 'text-white' : 'text-white/80 hover:text-white')}>
            <i className={'fas ' + l.icon}></i>{l.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-3 bg-white/10 hover:bg-white/20 transition rounded-full px-3 py-2 cursor-pointer">
        <img src="https://i.pravatar.cc/100?img=12" alt="avatar" className="w-8 h-8 rounded-full border-2 border-accent object-cover" />
        <span className="hidden sm:inline text-sm">Alex Rivera</span>
      </div>
    </header>
  );
}
`);

write('frontend/src/components/Sidebar.jsx', `import { NavLink } from 'react-router-dom';
const items = [
  { section: 'Main Menu', links: [
    { to: '/', label: 'Dashboard', icon: 'fa-th-large' },
    { to: '/vehicles', label: 'My Vehicles', icon: 'fa-car', badge: 3 },
    { to: '/bookings', label: 'Bookings', icon: 'fa-calendar-check', badge: 2 },
    { to: '/ongoing', label: 'Ongoing Trips', icon: 'fa-road' },
  ]},
  { section: 'History', links: [
    { to: '/completed', label: 'Completed Trips', icon: 'fa-check-circle' },
    { to: '/feedback', label: 'Feedback', icon: 'fa-star' },
  ]},
];
export default function Sidebar() {
  return (
    <aside className="w-full md:w-64 shrink-0 bg-white border-r border-slate-200 md:py-6 flex md:flex-col gap-2 md:gap-6 overflow-x-auto md:overflow-visible">
      {items.map((group) => (
        <div key={group.section} className="px-3 md:px-5 shrink-0">
          <div className="hidden md:block text-[0.7rem] uppercase font-bold tracking-wider text-slate-400 mb-2">{group.section}</div>
          <nav className="flex md:flex-col gap-1">
            {group.links.map((l) => (
              <NavLink key={l.to} to={l.to} className={({ isActive }) => 'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ' + (isActive ? 'bg-accent-soft text-primary font-semibold' : 'text-slate-600 hover:bg-slate-100 hover:text-primary')}>
                <i className={'fas ' + l.icon + ' w-5 text-center'}></i>
                <span>{l.label}</span>
                {l.badge && <span className="ml-auto bg-accent text-white text-[0.7rem] font-bold px-2 py-0.5 rounded-full">{l.badge}</span>}
              </NavLink>
            ))}
          </nav>
        </div>
      ))}
    </aside>
  );
}
`);

write('frontend/src/components/StatusBadge.jsx', `export default function StatusBadge({ status }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return <span className={'status-badge status-' + status}>{label}</span>;
}
`);

write('frontend/src/components/VehicleCard.jsx', `import StatusBadge from './StatusBadge.jsx';
export default function VehicleCard({ vehicle, onAction, onDetails }) {
  const actions = {
    available: { label: 'Request', icon: 'fa-paper-plane' },
    requested: { label: 'Cancel', icon: 'fa-times' },
    confirmed: { label: 'Start Trip', icon: 'fa-play' },
    ongoing: { label: 'Complete', icon: 'fa-flag-checkered' },
    completed: { label: 'Rate', icon: 'fa-star' },
    pending: { label: 'View', icon: 'fa-eye' },
    approved: { label: 'View', icon: 'fa-eye' },
    rejected: { label: 'Appeal', icon: 'fa-redo' },
  };
  const action = actions[vehicle.status] || { label: 'View', icon: 'fa-eye' };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition overflow-hidden flex flex-col">
      <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center relative border-b border-slate-200">
        <i className="fas fa-car text-5xl text-primary/60"></i>
        <StatusBadge status={vehicle.status} />
      </div>
      <div className="p-5 flex flex-col gap-4 flex-1">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-bold text-lg text-slate-900">{vehicle.name}</div>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{vehicle.type}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-slate-500">
          <span><i className="fas fa-hashtag text-accent mr-1"></i> {vehicle.plate}</span>
          <span><i className="fas fa-chair text-accent mr-1"></i> {vehicle.seats} seats</span>
          <span><i className="fas fa-tag text-accent mr-1"></i> \${vehicle.pricePerMile}/mi</span>
        </div>
        <div className="flex gap-3 mt-auto pt-2">
          <button onClick={() => onDetails(vehicle)} className="btn btn-outline flex-1 !py-2 !px-3 !text-xs"><i className="fas fa-info-circle"></i> Details</button>
          <button onClick={() => onAction(vehicle, action.label.toLowerCase())} className="btn btn-primary flex-1 !py-2 !px-3 !text-xs"><i className={'fas ' + action.icon}></i> {action.label}</button>
        </div>
      </div>
    </div>
  );
}
`);

write('frontend/src/components/SearchFilter.jsx', `export default function SearchFilter({ search, setSearch, status, setStatus, type, setType }) {
  return (
    <div className="flex flex-col md:flex-row flex-wrap gap-4 mb-6">
      <div className="flex-1 min-w-[240px] flex items-center bg-white border border-slate-200 rounded-full px-5 py-2 shadow-sm focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
        <i className="fas fa-search text-slate-400 mr-3"></i>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search vehicles by name, type, or plate..." className="w-full border-none bg-transparent outline-none text-sm" />
      </div>
      <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium outline-none focus:border-accent">
        <option value="all">All Status</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
        <option value="available">Available</option>
        <option value="requested">Requested</option>
        <option value="confirmed">Confirmed</option>
        <option value="ongoing">Ongoing</option>
        <option value="completed">Completed</option>
      </select>
      <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium outline-none focus:border-accent">
        <option value="all">All Types</option>
        <option value="Sedan">Sedan</option>
        <option value="SUV">SUV</option>
        <option value="Hatchback">Hatchback</option>
        <option value="Van">Van</option>
      </select>
    </div>
  );
}
`);

write('frontend/src/components/ConfirmModal.jsx', `export default function ConfirmModal({ open, title, message, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
        <i className="fas fa-question-circle text-4xl text-accent mb-4"></i>
        <h3 className="text-xl font-bold text-primary mb-2">{title}</h3>
        <p className="text-slate-500 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onCancel} className="btn btn-outline">Cancel</button>
          <button onClick={onConfirm} className="btn btn-primary">Yes, Confirm</button>
        </div>
      </div>
    </div>
  );
}
`);

write('frontend/src/components/Toast.jsx', `export default function Toast({ message, show }) {
  if (!show) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[1000] flex items-center gap-3 bg-emerald-500 text-white px-6 py-4 rounded-full shadow-2xl font-medium">
      <i className="fas fa-check-circle"></i><span>{message}</span>
    </div>
  );
}
`);

write('frontend/src/pages/Dashboard.jsx', `import { useEffect, useState } from 'react';
import { vehicleService } from '../services/api.js';
import SearchFilter from '../components/SearchFilter.jsx';
import VehicleCard from '../components/VehicleCard.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import Toast from '../components/Toast.jsx';

export default function Dashboard() {
  const [vehicles, setVehicles] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [modal, setModal] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [toast, setToast] = useState({ show: false, message: '' });

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  useEffect(() => { loadVehicles(); }, []);

  useEffect(() => {
    let data = [...vehicles];
    if (search) {
      const s = search.toLowerCase();
      data = data.filter((v) => v.name.toLowerCase().includes(s) || v.plate.toLowerCase().includes(s) || v.type.toLowerCase().includes(s));
    }
    if (status !== 'all') data = data.filter((v) => v.status === status);
    if (type !== 'all') data = data.filter((v) => v.type === type);
    setFiltered(data);
  }, [vehicles, search, status, type]);

  const loadVehicles = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await vehicleService.getAll();
      setVehicles(data);
    } catch {
      setVehicles([
        { _id: '1', name: 'Toyota Camry', type: 'Sedan', plate: 'CA 1234', seats: 5, pricePerMile: 0.35, status: 'available' },
        { _id: '2', name: 'Honda CR-V', type: 'SUV', plate: 'NY 5678', seats: 5, pricePerMile: 0.45, status: 'requested' },
        { _id: '3', name: 'Ford Transit', type: 'Van', plate: 'TX 9012', seats: 8, pricePerMile: 0.6, status: 'ongoing' },
        { _id: '4', name: 'Tesla Model 3', type: 'Sedan', plate: 'FL 3456', seats: 5, pricePerMile: 0.5, status: 'confirmed' },
        { _id: '5', name: 'Jeep Wrangler', type: 'SUV', plate: 'CO 7890', seats: 5, pricePerMile: 0.55, status: 'pending' },
        { _id: '6', name: 'VW Golf', type: 'Hatchback', plate: 'IL 2345', seats: 5, pricePerMile: 0.3, status: 'approved' },
        { _id: '7', name: 'Nissan Leaf', type: 'Hatchback', plate: 'WA 6789', seats: 5, pricePerMile: 0.28, status: 'completed' },
        { _id: '8', name: 'Chevrolet Suburban', type: 'SUV', plate: 'AZ 1122', seats: 7, pricePerMile: 0.7, status: 'rejected' },
      ]);
      setError('Showing demo data (backend unavailable)');
    } finally { setLoading(false); }
  };

  const handleAction = (vehicle, action) => {
    setModal({
      open: true,
      title: action.charAt(0).toUpperCase() + action.slice(1) + ' Vehicle',
      message: 'Are you sure you want to ' + action + ' ' + vehicle.name + '?',
      onConfirm: () => {
        setVehicles((prev) => prev.map((v) => {
          if (v._id !== vehicle._id) return v;
          const map = { request: 'requested', cancel: 'available', 'start trip': 'ongoing', complete: 'completed' };
          return { ...v, status: map[action] || v.status };
        }));
        showToast(action.charAt(0).toUpperCase() + action.slice(1) + ' successful for ' + vehicle.name);
        setModal({ open: false });
      },
    });
  };

  const handleDetails = (vehicle) => showToast('Viewing ' + vehicle.name);

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight">Vehicle Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage your fleet and pooling requests</p>
        </div>
        <button onClick={() => showToast('Add vehicle form would open here.')} className="btn btn-primary">
          <i className="fas fa-plus"></i> Add Vehicle
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 px-5 py-4 rounded-xl mb-6">
          <i className="fas fa-exclamation-triangle"></i><span>{error}</span>
        </div>
      )}

      <SearchFilter search={search} setSearch={setSearch} status={status} setStatus={setStatus} type={type} setType={setType} />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0,1,2].map((i) => (
            <div key={i} className="h-[340px] bg-slate-100 rounded-2xl animate-pulse border border-slate-200"></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
          <i className="fas fa-car-crash text-5xl text-slate-300 mb-4"></i>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No vehicles found</h3>
          <p className="text-slate-500">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((v) => (
            <VehicleCard key={v._id} vehicle={v} onAction={handleAction} onDetails={handleDetails} />
          ))}
        </div>
      )}

      <ConfirmModal open={modal.open} title={modal.title} message={modal.message} onCancel={() => setModal({ open: false })} onConfirm={modal.onConfirm} />
      <Toast show={toast.show} message={toast.message} />
    </>
  );
}
`);

write('frontend/src/pages/Vehicles.jsx', `export default function Vehicles() {
  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-primary mb-4">My Vehicles</h1>
      <p className="text-slate-500">Full vehicle management coming soon.</p>
    </div>
  );
}
`);

write('frontend/src/pages/Bookings.jsx', `export default function Bookings() {
  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-primary mb-4">My Bookings</h1>
      <p className="text-slate-500">Booking history and trip management coming soon.</p>
    </div>
  );
}
`);

// ============ ZIP (optional) ============
write('README.md', `# Carpool Platform

Full-stack carpool platform with Node.js + Express + MongoDB backend,
and React + Vite + Tailwind frontend.

## Backend
cd backend
npm install
npm run dev

Server: http://localhost:5000

## Frontend
cd frontend
npm install
npm run dev

App: http://localhost:3000
`);

console.log('\n✅ All files created inside ./carpool-platform\n');
console.log('Next steps:');
console.log('  1. cd carpool-platform/backend  && npm install && npm run dev');
console.log('  2. cd carpool-platform/frontend && npm install && npm run dev\n');