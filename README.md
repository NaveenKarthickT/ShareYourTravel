# Velocity Pool · Vehicle Pooling Platform

Multi-tenant carpooling platform.

- **Backend:** Node.js, Express, MongoDB, JWT auth, Helmet, Rate-limit
- **Frontend:** React (Vite) + Tailwind CSS + Leaflet + Recharts

## Setup

### Backend
```
cd backend
cp .env.example .env      # paste MONGODB_URI + JWT_SECRET
npm install
npm run seed              # optional demo data
npm run dev               # http://localhost:5000
```

### Frontend
```
cd frontend
cp .env.example .env
npm install
npm run dev               # http://localhost:3000
```

## Demo credentials
| Role | Email | Password |
|------|-------|----------|
| Super Admin | super@velocity.com | super123 |
| Org Admin   | admin@greenride.com | admin123 |
| Org Admin 2 | admin@metropool.com | admin123 |
| Normal User | user@greenride.com | user123 |

## Reset DB
```
cd backend && npm run reset
```
