import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import Sidebar from "../components/Sidebar.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

const links = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/members", label: "Membership Requests" },
  { to: "/admin/vehicles", label: "Vehicles & Trips" },
];

const StatCard = ({ label, value }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-5">
    <div className="text-3xl font-bold text-brand-700">{value ?? "—"}</div>
    <div className="text-sm text-slate-500 mt-1">{label}</div>
  </div>
);

export default function AdminDashboard() {
  const { activeOrg } = useAuth();
  const orgId = activeOrg?.org?._id;
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!orgId) return;
    api.get(`/admin/orgs/${orgId}/stats`).then((r) => setStats(r.data.data));
  }, [orgId]);

  return (
    <div className="flex">
      <Sidebar links={links} />
      <div className="flex-1 px-6 py-8 max-w-5xl">
        <h1 className="text-2xl font-bold mb-1">Admin dashboard</h1>
        <p className="text-slate-500 mb-6">Monitoring {activeOrg?.org?.name}</p>
        <div className="grid sm:grid-cols-4 gap-4">
          <StatCard label="Total users" value={stats?.totalUsers} />
          <StatCard label="Pending registrations" value={stats?.pending} />
          <StatCard label="Approved users" value={stats?.approved} />
          <StatCard label="Rejected users" value={stats?.rejected} />
          <StatCard label="Posted vehicles" value={stats?.postedVehicles} />
          <StatCard label="Ongoing pooling" value={stats?.ongoing} />
          <StatCard label="Completed pooling" value={stats?.completed} />
          <StatCard label="Current bookings" value={stats?.currentBookings} />
        </div>
      </div>
    </div>
  );
}

export function MembershipRequests() {
  const { activeOrg } = useAuth();
  const orgId = activeOrg?.org?._id;
  const [members, setMembers] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get(`/orgs/${orgId}/members`, { params: filter ? { status: filter } : {} });
    setMembers(data.data);
    setLoading(false);
  };

  useEffect(() => { if (orgId) load(); /* eslint-disable-next-line */ }, [orgId, filter]);

  const review = async (membershipId, decision) => {
    await api.patch(`/orgs/${orgId}/members/${membershipId}`, { decision });
    load();
  };

  return (
    <div className="flex">
      <Sidebar links={links} />
      <div className="flex-1 px-6 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Membership requests</h1>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border border-slate-300 rounded-md px-3 py-1.5 text-sm">
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="">All</option>
          </select>
        </div>
        {loading ? (
          <div className="text-slate-500">Loading...</div>
        ) : members.length === 0 ? (
          <div className="text-slate-500 bg-white border border-dashed border-slate-300 rounded-lg p-8 text-center">
            No {filter || ""} requests.
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m._id} className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{m.user.name}</div>
                  <div className="text-xs text-slate-500">{m.user.email} {m.user.phone && `· ${m.user.phone}`}</div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={m.status} />
                  {m.status === "pending" && (
                    <>
                      <button onClick={() => review(m._id, "approved")} className="text-xs px-3 py-1.5 rounded-md bg-emerald-600 text-white">Approve</button>
                      <button onClick={() => review(m._id, "rejected")} className="text-xs px-3 py-1.5 rounded-md bg-rose-600 text-white">Reject</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminVehicles() {
  const { activeOrg } = useAuth();
  const orgId = activeOrg?.org?._id;
  const [status, setStatus] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    api.get(`/admin/orgs/${orgId}/vehicles`, { params: status ? { status } : {} })
      .then((r) => setVehicles(r.data.data))
      .finally(() => setLoading(false));
  }, [orgId, status]);

  return (
    <div className="flex">
      <Sidebar links={links} />
      <div className="flex-1 px-6 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Vehicles & trips</h1>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-slate-300 rounded-md px-3 py-1.5 text-sm">
            <option value="">All statuses</option>
            <option value="available">Available</option>
            <option value="full">Full</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        {loading ? (
          <div className="text-slate-500">Loading...</div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="p-3">Route</th><th className="p-3">Driver</th>
                  <th className="p-3">Date</th><th className="p-3">Seats</th><th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v._id} className="border-t border-slate-100">
                    <td className="p-3">{v.startLocation} → {v.destination}</td>
                    <td className="p-3">{v.postedBy?.name}</td>
                    <td className="p-3">{new Date(v.travelDate).toLocaleDateString()}</td>
                    <td className="p-3">{v.availableSeats}/{v.totalSeats}</td>
                    <td className="p-3"><StatusBadge status={v.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
