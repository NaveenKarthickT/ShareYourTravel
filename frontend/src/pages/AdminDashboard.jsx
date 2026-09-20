import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PlusCircle } from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import Sidebar from "../components/Sidebar.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import { useToast } from "../components/Toast.jsx";

const links = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/members", label: "Membership Requests" },
  { to: "/admin/vehicles", label: "Vehicles & Trips" },
  { to: "/admin/add-vehicle", label: "Post a Vehicle" },
];

const StatCard = ({ label, value }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-5">
    <div className="text-3xl font-bold text-primary">{value ?? "—"}</div>
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
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1 text-primary">Admin dashboard</h1>
            <p className="text-slate-500">Monitoring {activeOrg?.org?.name}</p>
          </div>
          <Link
            to="/admin/add-vehicle"
            className="shrink-0 inline-flex items-center gap-1.5 bg-accent text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-[#008fad]"
          >
            <PlusCircle className="w-4 h-4" /> Post a vehicle
          </Link>
        </div>

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
  const [confirmTarget, setConfirmTarget] = useState(null);
  const showToast = useToast();

  const load = async () => {
    setLoading(true);
    const { data } = await api.get(`/orgs/${orgId}/members`, { params: filter ? { status: filter } : {} });
    setMembers(data.data);
    setLoading(false);
  };

  useEffect(() => { if (orgId) load(); /* eslint-disable-next-line */ }, [orgId, filter]);

  const review = async (member, decision) => {
    try {
      await api.patch(`/orgs/${orgId}/members/${member._id}`, { decision });
      showToast(decision === "approved" ? `Approved ${member.user.name}` : `Rejected ${member.user.name}`,
        decision === "approved" ? "success" : "error");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Could not update this request.", "error");
    }
  };

  return (
    <div className="flex">
      <Sidebar links={links} />
      <div className="flex-1 px-6 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-primary">Membership requests</h1>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent">
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="">All</option>
          </select>
        </div>
        {loading ? (
          <div className="text-slate-500">Loading...</div>
        ) : members.length === 0 ? (
          <div className="text-slate-500 bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
            No {filter || ""} requests.
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m._id} className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-800">{m.user.name}</div>
                  <div className="text-xs text-slate-500">{m.user.email} {m.user.phone && `· ${m.user.phone}`}</div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={m.status} />
                  {m.status === "pending" && (
                    <>
                      <button onClick={() => review(m, "approved")}
                        className="text-xs px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700">
                        Approve
                      </button>
                      <button onClick={() => setConfirmTarget(m)}
                        className="text-xs px-3 py-1.5 rounded-md bg-rose-600 text-white hover:bg-rose-700">
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!confirmTarget}
        title="Reject this request?"
        message={confirmTarget ? `${confirmTarget.user.name} will be notified that their request to join was declined.` : ""}
        confirmLabel="Reject request"
        danger
        onCancel={() => setConfirmTarget(null)}
        onConfirm={() => { review(confirmTarget, "rejected"); setConfirmTarget(null); }}
      />
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
          <h1 className="text-2xl font-bold text-primary">Vehicles & trips</h1>
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent">
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
              <thead className="bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="p-3">Route</th><th className="p-3">Driver</th>
                  <th className="p-3">Date</th><th className="p-3">Seats</th><th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v._id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-3 text-slate-800">{v.startLocation} → {v.destination}</td>
                    <td className="p-3 text-slate-600">{v.postedBy?.name}</td>
                    <td className="p-3 text-slate-600">{new Date(v.travelDate).toLocaleDateString()}</td>
                    <td className="p-3 text-slate-600">{v.availableSeats}/{v.totalSeats}</td>
                    <td className="p-3"><StatusBadge status={v.status} /></td>
                  </tr>
                ))}
                {vehicles.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-slate-400">No vehicles found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}