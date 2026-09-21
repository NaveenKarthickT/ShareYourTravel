import { useEffect, useState } from "react";
import { Shield, Building2, Car, CalendarCheck, Users2 } from "lucide-react";
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

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("orgs");
  const [stats, setStats] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suspendTarget, setSuspendTarget] = useState(null);
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
      await api.patch(`/admin/platform/orgs/${org._id}`, { isActive });
      showToast(isActive ? `${org.name} reactivated` : `${org.name} suspended`, isActive ? "success" : "error");
      load();
    } catch (err) { showToast(err.response?.data?.message || "Could not update organization", "error"); }
  };

  const changeRole = async (u, platformRole) => {
    try {
      await api.patch(`/admin/platform/users/${u._id}`, { platformRole });
      showToast(`${u.name} is now ${platformRole === "super_admin" ? "a super admin" : "a regular user"}`);
      load();
    } catch (err) { showToast(err.response?.data?.message || "Could not update role", "error"); }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-2 mb-1">
        <Shield className="w-6 h-6 text-accent" />
        <h1 className="text-2xl font-bold text-primary dark:text-sky-300">Super Admin · Platform Overview</h1>
      </div>
      <p className="text-slate-500 mb-6">Monitor every pooling community across the platform.</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Building2} label="Organizations" value={stats?.organizations} />
        <StatCard icon={Car} label="Vehicles posted" value={stats?.vehicles} />
        <StatCard icon={CalendarCheck} label="Bookings" value={stats?.bookings} />
        <StatCard icon={Users2} label="Memberships" value={stats?.memberships} />
      </div>

      <div className="flex gap-2 mb-4 border-b border-slate-200 dark:border-slate-700">
        {[{ id: "orgs", label: "Organizations" }, { id: "users", label: "All Users" }].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === t.id ? "border-accent text-primary dark:text-sky-300" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
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
                  <th className="text-right px-4 py-3 font-semibold">Action</th>
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
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${o.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                        {o.isActive ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => (o.isActive ? setSuspendTarget(o) : setOrgActive(o, true))}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800">
                        {o.isActive ? "Suspend" : "Activate"}
                      </button>
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

      <ConfirmModal open={!!suspendTarget} title="Suspend this organization?"
        message={suspendTarget ? `Members of "${suspendTarget.name}" will no longer be able to use pooling features until it's reactivated.` : ""}
        confirmLabel="Suspend organization" danger
        onCancel={() => setSuspendTarget(null)}
        onConfirm={() => { setOrgActive(suspendTarget, false); setSuspendTarget(null); }} />
    </div>
  );
}
