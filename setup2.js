// ============================================================
//  Carpool Platform – Full Generator (Windows / Node.js)
//  Creates: carpool-platform/  with:
//    - Backend (Express + MongoDB) with auth, roles, orgs
//    - Frontend (React + Vite + Tailwind) with login/register
//    - Super Admin dashboard, org admin dashboard, user dashboard
//  Run:  node setup.js
// ============================================================

const fs = require('fs');
const path = require('path');

const ROOT = 'carpool-platform';

// ---- Clean previous build ----
if (fs.existsSync(ROOT)) {
  fs.rmSync(ROOT, { recursive: true, force: true });
  console.log('🧹 Removed existing carpool-platform folder');
}

// ---- Helpers ----
const write = (p, content) => {
  const full = path.join(ROOT, p);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content.replace(/^\n/, ''), 'utf8');
};

// ============================================================
// BACKEND
// ============================================================

write('backend/package.json', `
{
  "name": "carpool-backend",
  "version": "1.0.0",
  "description": "Backend API for carpool platform",
  "main": "server.js",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "seed": "node seed.js"
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

write('backend/.env.example', `
PORT=5000
MONGO_URI=mongodb://localhost:27017/carpool
JWT_SECRET=supersecret_change_me
NODE_ENV=development
`);

write('backend/.env', `
PORT=5000
MONGO_URI=mongodb://localhost:27017/carpool
JWT_SECRET=supersecret_change_me
NODE_ENV=development
`);

write('backend/.gitignore', `
node_modules
.env
*.log
dist
`);

write('backend/server.js', `
import app from './src/app.js';
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

write('backend/src/app.js', `
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes.js';
import vehicleRoutes from './routes/vehicle.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import organizationRoutes from './routes/organization.routes.js';
import superadminRoutes from './routes/superadmin.routes.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/superadmin', superadminRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

export default app;
`);

write('backend/src/config/db.js', `
import mongoose from 'mongoose';
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

write('backend/src/models/User.js', `
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'user'],
      default: 'user',
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
    },
    avatar: { type: String, default: '' },
  },
  { timestamps: true }
);

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

write('backend/src/models/Organization.js', `
import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['pending', 'active', 'suspended'],
      default: 'active',
    },
    logo: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Organization', organizationSchema);
`);

write('backend/src/models/Vehicle.js', `
import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ['Sedan', 'SUV', 'Hatchback', 'Van'], required: true },
    plate: { type: String, required: true },
    seats: { type: Number, required: true, min: 1, max: 15 },
    pricePerMile: { type: Number, required: true, default: 0.35 },
    status: {
      type: String,
      enum: ['pending','approved','rejected','available','requested','confirmed','ongoing','completed'],
      default: 'pending',
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    image: { type: String, default: '' },
  },
  { timestamps: true }
);

vehicleSchema.index({ plate: 1, organization: 1 }, { unique: true });

export default mongoose.model('Vehicle', vehicleSchema);
`);

write('backend/src/models/Booking.js', `
import mongoose from 'mongoose';
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

write('backend/src/middleware/auth.middleware.js', `
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password').populate('organization', 'name slug');
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const superAdminOnly = (req, res, next) => {
  if (req.user?.role !== 'superadmin') {
    return res.status(403).json({ message: 'Super admin access required' });
  }
  next();
};

export const adminOnly = (req, res, next) => {
  if (!['admin', 'superadmin'].includes(req.user?.role)) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};
`);

write('backend/src/controllers/auth.controller.js', `
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Organization from '../models/Organization.js';

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const userPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  organization: user.organization,
});

export const register = async (req, res) => {
  const { name, email, password, organizationName, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, password required' });
  }

  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: 'Email already registered' });

  let org = null;

  if (role === 'admin') {
    if (!organizationName) {
      return res.status(400).json({ message: 'Organization name required for admin signup' });
    }
    const slug = organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const slugExists = await Organization.findOne({ slug });
    if (slugExists) return res.status(409).json({ message: 'Organization name already taken' });

    org = await Organization.create({
      name: organizationName,
      slug,
      status: 'active',
    });
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role === 'admin' ? 'admin' : 'user',
    organization: org?._id || null,
  });

  if (org) {
    org.owner = user._id;
    await org.save();
  }

  const populated = await User.findById(user._id).populate('organization', 'name slug');

  res.status(201).json({
    token: signToken(user._id),
    user: userPayload(populated),
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).populate('organization', 'name slug');
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  res.json({ token: signToken(user._id), user: userPayload(user) });
};

export const me = async (req, res) => {
  res.json({ user: userPayload(req.user) });
};
`);

write('backend/src/controllers/vehicle.controller.js', `
import Vehicle from '../models/Vehicle.js';

export const getVehicles = async (req, res) => {
  const { status, type, search } = req.query;
  const query = {};

  if (req.user.role !== 'superadmin') {
    query.organization = req.user.organization?._id || req.user.organization;
  }
  if (status && status !== 'all') query.status = status;
  if (type && type !== 'all') query.type = type;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { plate: { $regex: search, $options: 'i' } },
    ];
  }
  const vehicles = await Vehicle.find(query)
    .populate('owner', 'name email')
    .populate('organization', 'name slug');
  res.json(vehicles);
};

export const getVehicle = async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id)
    .populate('owner', 'name email')
    .populate('organization', 'name slug');
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

  if (
    req.user.role !== 'superadmin' &&
    String(vehicle.organization?._id) !== String(req.user.organization?._id)
  ) {
    return res.status(403).json({ message: 'Not authorized for this vehicle' });
  }
  res.json(vehicle);
};

export const createVehicle = async (req, res) => {
  if (!req.user.organization) {
    return res.status(400).json({ message: 'You are not part of any organization' });
  }
  const vehicle = await Vehicle.create({
    ...req.body,
    owner: req.user._id,
    organization: req.user.organization._id || req.user.organization,
  });
  res.status(201).json(vehicle);
};

export const updateVehicle = async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

  if (
    req.user.role !== 'superadmin' &&
    String(vehicle.organization) !== String(req.user.organization?._id || req.user.organization)
  ) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  Object.assign(vehicle, req.body);
  await vehicle.save();
  res.json(vehicle);
};

export const deleteVehicle = async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

  if (
    req.user.role !== 'superadmin' &&
    String(vehicle.organization) !== String(req.user.organization?._id || req.user.organization)
  ) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  await vehicle.deleteOne();
  res.json({ message: 'Vehicle deleted' });
};
`);

write('backend/src/controllers/booking.controller.js', `
import Booking from '../models/Booking.js';
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
  const filter = req.user.role === 'superadmin' ? {} : { passenger: req.user._id };
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

write('backend/src/controllers/organization.controller.js', `
import Organization from '../models/Organization.js';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';

export const getMyOrganization = async (req, res) => {
  if (!req.user.organization) {
    return res.status(404).json({ message: 'No organization found for this user' });
  }
  const org = await Organization.findById(req.user.organization._id || req.user.organization);
  if (!org) return res.status(404).json({ message: 'Organization not found' });

  const members = await User.find({ organization: org._id }).select('-password');
  const vehicleCount = await Vehicle.countDocuments({ organization: org._id });

  res.json({ organization: org, members, vehicleCount });
};

export const listOrganizations = async (req, res) => {
  const orgs = await Organization.find().populate('owner', 'name email');
  const withCounts = await Promise.all(
    orgs.map(async (o) => {
      const userCount = await User.countDocuments({ organization: o._id });
      const vehicleCount = await Vehicle.countDocuments({ organization: o._id });
      return { ...o.toObject(), userCount, vehicleCount };
    })
  );
  res.json(withCounts);
};

export const updateOrganizationStatus = async (req, res) => {
  const { status } = req.body;
  const org = await Organization.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );
  if (!org) return res.status(404).json({ message: 'Organization not found' });
  res.json(org);
};
`);

write('backend/src/controllers/superadmin.controller.js', `
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import Vehicle from '../models/Vehicle.js';
import Booking from '../models/Booking.js';

export const getPlatformStats = async (req, res) => {
  const [totalOrgs, totalUsers, totalVehicles, totalBookings] = await Promise.all([
    Organization.countDocuments(),
    User.countDocuments(),
    Vehicle.countDocuments(),
    Booking.countDocuments(),
  ]);

  const orgs = await Organization.find().populate('owner', 'name email');

  const orgBreakdown = await Promise.all(
    orgs.map(async (o) => {
      const [users, vehicles] = await Promise.all([
        User.countDocuments({ organization: o._id }),
        Vehicle.countDocuments({ organization: o._id }),
      ]);
      return {
        _id: o._id,
        name: o.name,
        slug: o.slug,
        status: o.status,
        owner: o.owner,
        users,
        vehicles,
      };
    })
  );

  res.json({
    totals: { totalOrgs, totalUsers, totalVehicles, totalBookings },
    organizations: orgBreakdown,
  });
};

export const listAllUsers = async (req, res) => {
  const users = await User.find()
    .select('-password')
    .populate('organization', 'name slug');
  res.json(users);
};

export const updateUserRole = async (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin', 'superadmin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};
`);

write('backend/src/routes/auth.routes.js', `
import { Router } from 'express';
import { register, login, me } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, me);

export default router;
`);

write('backend/src/routes/vehicle.routes.js', `
import { Router } from 'express';
import { getVehicles, getVehicle, createVehicle, updateVehicle, deleteVehicle } from '../controllers/vehicle.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = Router();
router.get('/', protect, getVehicles);
router.get('/:id', protect, getVehicle);
router.post('/', protect, adminOnly, createVehicle);
router.put('/:id', protect, adminOnly, updateVehicle);
router.delete('/:id', protect, adminOnly, deleteVehicle);

export default router;
`);

write('backend/src/routes/booking.routes.js', `
import { Router } from 'express';
import { createBooking, getBookings, updateBookingStatus, submitFeedback } from '../controllers/booking.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();
router.post('/', protect, createBooking);
router.get('/', protect, getBookings);
router.patch('/:id/status', protect, updateBookingStatus);
router.post('/:id/feedback', protect, submitFeedback);

export default router;
`);

write('backend/src/routes/organization.routes.js', `
import { Router } from 'express';
import {
  getMyOrganization,
  listOrganizations,
  updateOrganizationStatus,
} from '../controllers/organization.controller.js';
import { protect, superAdminOnly, adminOnly } from '../middleware/auth.middleware.js';

const router = Router();
router.get('/me', protect, adminOnly, getMyOrganization);
router.get('/', protect, superAdminOnly, listOrganizations);
router.patch('/:id/status', protect, superAdminOnly, updateOrganizationStatus);

export default router;
`);

write('backend/src/routes/superadmin.routes.js', `
import { Router } from 'express';
import {
  getPlatformStats,
  listAllUsers,
  updateUserRole,
} from '../controllers/superadmin.controller.js';
import { protect, superAdminOnly } from '../middleware/auth.middleware.js';

const router = Router();
router.get('/stats', protect, superAdminOnly, getPlatformStats);
router.get('/users', protect, superAdminOnly, listAllUsers);
router.patch('/users/:id/role', protect, superAdminOnly, updateUserRole);

export default router;
`);

write('backend/seed.js', `
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Organization from './src/models/Organization.js';
import Vehicle from './src/models/Vehicle.js';

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await User.deleteMany({});
  await Organization.deleteMany({});
  await Vehicle.deleteMany({});
  console.log('Cleared users, organizations, vehicles');

  const superAdmin = await User.create({
    name: 'Site Owner',
    email: 'super@velocity.com',
    password: 'super123',
    role: 'superadmin',
  });

  const org1 = await Organization.create({
    name: 'Green Ride Co',
    slug: 'green-ride-co',
    description: 'Eco-friendly carpool community',
  });
  const admin1 = await User.create({
    name: 'Alex Rivera',
    email: 'admin@greenride.com',
    password: 'admin123',
    role: 'admin',
    organization: org1._id,
  });
  org1.owner = admin1._id;
  await org1.save();

  await User.create({
    name: 'Jamie Lee',
    email: 'user@greenride.com',
    password: 'user123',
    role: 'user',
    organization: org1._id,
  });

  const org2 = await Organization.create({
    name: 'Metro Poolers',
    slug: 'metro-poolers',
    description: 'City commuter pooling',
  });
  const admin2 = await User.create({
    name: 'Priya Shah',
    email: 'admin@metropool.com',
    password: 'admin123',
    role: 'admin',
    organization: org2._id,
  });
  org2.owner = admin2._id;
  await org2.save();

  await Vehicle.insertMany([
    { name: 'Toyota Camry', type: 'Sedan', plate: 'CA 1234', seats: 5, pricePerMile: 0.35, status: 'available', owner: admin1._id, organization: org1._id },
    { name: 'Honda CR-V', type: 'SUV', plate: 'NY 5678', seats: 5, pricePerMile: 0.45, status: 'requested', owner: admin1._id, organization: org1._id },
    { name: 'Ford Transit', type: 'Van', plate: 'TX 9012', seats: 8, pricePerMile: 0.6, status: 'ongoing', owner: admin1._id, organization: org1._id },
    { name: 'Tesla Model 3', type: 'Sedan', plate: 'FL 3456', seats: 5, pricePerMile: 0.5, status: 'confirmed', owner: admin1._id, organization: org1._id },
    { name: 'Jeep Wrangler', type: 'SUV', plate: 'CO 7890', seats: 5, pricePerMile: 0.55, status: 'pending', owner: admin2._id, organization: org2._id },
    { name: 'VW Golf', type: 'Hatchback', plate: 'IL 2345', seats: 5, pricePerMile: 0.3, status: 'approved', owner: admin2._id, organization: org2._id },
  ]);

  console.log('\\nSeed complete!\\n');
  console.log('Login credentials:');
  console.log('  Superadmin:  super@velocity.com  /  super123');
  console.log('  Admin 1:     admin@greenride.com /  admin123');
  console.log('  Admin 2:     admin@metropool.com /  admin123');
  console.log('  Normal user: user@greenride.com  /  user123\\n');

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
`);

// ============================================================
// FRONTEND
// ============================================================

write('frontend/package.json', `
{
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

write('frontend/.env.example', `
VITE_API_URL=http://localhost:5000/api
`);

write('frontend/.env', `
VITE_API_URL=http://localhost:5000/api
`);

write('frontend/.gitignore', `
node_modules
dist
.env
*.log
`);

write('frontend/index.html', `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
    <title>Velocity Pool · Carpool Platform</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`);

write('frontend/vite.config.js', `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } },
  },
});
`);

write('frontend/tailwind.config.js', `
export default {
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

write('frontend/postcss.config.js', `
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
`);

write('frontend/src/index.css', `
@tailwind base;
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

write('frontend/src/main.jsx', `
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
`);

write('frontend/src/App.jsx', `
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Sidebar from './components/Sidebar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Vehicles from './pages/Vehicles.jsx';
import Bookings from './pages/Bookings.jsx';
import SuperAdminDashboard from './pages/SuperAdminDashboard.jsx';
import { useAuth } from './context/AuthContext.jsx';

function AppShell({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 max-w-[1400px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-primary font-medium animate-pulse">Loading…</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'superadmin' ? '/superadmin' : '/'} replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell>
              <Dashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vehicles"
        element={
          <ProtectedRoute>
            <AppShell>
              <Vehicles />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings"
        element={
          <ProtectedRoute>
            <AppShell>
              <Bookings />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin"
        element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <AppShell>
              <SuperAdminDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
`);

write('frontend/src/context/AuthContext.jsx', `
import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await authService.me();
        setUser(data.user);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [token]);

  const login = async (email, password) => {
    const { data } = await authService.login({ email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await authService.register(payload);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
`);

write('frontend/src/components/ProtectedRoute.jsx', `
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-primary font-medium">Loading…</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
`);

write('frontend/src/pages/Login.jsx', `
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) {
      setError('Email and password required');
      return;
    }
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role === 'superadmin') navigate('/superadmin');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-primary text-white p-12">
        <div className="flex items-center gap-3 text-2xl font-bold">
          <i className="fas fa-car-side text-accent text-3xl"></i>
          Velocity Pool
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            The platform for modern carpooling communities.
          </h1>
          <p className="text-white/70 text-lg">
            Manage fleets, drivers, bookings and pooling — all in one place.
          </p>
        </div>
        <div className="text-white/50 text-sm">
          © {new Date().getFullYear()} Velocity Pool. All rights reserved.
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-3 lg:hidden">
              <i className="fas fa-car-side text-accent text-4xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-primary">Welcome back</h2>
            <p className="text-slate-500 mt-1 text-sm">Sign in to continue to your dashboard</p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition"
              />
            </div>
            <button
              disabled={loading}
              className="w-full btn btn-primary !rounded-xl disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent font-semibold hover:underline">
              Create one
            </Link>
          </p>

          <div className="mt-8 pt-6 border-t border-slate-100 text-xs text-slate-400">
            <p className="font-semibold text-slate-500 mb-2">Demo accounts:</p>
            <p><code>super@velocity.com</code> / <code>super123</code> — Super Admin</p>
            <p><code>admin@greenride.com</code> / <code>admin123</code> — Org Admin</p>
            <p><code>user@greenride.com</code> / <code>user123</code> — Regular User</p>
          </div>
        </div>
      </div>
    </div>
  );
}
`);

write('frontend/src/pages/Register.jsx', `
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState('user');
  const [form, setForm] = useState({ name: '', email: '', password: '', organizationName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.email || !form.password) {
      setError('All fields are required');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (accountType === 'admin' && !form.organizationName) {
      setError('Organization name is required for admin accounts');
      return;
    }

    setLoading(true);
    try {
      const user = await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: accountType,
        organizationName: accountType === 'admin' ? form.organizationName : undefined,
      });
      if (user.role === 'superadmin') navigate('/superadmin');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
        <div className="text-center mb-8">
          <i className="fas fa-car-side text-accent text-4xl"></i>
          <h2 className="text-2xl font-bold text-primary mt-3">Create your account</h2>
          <p className="text-slate-500 mt-1 text-sm">Join Velocity Pool in seconds</p>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Account type</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAccountType('user')}
              className={\`px-4 py-3 rounded-xl border-2 text-sm font-semibold transition \${
                accountType === 'user'
                  ? 'border-accent bg-accent-soft text-primary'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }\`}
            >
              <i className="fas fa-user mr-2"></i> Normal User
            </button>
            <button
              type="button"
              onClick={() => setAccountType('admin')}
              className={\`px-4 py-3 rounded-xl border-2 text-sm font-semibold transition \${
                accountType === 'admin'
                  ? 'border-accent bg-accent-soft text-primary'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }\`}
            >
              <i className="fas fa-building mr-2"></i> Organization
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="John Doe"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition"
            />
          </div>

          {accountType === 'admin' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Organization name</label>
              <input
                value={form.organizationName}
                onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                placeholder="Green Ride Co"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="At least 6 characters"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition"
            />
          </div>

          <button
            disabled={loading}
            className="w-full btn btn-primary !rounded-xl disabled:opacity-60"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-accent font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
`);

write('frontend/src/services/api.js', `
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = \`Bearer \${token}\`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

export const vehicleService = {
  getAll: (params) => api.get('/vehicles', { params }),
  getOne: (id) => api.get(\`/vehicles/\${id}\`),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(\`/vehicles/\${id}\`, data),
  remove: (id) => api.delete(\`/vehicles/\${id}\`),
};

export const bookingService = {
  getAll: () => api.get('/bookings'),
  create: (data) => api.post('/bookings', data),
  updateStatus: (id, status) => api.patch(\`/bookings/\${id}/status\`, { status }),
  feedback: (id, data) => api.post(\`/bookings/\${id}/feedback\`, data),
};

export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

export const orgService = {
  getMine: () => api.get('/organizations/me'),
  listAll: () => api.get('/organizations'),
  updateStatus: (id, status) => api.patch(\`/organizations/\${id}/status\`, { status }),
};

export const superadminService = {
  getStats: () => api.get('/superadmin/stats'),
  listUsers: () => api.get('/superadmin/users'),
  updateRole: (id, role) => api.patch(\`/superadmin/users/\${id}/role\`, { role }),
};
`);

write('frontend/src/components/Navbar.jsx', `
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const links = [
    { to: '/', label: 'Dashboard', icon: 'fa-tachometer-alt' },
    { to: '/vehicles', label: 'Vehicles', icon: 'fa-car' },
    { to: '/bookings', label: 'Trips', icon: 'fa-route' },
  ];

  if (user?.role === 'superadmin') {
    links.push({ to: '/superadmin', label: 'Platform', icon: 'fa-globe' });
  }

  return (
    <header className="sticky top-0 z-50 h-[70px] px-4 md:px-6 flex items-center justify-between bg-primary/95 backdrop-blur border-b border-white/10 text-white shadow-md">
      <Link to="/" className="flex items-center gap-3 font-bold text-xl">
        <i className="fas fa-car-side text-accent text-2xl"></i>
        <span className="hidden sm:inline">Velocity Pool</span>
      </Link>
      <nav className="hidden md:flex items-center gap-8 font-medium text-sm">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={\`flex items-center gap-2 transition \${
              pathname === l.to ? 'text-white' : 'text-white/80 hover:text-white'
            }\`}
          >
            <i className={\`fas \${l.icon}\`}></i>
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col items-end leading-tight">
          <span className="text-sm font-semibold">{user?.name}</span>
          <span className="text-[0.7rem] text-white/60 uppercase tracking-wide">
            {user?.role}
            {user?.organization?.name ? \` · \${user.organization.name}\` : ''}
          </span>
        </div>
        <img
          src="https://i.pravatar.cc/100?img=12"
          alt="avatar"
          className="w-9 h-9 rounded-full border-2 border-accent object-cover"
        />
        <button
          onClick={logout}
          title="Sign out"
          className="ml-2 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center"
        >
          <i className="fas fa-sign-out-alt"></i>
        </button>
      </div>
    </header>
  );
}
`);

write('frontend/src/components/Sidebar.jsx', `
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Sidebar() {
  const { user } = useAuth();
  const isSuper = user?.role === 'superadmin';

  const items = [
    {
      section: 'Main Menu',
      links: [
        { to: '/', label: 'Dashboard', icon: 'fa-th-large' },
        { to: '/vehicles', label: 'My Vehicles', icon: 'fa-car', badge: 3 },
        { to: '/bookings', label: 'Bookings', icon: 'fa-calendar-check', badge: 2 },
        { to: '/ongoing', label: 'Ongoing Trips', icon: 'fa-road' },
      ],
    },
    {
      section: 'History',
      links: [
        { to: '/completed', label: 'Completed Trips', icon: 'fa-check-circle' },
        { to: '/feedback', label: 'Feedback', icon: 'fa-star' },
      ],
    },
  ];

  if (isSuper) {
    items.push({
      section: 'Platform',
      links: [
        { to: '/superadmin', label: 'All Organizations', icon: 'fa-globe' },
      ],
    });
  }

  return (
    <aside className="w-full md:w-64 shrink-0 bg-white border-r border-slate-200 md:py-6 flex md:flex-col gap-2 md:gap-6 overflow-x-auto md:overflow-visible">
      {items.map((group) => (
        <div key={group.section} className="px-3 md:px-5 shrink-0">
          <div className="hidden md:block text-[0.7rem] uppercase font-bold tracking-wider text-slate-400 mb-2">
            {group.section}
          </div>
          <nav className="flex md:flex-col gap-1">
            {group.links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  \`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition \${
                    isActive
                      ? 'bg-accent-soft text-primary font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-primary'
                  }\`
                }
              >
                <i className={\`fas \${l.icon} w-5 text-center\`}></i>
                <span>{l.label}</span>
                {l.badge && (
                  <span className="ml-auto bg-accent text-white text-[0.7rem] font-bold px-2 py-0.5 rounded-full">
                    {l.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      ))}
    </aside>
  );
}
`);

write('frontend/src/components/StatusBadge.jsx', `
export default function StatusBadge({ status }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return <span className={\`status-badge status-\${status}\`}>{label}</span>;
}
`);

write('frontend/src/components/VehicleCard.jsx', `
import StatusBadge from './StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function VehicleCard({ vehicle, onAction, onDetails }) {
  const { user } = useAuth();
  const canManage = ['admin', 'superadmin'].includes(user?.role);

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
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {vehicle.type}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-slate-500">
          <span><i className="fas fa-hashtag text-accent mr-1"></i> {vehicle.plate}</span>
          <span><i className="fas fa-chair text-accent mr-1"></i> {vehicle.seats} seats</span>
          <span><i className="fas fa-tag text-accent mr-1"></i> \${vehicle.pricePerMile}/mi</span>
        </div>
        <div className="flex gap-3 mt-auto pt-2">
          <button
            onClick={() => onDetails(vehicle)}
            className="btn btn-outline flex-1 !py-2 !px-3 !text-xs"
          >
            <i className="fas fa-info-circle"></i> Details
          </button>
          <button
            onClick={() => onAction(vehicle, action.label.toLowerCase())}
            disabled={!canManage && action.label !== 'Request' && action.label !== 'Rate'}
            className="btn btn-primary flex-1 !py-2 !px-3 !text-xs disabled:opacity-50"
          >
            <i className={\`fas \${action.icon}\`}></i> {action.label}
          </button>
        </div>
      </div>
    </div>
  );
}
`);

write('frontend/src/components/SearchFilter.jsx', `
export default function SearchFilter({ search, setSearch, status, setStatus, type, setType }) {
  return (
    <div className="flex flex-col md:flex-row flex-wrap gap-4 mb-6">
      <div className="flex-1 min-w-[240px] flex items-center bg-white border border-slate-200 rounded-full px-5 py-2 shadow-sm focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
        <i className="fas fa-search text-slate-400 mr-3"></i>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search vehicles by name, type, or plate..."
          className="w-full border-none bg-transparent outline-none text-sm"
        />
      </div>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium outline-none focus:border-accent"
      >
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
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium outline-none focus:border-accent"
      >
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

write('frontend/src/components/ConfirmModal.jsx', `
export default function ConfirmModal({ open, title, message, onCancel, onConfirm }) {
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

write('frontend/src/components/Toast.jsx', `
export default function Toast({ message, show }) {
  if (!show) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[1000] flex items-center gap-3 bg-emerald-500 text-white px-6 py-4 rounded-full shadow-2xl font-medium">
      <i className="fas fa-check-circle"></i>
      <span>{message}</span>
    </div>
  );
}
`);

write('frontend/src/pages/Dashboard.jsx', `
import { useEffect, useState } from 'react';
import { vehicleService } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import SearchFilter from '../components/SearchFilter.jsx';
import VehicleCard from '../components/VehicleCard.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import Toast from '../components/Toast.jsx';

export default function Dashboard() {
  const { user } = useAuth();
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
      data = data.filter(
        (v) =>
          v.name.toLowerCase().includes(s) ||
          v.plate.toLowerCase().includes(s) ||
          v.type.toLowerCase().includes(s)
      );
    }
    if (status !== 'all') data = data.filter((v) => v.status === status);
    if (type !== 'all') data = data.filter((v) => v.type === type);
    setFiltered(data);
  }, [vehicles, search, status, type]);

  const loadVehicles = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await vehicleService.getAll();
      setVehicles(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load vehicles');
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (vehicle, action) => {
    setModal({
      open: true,
      title: \`\${action.charAt(0).toUpperCase() + action.slice(1)} Vehicle\`,
      message: \`Are you sure you want to \${action} \${vehicle.name}?\`,
      onConfirm: () => {
        setVehicles((prev) =>
          prev.map((v) => {
            if (v._id !== vehicle._id) return v;
            const map = {
              request: 'requested',
              cancel: 'available',
              'start trip': 'ongoing',
              complete: 'completed',
            };
            return { ...v, status: map[action] || v.status };
          })
        );
        showToast(\`\${action.charAt(0).toUpperCase() + action.slice(1)} successful for \${vehicle.name}\`);
        setModal({ open: false });
      },
    });
  };

  const handleDetails = (vehicle) => showToast(\`Viewing \${vehicle.name}\`);

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight">
            Vehicle Dashboard
          </h1>
          <p className="text-slate-500 mt-1">
            {user?.organization?.name
              ? \`Managing \${user.organization.name}\`
              : 'Manage your fleet and pooling requests'}
          </p>
        </div>
        {['admin', 'superadmin'].includes(user?.role) && (
          <button
            onClick={() => showToast('Add vehicle form would open here.')}
            className="btn btn-primary"
          >
            <i className="fas fa-plus"></i> Add Vehicle
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-800 px-5 py-4 rounded-xl mb-6">
          <i className="fas fa-exclamation-triangle"></i>
          <span>{error}</span>
        </div>
      )}

      <SearchFilter
        search={search}
        setSearch={setSearch}
        status={status}
        setStatus={setStatus}
        type={type}
        setType={setType}
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[340px] bg-slate-100 rounded-2xl animate-pulse border border-slate-200"
            ></div>
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

      <ConfirmModal
        open={modal.open}
        title={modal.title}
        message={modal.message}
        onCancel={() => setModal({ open: false })}
        onConfirm={modal.onConfirm}
      />
      <Toast show={toast.show} message={toast.message} />
    </>
  );
}
`);

write('frontend/src/pages/Vehicles.jsx', `
export default function Vehicles() {
  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-primary mb-4">My Vehicles</h1>
      <p className="text-slate-500">Full vehicle management coming soon.</p>
    </div>
  );
}
`);

write('frontend/src/pages/Bookings.jsx', `
export default function Bookings() {
  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-primary mb-4">My Bookings</h1>
      <p className="text-slate-500">Booking history and trip management coming soon.</p>
    </div>
  );
}
`);

write('frontend/src/pages/SuperAdminDashboard.jsx', `
import { useEffect, useState } from 'react';
import { superadminService, orgService } from '../services/api.js';
import Toast from '../components/Toast.jsx';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('orgs');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '' });

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [s, u] = await Promise.all([
          superadminService.getStats(),
          superadminService.listUsers(),
        ]);
        setStats(s.data);
        setUsers(u.data);
      } catch (err) {
        showToast('Failed to load platform data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleOrgStatus = async (org) => {
    const newStatus = org.status === 'active' ? 'suspended' : 'active';
    try {
      await orgService.updateStatus(org._id, newStatus);
      setStats((prev) => ({
        ...prev,
        organizations: prev.organizations.map((o) =>
          o._id === org._id ? { ...o, status: newStatus } : o
        ),
      }));
      showToast(\`\${org.name} is now \${newStatus}\`);
    } catch {
      showToast('Failed to update organization');
    }
  };

  const changeRole = async (user, role) => {
    try {
      await superadminService.updateRole(user._id, role);
      setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, role } : u)));
      showToast(\`\${user.name} is now \${role}\`);
    } catch {
      showToast('Failed to update role');
    }
  };

  if (loading) {
    return <div className="text-primary font-medium animate-pulse">Loading platform data…</div>;
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight">
          Super Admin · Platform Overview
        </h1>
        <p className="text-slate-500 mt-1">
          Monitor all organizations, users and vehicles across Velocity Pool
        </p>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {[
          { label: 'Organizations', value: stats?.totals.totalOrgs || 0, icon: 'fa-building', color: 'text-blue-500' },
          { label: 'Users', value: stats?.totals.totalUsers || 0, icon: 'fa-users', color: 'text-emerald-500' },
          { label: 'Vehicles', value: stats?.totals.totalVehicles || 0, icon: 'fa-car', color: 'text-violet-500' },
          { label: 'Bookings', value: stats?.totals.totalBookings || 0, icon: 'fa-calendar-check', color: 'text-amber-500' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-500 font-medium">{s.label}</span>
              <i className={\`fas \${s.icon} \${s.color}\`}></i>
            </div>
            <div className="text-2xl font-bold text-primary">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-slate-200">
        {[
          { id: 'orgs', label: 'Organizations' },
          { id: 'users', label: 'All Users' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={\`px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition \${
              tab === t.id
                ? 'border-accent text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }\`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'orgs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs tracking-wide">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold">Organization</th>
                  <th className="text-left px-5 py-3 font-semibold">Owner</th>
                  <th className="text-left px-5 py-3 font-semibold">Users</th>
                  <th className="text-left px-5 py-3 font-semibold">Vehicles</th>
                  <th className="text-left px-5 py-3 font-semibold">Status</th>
                  <th className="text-right px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats?.organizations.map((o) => (
                  <tr key={o._id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">{o.name}</div>
                      <div className="text-xs text-slate-400">{o.slug}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {o.owner?.name || '—'}
                      <div className="text-xs text-slate-400">{o.owner?.email}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-700">{o.users}</td>
                    <td className="px-5 py-4 text-slate-700">{o.vehicles}</td>
                    <td className="px-5 py-4">
                      <span
                        className={\`text-xs font-bold px-2 py-1 rounded-full \${
                          o.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : o.status === 'suspended'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }\`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => toggleOrgStatus(o)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-100 transition"
                      >
                        {o.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
                {stats?.organizations.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-slate-400">
                      No organizations yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs tracking-wide">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold">Name</th>
                  <th className="text-left px-5 py-3 font-semibold">Email</th>
                  <th className="text-left px-5 py-3 font-semibold">Organization</th>
                  <th className="text-left px-5 py-3 font-semibold">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold text-slate-800">{u.name}</td>
                    <td className="px-5 py-4 text-slate-600">{u.email}</td>
                    <td className="px-5 py-4 text-slate-600">{u.organization?.name || '—'}</td>
                    <td className="px-5 py-4">
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u, e.target.value)}
                        className="text-xs border border-slate-200 rounded-full px-3 py-1.5 font-semibold focus:border-accent outline-none"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="superadmin">Super Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-12 text-slate-400">
                      No users yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Toast show={toast.show} message={toast.message} />
    </>
  );
}
`);

write('README.md', `
# Velocity Pool · Carpool Platform

Full-stack carpool platform with role-based access:
- **superadmin** — sees all organizations, users and stats
- **admin** — manages own organization's vehicles and team
- **user** — requests vehicles and books trips

## Tech Stack
- **Backend**: Node.js, Express, MongoDB, JWT auth
- **Frontend**: React + Vite + Tailwind CSS

## Setup

### 1. Backend
\`\`\`
cd backend
npm install
npm run seed    # creates demo users + vehicles
npm run dev     # http://localhost:5000
\`\`\`

### 2. Frontend
\`\`\`
cd frontend
npm install
npm run dev     # http://localhost:3000
\`\`\`

### Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Super Admin | super@velocity.com | super123 |
| Org Admin | admin@greenride.com | admin123 |
| Org Admin 2 | admin@metropool.com | admin123 |
| Normal User | user@greenride.com | user123 |

## Features
- Login / Register with role selection
- Organization-scoped vehicle management
- Super admin platform overview
- Search, filter, status badges, confirmation modals, toasts
- Responsive layout (mobile + tablet + desktop)
`);

console.log('\\n✅ carpool-platform generated!\\n');
console.log('Next steps:');
console.log('  cd carpool-platform\\backend');
console.log('  npm install');
console.log('  npm run seed');
console.log('  npm run dev');
console.log('');
console.log('  # new terminal');
console.log('  cd carpool-platform\\frontend');
console.log('  npm install');
console.log('  npm run dev');
console.log('');
console.log('Demo logins:');
console.log('  super@velocity.com / super123   (Super Admin)');
console.log('  admin@greenride.com / admin123  (Org Admin)');
console.log('  user@greenride.com / user123    (Normal User)');
console.log('');