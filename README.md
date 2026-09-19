# Velocity Pool · Vehicle Pooling Platform

Full-stack multi-tenant carpooling platform.

- **Backend:** Node.js, Express, MongoDB, JWT auth
- **Frontend:** React (Vite) + Tailwind CSS

## Architecture

- **Organizations** = independent pooling servers. All data is scoped by organization.
- **Roles:**
  - `platformRole: super_admin` — platform-wide oversight
  - `Membership.role: org_admin | member` — per-organization role
  - Joining always starts as `pending` until an org admin approves
- **Chat:** each confirmed booking gets its own private thread (polling, 3s refresh)
- **Notifications:** bell in navbar polls every 15s and shows pending seat requests, membership requests, and unread messages
- **Auto-completion:** background job every 5 min marks expired trips completed

## Setup

### Backend
```
cd backend
cp .env.example .env      # edit MONGODB_URI and JWT_SECRET
npm install
npm run seed              # optional demo data
npm run dev               # http://localhost:5000

# or to create just a superadmin from .env:
npm run seed:superadmin
```

### Frontend
```
cd frontend
cp .env.example .env
npm install
npm run dev               # http://localhost:3000
```

## Demo credentials (after `npm run seed`)
| Role | Email | Password |
|------|-------|----------|
| Super Admin | super@velocity.com | super123 |
| Org Admin | admin@greenride.com | admin123 |
| Org Admin 2 | admin@metropool.com | admin123 |
| Normal User | user@greenride.com | user123 |

## Reset to a clean slate (superadmin only)
```
cd backend
npm run reset
```
