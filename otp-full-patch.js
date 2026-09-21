// ============================================================
// Super Admin Patch
// 1. Your email as the super admin
// 2. Updated seed.js (superadmin + 2 demo orgs)
// 3. Super Admin can manage all organizations
// Run: node superadmin-patch.js   (from carpool-platform root)
// ============================================================

const fs = require('fs');
const path = require('path');

const backendDir = path.resolve('backend');
const frontendDir = path.resolve('frontend');

if (!fs.existsSync(backendDir) || !fs.existsSync(frontendDir)) {
  console.error('❌ Run this from inside carpool-platform (must contain backend/ and frontend/)');
  process.exit(1);
}

const write = (p, content) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content.replace(/^\n/, ''), 'utf8');
  console.log('  ✏️  Wrote: ' + path.relative(process.cwd(), p));
};

console.log('\n👑 Applying Super Admin patch...\n');

// ============================================================
// 1. UPDATE: backend/.env with YOUR superadmin email
// ============================================================
try {
  const envPath = path.join(backendDir, '.env');
  let env = fs.readFileSync(envPath, 'utf8');

  // Replace SUPERADMIN_* values
  env = env.replace(/SUPERADMIN_EMAIL=.*/g, 'SUPERADMIN_EMAIL=naveenkarthickt@gmail.com');
  env = env.replace(/SUPERADMIN_PASSWORD=.*/g, 'SUPERADMIN_PASSWORD=naveen@123');
  env = env.replace(/SUPERADMIN_NAME=.*/g, 'SUPERADMIN_NAME=Naveen Karthick');

  // If they don't exist yet, append them
  if (!env.includes('SUPERADMIN_EMAIL')) {
    env += `\nSUPERADMIN_EMAIL=naveenkarthickt@gmail.com\nSUPERADMIN_PASSWORD=naveen@123\nSUPERADMIN_NAME=Naveen Karthick\n`;
  }

  fs.writeFileSync(envPath, env, 'utf8');
  console.log('  🔧 Patched: backend/.env (superadmin = naveenkarthickt@gmail.com)');
} catch (e) {
  console.log('  ⚠️  Could not patch .env:', e.message);
}

// Also patch .env.example
try {
  const envExamplePath = path.join(backendDir, '.env.example');
  if (fs.existsSync(envExamplePath)) {
    let env = fs.readFileSync(envExamplePath, 'utf8');
    env = env.replace(/SUPERADMIN_EMAIL=.*/g, 'SUPERADMIN_EMAIL=naveenkarthickt@gmail.com');
    env = env.replace(/SUPERADMIN_PASSWORD=.*/g, 'SUPERADMIN_PASSWORD=naveen@123');
    env = env.replace(/SUPERADMIN_NAME=.*/g, 'SUPERADMIN_NAME=Naveen Karthick');
    if (!env.includes('SUPERADMIN_EMAIL')) {
      env += `\nSUPERADMIN_EMAIL=naveenkarthickt@gmail.com\nSUPERADMIN_PASSWORD=naveen@123\nSUPERADMIN_NAME=Naveen Karthick\n`;
    }
    fs.writeFileSync(envExamplePath, env, 'utf8');
    console.log('  🔧 Patched: backend/.env.example');
  }
} catch (e) {}

// ============================================================
// 2. NEW: backend/seed.js (superadmin + 2 demo orgs)
// ============================================================
write(path.join(backendDir, 'seed.js'), `
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/User.js";
import Organization from "./src/models/Organization.js";
import Membership from "./src/models/Membership.js";
import Vehicle from "./src/models/Vehicle.js";

dotenv.config();

const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL || "naveenkarthickt@gmail.com";
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || "naveen@123";
const SUPERADMIN_NAME = process.env.SUPERADMIN_NAME || "Naveen Karthick";

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  await User.deleteMany({});
  await Organization.deleteMany({});
  await Membership.deleteMany({});
  await Vehicle.deleteMany({});
  console.log("Cleared existing data\\n");

  // ---------- 1. SUPERADMIN (you) ----------
  await User.create({
    name: SUPERADMIN_NAME,
    email: SUPERADMIN_EMAIL.toLowerCase(),
    password: SUPERADMIN_PASSWORD,
    platformRole: "super_admin",
  });
  console.log(\`✓ Superadmin created: \${SUPERADMIN_EMAIL}\`);

  // ---------- 2. Demo Org 1 — Green Ride Co ----------
  const admin1 = await User.create({
    name: "Alex Rivera",
    email: "admin@greenride.com",
    password: "admin123",
    phone: "+91 90000 11111",
  });
  const org1 = await Organization.create({
    name: "Green Ride Co",
    slug: "green-ride-co",
    type: "corporate",
    size: "medium",
    description: "Eco-friendly carpool community",
    location: "Bangalore",
    createdBy: admin1._id,
  });
  await Membership.create({
    user: admin1._id, organization: org1._id, role: "org_admin", status: "approved",
    reviewedBy: admin1._id, reviewedAt: new Date(),
  });

  const user1 = await User.create({
    name: "Jamie Lee", email: "user@greenride.com",
    password: "user123", phone: "+91 90000 22222",
  });
  await Membership.create({
    user: user1._id, organization: org1._id, role: "member", status: "approved",
    reviewedBy: admin1._id, reviewedAt: new Date(),
  });
  console.log("✓ Green Ride Co created with 2 members");

  // ---------- 3. Demo Org 2 — Metro Poolers ----------
  const admin2 = await User.create({
    name: "Priya Shah", email: "admin@metropool.com", password: "admin123",
  });
  const org2 = await Organization.create({
    name: "Metro Poolers", slug: "metro-poolers",
    type: "residency", size: "large",
    description: "City commuter pooling", location: "Mumbai",
    createdBy: admin2._id,
  });
  await Membership.create({
    user: admin2._id, organization: org2._id, role: "org_admin", status: "approved",
    reviewedBy: admin2._id, reviewedAt: new Date(),
  });
  console.log("✓ Metro Poolers created with 1 admin");

  // ---------- 4. Demo vehicles ----------
  const tomorrow = new Date(Date.now() + 86400000);
  const dayAfter = new Date(Date.now() + 2 * 86400000);

  await Vehicle.insertMany([
    { organization: org1._id, postedBy: admin1._id, vehicleType: "car", vehicleModel: "Toyota Camry", vehicleNumber: "CA 1234",
      startLocation: "Downtown", destination: "Airport", travelDate: tomorrow, travelTime: "08:30",
      totalSeats: 5, availableSeats: 4, farePerSeat: 12, status: "available" },
    { organization: org1._id, postedBy: admin1._id, vehicleType: "van", vehicleModel: "Ford Transit", vehicleNumber: "TX 9012",
      startLocation: "Uptown", destination: "Tech Park", travelDate: dayAfter, travelTime: "07:00",
      totalSeats: 8, availableSeats: 6, farePerSeat: 8, status: "available" },
    { organization: org1._id, postedBy: admin1._id, vehicleType: "car", vehicleModel: "Honda City", vehicleNumber: "KA 05 XY 7890",
      startLocation: "Whitefield", destination: "Electronic City", travelDate: tomorrow, travelTime: "09:15",
      totalSeats: 4, availableSeats: 3, farePerSeat: 0, status: "available" },
    { organization: org2._id, postedBy: admin2._id, vehicleType: "other", vehicleModel: "Honda CR-V", vehicleNumber: "NY 5678",
      startLocation: "North Side", destination: "City Center", travelDate: tomorrow, travelTime: "09:00",
      totalSeats: 5, availableSeats: 3, farePerSeat: 10, status: "available" },
  ]);
  console.log("✓ 4 demo vehicles created");

  console.log("\\n✅ Seed complete!\\n");
  console.log("Your super admin login:");
  console.log(\`  Email:    \${SUPERADMIN_EMAIL}\`);
  console.log(\`  Password: \${SUPERADMIN_PASSWORD}\`);
  console.log("");
  console.log("Demo org accounts (for testing):");
  console.log("  Admin 1: admin@greenride.com / admin123");
  console.log("  Admin 2: admin@metropool.com / admin123");
  console.log("  User:    user@greenride.com  / user123");
  console.log("");

  await mongoose.disconnect();
  process.exit(0);
};
run().catch((e) => { console.error("❌", e.message); process.exit(1); });
`);

// ============================================================
// 3. UPDATE: backend/src/utils/seedSuperAdmin.js
// ============================================================
write(path.join(backendDir, 'src/utils/seedSuperAdmin.js'), `
import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import mongoose from "mongoose";

dotenv.config();

const run = async () => {
  await connectDB();
  const email = (process.env.SUPERADMIN_EMAIL || "naveenkarthickt@gmail.com").toLowerCase();
  const password = process.env.SUPERADMIN_PASSWORD || "naveen@123";
  const name = process.env.SUPERADMIN_NAME || "Naveen Karthick";

  let user = await User.findOne({ email });
  if (user) {
    user.platformRole = "super_admin";
    await user.save();
    console.log(\`Existing user \${email} upgraded to super_admin\`);
  } else {
    user = await User.create({ name, email, password, platformRole: "super_admin" });
    console.log(\`Super admin created: \${email}\`);
  }
  await mongoose.disconnect();
  process.exit(0);
};
run();
`);

// ============================================================
// 4. UPDATE: backend/src/controllers/adminController.js
//    Add full org management endpoints (users, vehicles)
// ============================================================
const adminControllerPath = path.join(backendDir, 'src/controllers/adminController.js');
let adminSrc = fs.readFileSync(adminControllerPath, 'utf8');

if (!adminSrc.includes('platformOrgDetails')) {
  adminSrc += `

// ------------- Super Admin: full org details -------------

// @route GET /api/admin/platform/orgs/:orgId/details
export const platformOrgDetails = asyncHandler(async (req, res) => {
  const { orgId } = req.params;
  const [org, memberships, vehicles, bookings] = await Promise.all([
    Organization.findById(orgId).populate("createdBy", "name email"),
    Membership.find({ organization: orgId }).populate("user", "name email phone platformRole"),
    Vehicle.find({ organization: orgId }).populate("postedBy", "name email"),
    Booking.find({ organization: orgId })
      .populate("passenger", "name email")
      .populate("vehicle", "startLocation destination"),
  ]);
  if (!org) { res.status(404); throw new Error("Organization not found"); }

  res.json({
    success: true,
    data: { org, memberships, vehicles, bookings },
  });
});

// @route DELETE /api/admin/platform/orgs/:orgId
export const platformDeleteOrg = asyncHandler(async (req, res) => {
  const { orgId } = req.params;
  const org = await Organization.findById(orgId);
  if (!org) { res.status(404); throw new Error("Organization not found"); }

  await Promise.all([
    Organization.findByIdAndDelete(orgId),
    Membership.deleteMany({ organization: orgId }),
    Vehicle.deleteMany({ organization: orgId }),
    Booking.deleteMany({ organization: orgId }),
  ]);

  res.json({ success: true, data: { message: "Organization deleted", orgId } });
});

// @route POST /api/admin/platform/orgs/:orgId/make-admin/:userId
export const platformPromoteToOrgAdmin = asyncHandler(async (req, res) => {
  const { orgId, userId } = req.params;
  const membership = await Membership.findOne({ user: userId, organization: orgId });
  if (!membership) { res.status(404); throw new Error("Membership not found"); }
  membership.role = "org_admin";
  membership.status = "approved";
  membership.reviewedBy = req.user._id;
  membership.reviewedAt = new Date();
  await membership.save();
  res.json({ success: true, data: membership });
});

// @route DELETE /api/admin/platform/orgs/:orgId/members/:userId
export const platformRemoveMember = asyncHandler(async (req, res) => {
  const { orgId, userId } = req.params;
  const result = await Membership.findOneAndDelete({ user: userId, organization: orgId });
  if (!result) { res.status(404); throw new Error("Membership not found"); }
  res.json({ success: true, data: { message: "Member removed" } });
});
`;
  fs.writeFileSync(adminControllerPath, adminSrc, 'utf8');
  console.log('  🔧 Patched: backend/src/controllers/adminController.js');
} else {
  console.log('  ✓ adminController.js already has org management endpoints');
}

// ============================================================
// 5. UPDATE: backend/src/routes/adminRoutes.js
// ============================================================
write(path.join(backendDir, 'src/routes/adminRoutes.js'), `
import express from "express";
import {
  orgStats, orgVehicles, orgVehicleInterest,
  platformStats, platformOrganizations, setOrganizationActive,
  platformUsers, setUserPlatformRole,
  platformOrgDetails, platformDeleteOrg,
  platformPromoteToOrgAdmin, platformRemoveMember,
} from "../controllers/adminController.js";
import { protect, requireOrgAdmin, superAdminOnly } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

// Org admin
router.get("/orgs/:orgId/stats", requireOrgAdmin, orgStats);
router.get("/orgs/:orgId/vehicles", requireOrgAdmin, orgVehicles);
router.get("/orgs/:orgId/vehicles/:vehicleId/interest", requireOrgAdmin, orgVehicleInterest);

// Platform super admin — overview
router.get("/platform/stats", superAdminOnly, platformStats);
router.get("/platform/orgs", superAdminOnly, platformOrganizations);
router.patch("/platform/orgs/:orgId", superAdminOnly, setOrganizationActive);
router.get("/platform/users", superAdminOnly, platformUsers);
router.patch("/platform/users/:userId", superAdminOnly, setUserPlatformRole);

// Platform super admin — org management
router.get("/platform/orgs/:orgId/details", superAdminOnly, platformOrgDetails);
router.delete("/platform/orgs/:orgId", superAdminOnly, platformDeleteOrg);
router.post("/platform/orgs/:orgId/make-admin/:userId", superAdminOnly, platformPromoteToOrgAdmin);
router.delete("/platform/orgs/:orgId/members/:userId", superAdminOnly, platformRemoveMember);

export default router;
`);

// ============================================================
// 6. UPDATE: frontend/src/pages/SuperAdminDashboard.jsx
//    Adds "Manage" button per org → opens a detail modal
// ============================================================
write(path.join(frontendDir, 'src/pages/SuperAdminDashboard.jsx'), `
import { useEffect, useState } from "react";
import { Shield, Building2, Car, CalendarCheck, Users2, X, Trash2, UserCog, UserMinus } from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import { useToast } from "../components/Toast.jsx";

const StatCard = ({ icon: Icon, label, value }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
    <div className="flex items-center gap-2 text-slate-400 mb-2">
      <Icon className="w-4 h-4" />
      <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
    </div>
    <div className="text-3xl font-bold text-primary dark:text-sky-300">{value ?? "—"}</div>
  </div>
);

// ---------- Manage Org Modal ----------
function ManageOrgModal({ orgId, onClose, onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("members");
  const [confirm, setConfirm] = useState(null);
  const showToast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get(\`/admin/platform/orgs/\${orgId}/details\`);
      setData(res.data);
    } catch (err) {
      showToast(err.response?.data?.message || "Could not load org details", "error");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [orgId]);

  const promoteToAdmin = async (userId) => {
    try {
      await api.post(\`/admin/platform/orgs/\${orgId}/make-admin/\${userId}\`);
      showToast("Member promoted to org admin");
      load(); onChanged?.();
    } catch (err) { showToast(err.response?.data?.message || "Failed", "error"); }
  };

  const removeMember = async (userId) => {
    try {
      await api.delete(\`/admin/platform/orgs/\${orgId}/members/\${userId}\`);
      showToast("Member removed", "error");
      load(); onChanged?.();
    } catch (err) { showToast(err.response?.data?.message || "Failed", "error"); }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="font-bold text-lg text-primary dark:text-sky-300">{data?.org?.name || "Loading..."}</h2>
            <p className="text-xs text-slate-500">{data?.org?.location}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-3 border-b border-slate-100 dark:border-slate-800">
          {[
            { id: "members", label: \`Members (\${data?.memberships?.length ?? 0})\` },
            { id: "vehicles", label: \`Vehicles (\${data?.vehicles?.length ?? 0})\` },
            { id: "bookings", label: \`Bookings (\${data?.bookings?.length ?? 0})\` },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={\`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition \${tab === t.id ? "border-accent text-primary dark:text-sky-300" : "border-transparent text-slate-500 hover:text-slate-800"}\`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="text-slate-500 text-sm">Loading...</div>
          ) : tab === "members" ? (
            <div className="space-y-2">
              {data.memberships.map((m) => (
                <div key={m._id} className="flex items-center justify-between border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate">
                      {m.user?.name}
                      <span className={\`ml-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full \${m.role === "org_admin" ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-500"}\`}>
                        {m.role}
                      </span>
                      <span className={\`ml-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full \${m.status === "approved" ? "bg-emerald-100 text-emerald-700" : m.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}\`}>
                        {m.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 truncate">{m.user?.email} {m.user?.phone && \`· \${m.user.phone}\`}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {m.role !== "org_admin" && (
                      <button onClick={() => setConfirm({ type: "promote", userId: m.user._id, name: m.user.name })}
                        className="text-xs px-2 py-1 rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1">
                        <UserCog className="w-3 h-3" /> Make admin
                      </button>
                    )}
                    <button onClick={() => setConfirm({ type: "remove", userId: m.user._id, name: m.user.name })}
                      className="text-xs px-2 py-1 rounded-md border border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 inline-flex items-center gap-1">
                      <UserMinus className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              ))}
              {data.memberships.length === 0 && <div className="text-slate-400 text-sm text-center py-8">No members yet.</div>}
            </div>
          ) : tab === "vehicles" ? (
            <div className="space-y-2">
              {data.vehicles.map((v) => (
                <div key={v._id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm text-slate-800 dark:text-slate-200">
                      {v.startLocation} → {v.destination}
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{v.status}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {v.vehicleModel || v.vehicleType} {v.vehicleNumber && \`· \${v.vehicleNumber}\`} · Driver: {v.postedBy?.name} · {new Date(v.travelDate).toLocaleDateString()} {v.travelTime}
                  </div>
                </div>
              ))}
              {data.vehicles.length === 0 && <div className="text-slate-400 text-sm text-center py-8">No vehicles yet.</div>}
            </div>
          ) : (
            <div className="space-y-2">
              {data.bookings.map((b) => (
                <div key={b._id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm text-slate-800 dark:text-slate-200">
                      {b.vehicle?.startLocation} → {b.vehicle?.destination}
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{b.status}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Passenger: {b.passenger?.name} · {b.seatsRequested} seat(s) · {new Date(b.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {data.bookings.length === 0 && <div className="text-slate-400 text-sm text-center py-8">No bookings yet.</div>}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={!!confirm}
        title={confirm?.type === "promote" ? "Promote to org admin?" : "Remove this member?"}
        message={confirm?.name ? (confirm.type === "promote"
          ? \`\${confirm.name} will get org_admin rights for this organization.\`
          : \`\${confirm.name} will lose access to this organization.\`) : ""}
        confirmLabel={confirm?.type === "promote" ? "Promote" : "Remove"}
        danger={confirm?.type === "remove"}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm.type === "promote") promoteToAdmin(confirm.userId);
          else removeMember(confirm.userId);
          setConfirm(null);
        }}
      />
    </div>
  );
}

// ---------- Main Dashboard ----------
export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("orgs");
  const [stats, setStats] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [manageOrgId, setManageOrgId] = useState(null);
  const showToast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [statsRes, orgsRes, usersRes] = await Promise.all([
        api.get("/admin/platform/stats"),
        api.get("/admin/platform/orgs"),
        api.get("/admin/platform/users"),
      ]);
      setStats(statsRes.data.data);
      setOrgs(orgsRes.data.data);
      setUsers(usersRes.data.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const setOrgActive = async (org, isActive) => {
    try {
      await api.patch(\`/admin/platform/orgs/\${org._id}\`, { isActive });
      showToast(isActive ? \`\${org.name} reactivated\` : \`\${org.name} suspended\`, isActive ? "success" : "error");
      load();
    } catch (err) { showToast(err.response?.data?.message || "Failed", "error"); }
  };

  const deleteOrg = async (org) => {
    try {
      await api.delete(\`/admin/platform/orgs/\${org._id}\`);
      showToast(\`\${org.name} deleted\`, "error");
      load();
    } catch (err) { showToast(err.response?.data?.message || "Failed", "error"); }
  };

  const changeRole = async (u, platformRole) => {
    try {
      await api.patch(\`/admin/platform/users/\${u._id}\`, { platformRole });
      showToast(\`\${u.name} is now \${platformRole === "super_admin" ? "a super admin" : "a regular user"}\`);
      load();
    } catch (err) { showToast(err.response?.data?.message || "Failed", "error"); }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-2 mb-1">
        <Shield className="w-6 h-6 text-accent" />
        <h1 className="text-2xl font-bold text-primary dark:text-sky-300">Super Admin</h1>
      </div>
      <p className="text-slate-500 mb-6">You have full control over every organization and user on the platform.</p>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Building2} label="Organizations" value={stats?.organizations} />
        <StatCard icon={Car} label="Vehicles posted" value={stats?.vehicles} />
        <StatCard icon={CalendarCheck} label="Bookings" value={stats?.bookings} />
        <StatCard icon={Users2} label="Memberships" value={stats?.memberships} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-slate-200 dark:border-slate-700">
        {[{ id: "orgs", label: "Organizations" }, { id: "users", label: "All Users" }].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={\`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors \${tab === t.id ? "border-accent text-primary dark:text-sky-300" : "border-transparent text-slate-500 hover:text-slate-800"}\`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <div className="text-slate-500">Loading...</div>
      : tab === "orgs" ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Organization</th>
                  <th className="text-left px-4 py-3 font-semibold">Created by</th>
                  <th className="text-left px-4 py-3 font-semibold">Members</th>
                  <th className="text-left px-4 py-3 font-semibold">Vehicles</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((o) => (
                  <tr key={o._id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{o.name}</div>
                      <div className="text-xs text-slate-400">{o.location}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {o.createdBy?.name}
                      <div className="text-xs text-slate-400">{o.createdBy?.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{o.userCount}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{o.vehicleCount}</td>
                    <td className="px-4 py-3">
                      <span className={\`text-xs font-bold px-2 py-1 rounded-full \${o.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}\`}>
                        {o.isActive ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => setManageOrgId(o._id)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-accent text-white hover:bg-[#008fad]">
                          Manage
                        </button>
                        <button onClick={() => (o.isActive ? setSuspendTarget(o) : setOrgActive(o, true))}
                          className="text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800">
                          {o.isActive ? "Suspend" : "Activate"}
                        </button>
                        <button onClick={() => setDeleteTarget(o)}
                          className="w-7 h-7 rounded-full border border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center justify-center"
                          title="Delete organization">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {orgs.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-slate-400">No organizations yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Name</th>
                  <th className="text-left px-4 py-3 font-semibold">Email</th>
                  <th className="text-left px-4 py-3 font-semibold">Platform role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{u.name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{u.email}</td>
                    <td className="px-4 py-3">
                      <select value={u.platformRole} onChange={(e) => changeRole(u, e.target.value)}
                        disabled={u._id === user?.id}
                        className="text-xs border border-slate-200 dark:border-slate-600 dark:bg-slate-900 rounded-full px-3 py-1.5 font-semibold focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50">
                        <option value="user">User</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan={3} className="text-center py-10 text-slate-400">No users yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Suspend confirmation */}
      <ConfirmModal open={!!suspendTarget} title="Suspend this organization?"
        message={suspendTarget ? \`Members of "\${suspendTarget.name}" will no longer be able to use pooling features until reactivated.\` : ""}
        confirmLabel="Suspend organization" danger
        onCancel={() => setSuspendTarget(null)}
        onConfirm={() => { setOrgActive(suspendTarget, false); setSuspendTarget(null); }} />

      {/* Delete confirmation */}
      <ConfirmModal open={!!deleteTarget} title="Delete this organization?"
        message={deleteTarget ? \`"\${deleteTarget.name}" and ALL its members, vehicles and bookings will be permanently deleted. This cannot be undone.\` : ""}
        confirmLabel="Delete permanently" danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => { deleteOrg(deleteTarget); setDeleteTarget(null); }} />

      {/* Manage Org modal */}
      {manageOrgId && (
        <ManageOrgModal orgId={manageOrgId} onClose={() => setManageOrgId(null)} onChanged={load} />
      )}
    </div>
  );
}
`);

console.log('\n✅ Super Admin patch applied!\n');
console.log('Next steps:\n');
console.log('  1. Run seed to create your super admin account:');
console.log('     cd backend');
console.log('     npm run seed');
console.log('');
console.log('  2. Commit & push:');
console.log('     cd ..');
console.log('     git add .');
console.log('     git commit -m "Super admin: full org management"');
console.log('     git push');
console.log('');
console.log('  3. On Vercel, add SUPERADMIN_* to backend env vars (if missing):');
console.log('     SUPERADMIN_EMAIL=naveenkarthickt@gmail.com');
console.log('     SUPERADMIN_PASSWORD=naveen@123');
console.log('     SUPERADMIN_NAME=Naveen Karthick');
console.log('');
console.log('  4. Redeploy BOTH Vercel projects\n');
console.log('  Your super admin login:');
console.log('    naveenkarthickt@gmail.com / naveen@123\n');