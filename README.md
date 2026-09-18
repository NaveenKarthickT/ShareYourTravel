# PoolTogether — Vehicle Pooling Platform

Full-stack multi-tenant carpooling platform.

- **Backend:** Node.js, Express, MongoDB Atlas (Mongoose), JWT auth
- **Frontend:** React (Vite) + Tailwind CSS

## Architecture

- **Organizations** = independent "pooling servers" (e.g. "ABC Residency Pooling", "BA IT Park Pooling"). All data — memberships, vehicles, bookings, feedback — is scoped by `organization` so communities never see each other's data.
- **Roles:**
  - `platformRole: super_admin` on `User` — platform-wide oversight (`/api/admin/platform/*`).
  - `Membership.role: org_admin | member` — per-organization role. One person can be a plain member in one org and the admin of another; joining always starts as `pending` until an org admin approves it.
- **Core flow:** register/login → browse or create an organization → (if joining) wait for admin approval → dashboard → post/search vehicles → request/confirm bookings → confirmed → **ongoing (Start Trip)** → **completed (auto or manual)** → feedback.
- **Chat:** each confirmed booking gets its own private thread between the passenger and the driver (polling-based, 3s refresh) — reachable from Confirmed Trips, Ongoing Trip, and Vehicle Details.
- **Notifications:** a bell in the navbar (polls every 15s) surfaces booking requests you need to review and unread chat messages, with matching red dots on the individual Chat buttons and request rows they refer to.
- **Auto-completion:** a background job (every 5 min) marks any trip **completed** once its scheduled time + a grace window has passed — whether or not the driver remembered to click "Start Trip" — and cascades confirmed bookings to `completed` / unconfirmed requests to `rejected`. Adjust `TRIP_GRACE_HOURS` in `backend/server.js`.
- **Profile:** every user can edit their name, phone, and upload a profile photo (resized client-side, stored as a small base64 image — no external file storage wired up yet) via the avatar menu in the navbar.

## 1. Set up MongoDB Atlas

1. Create a free cluster at https://www.mongodb.com/cloud/atlas.
2. Under **Database Access**, create a DB user with a password.
3. Under **Network Access**, allow your IP (or `0.0.0.0/0` for development).
4. Click **Connect → Drivers**, copy the connection string, e.g.:
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/carpool_platform?retryWrites=true&w=majority`

## 2. Backend setup

```bash
cd backend
cp .env.example .env
# edit .env and paste your MONGODB_URI, set a strong JWT_SECRET
npm install
npm run dev          # starts on http://localhost:5000

# optional: create a platform super admin using SUPERADMIN_* values in .env
npm run seed:superadmin
```

## 3. Frontend setup

```bash
cd frontend
cp .env.example .env    # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev              # starts on http://localhost:5173
```

Open http://localhost:5173.

## 4. Try it out

1. Register a user → you land on "Choose your community".
2. Create a new organization (you become its `org_admin` automatically), or search/join an existing one (goes `pending` until an admin approves it).
3. As the org admin, go to **Admin → Membership Requests** to approve/reject. Notice the 🔔 bell in the navbar lights up when a new request or chat message is waiting for you.
4. As an approved member: post a vehicle (include the vehicle number so passengers can spot it), search/filter trips, request a seat.
5. As the trip owner: open the vehicle's detail page to confirm/reject requests, then click **🚗 Start Trip** once you head out, and **✅ Mark Trip Completed** when you're done (or just leave it — it auto-completes a few hours after the scheduled time).
6. Both the driver and every confirmed passenger see the trip under **Ongoing Trip** while it's in progress, and can message each other via the **💬 Chat** button.
7. As the passenger: once the trip is completed, go to **Completed Trips → Leave feedback**.
8. Click your avatar (top right) → **Edit profile** to update your name, phone, or upload a profile photo.
9. **Admin → Overview** shows live counts (users, pending, vehicles, ongoing/completed pooling, bookings).

## Efficiency notes (backend)

- Indexes on `Vehicle` (`organization + route + date`), `Membership` (`user+organization` unique), and `Booking` keep search/lookup queries fast at scale.
- `helmet`, `cors` (scoped to `CLIENT_URL`), and `express-rate-limit` are enabled by default.
- Mongoose connection uses pooling (`maxPoolSize`) so it's efficient against Atlas under concurrent load.
- All list/search endpoints are scoped by `organization` at the query level (not filtered in app code), so Mongo does the filtering with indexes rather than the app fetching everything and filtering in memory.
- The JSON body limit is raised to `4mb` only to accommodate small base64 profile photo uploads (resized client-side before sending) — everything else stays well under it.

## Extending this scaffold

This is a complete, working core (auth, multi-tenant orgs, approval flow, vehicle CRUD, search/filter, booking lifecycle, ongoing/completed trip tracking, chat, notifications, profiles, admin dashboards, feedback). Things you may want to add for production:
- Move chat and notifications from polling to WebSockets (Socket.io) for instant delivery.
- Move profile photo storage to a real provider (S3/Cloudinary) instead of base64-in-Mongo, once photo volume grows.
- Email notifications (approval, booking confirmed) via a provider like Resend/SendGrid.
- Super Admin frontend screens (the API routes already exist under `/api/admin/platform/*`).
- Pagination on search/list endpoints once data volume grows.
- Automated tests (Jest/Supertest for API, React Testing Library for UI).
