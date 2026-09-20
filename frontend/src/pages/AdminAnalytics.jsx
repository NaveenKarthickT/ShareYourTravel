import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import Sidebar from "../components/Sidebar.jsx";
import { SkeletonStatRow } from "../components/Skeleton.jsx";

const links = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/members", label: "Membership Requests" },
  { to: "/admin/vehicles", label: "Vehicles & Trips" },
  { to: "/admin/add-vehicle", label: "Post a Vehicle" },
  { to: "/admin/analytics", label: "Analytics" },
];

const STATUS_COLORS = {
  requested: "#f59e0b",
  confirmed: "#06b6d4",
  completed: "#64748b",
  rejected: "#f43f5e",
  cancelled: "#94a3b8",
};

const ROLE_COLORS = {
  org_admin: "#0B2B4F",
  member: "#00A3C4",
};

const Card = ({ title, children, className = "" }) => (
  <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 ${className}`}>
    <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4 text-sm">{title}</h3>
    {children}
  </div>
);

export default function AdminAnalytics() {
  const { activeOrg } = useAuth();
  const orgId = activeOrg?.org?._id;
  const [summary, setSummary] = useState(null);
  const [tripsPerDay, setTripsPerDay] = useState([]);
  const [topRoutes, setTopRoutes] = useState([]);
  const [statusBreakdown, setStatusBreakdown] = useState([]);
  const [roleBreakdown, setRoleBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    (async () => {
      setLoading(true);
      try {
        const [s, t, r, b, u] = await Promise.all([
          api.get(`/analytics/org/${orgId}/summary`),
          api.get(`/analytics/org/${orgId}/trips-per-day?days=30`),
          api.get(`/analytics/org/${orgId}/top-routes?limit=5`),
          api.get(`/analytics/org/${orgId}/booking-status`),
          api.get(`/analytics/org/${orgId}/user-roles`),
        ]);
        setSummary(s.data.data);
        setTripsPerDay(t.data.data);
        setTopRoutes(r.data.data);
        setStatusBreakdown(b.data.data);
        setRoleBreakdown(u.data.data);
      } catch (err) {
        console.error("Analytics load failed:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [orgId]);

  return (
    <div className="flex">
      <Sidebar links={links} />
      <div className="flex-1 px-6 py-8 max-w-6xl">
        <h1 className="text-2xl font-bold mb-1 text-primary dark:text-sky-300">Analytics</h1>
        <p className="text-slate-500 mb-6">Insights for {activeOrg?.org?.name}</p>

        {loading ? (
          <SkeletonStatRow count={4} />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <Card>
                <div className="text-3xl font-bold text-primary dark:text-sky-300">{summary?.totalTrips ?? 0}</div>
                <div className="text-xs text-slate-500 mt-1">Total trips posted</div>
              </Card>
              <Card>
                <div className="text-3xl font-bold text-primary dark:text-sky-300">{summary?.totalBookings ?? 0}</div>
                <div className="text-xs text-slate-500 mt-1">Total bookings</div>
              </Card>
              <Card>
                <div className="text-3xl font-bold text-primary dark:text-sky-300">{summary?.completedTrips ?? 0}</div>
                <div className="text-xs text-slate-500 mt-1">Completed trips</div>
              </Card>
              <Card>
                <div className="text-3xl font-bold text-primary dark:text-sky-300">{summary?.activeUsers ?? 0}</div>
                <div className="text-xs text-slate-500 mt-1">Active members</div>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-5 mb-6">
              <Card title="Trips posted (last 30 days)">
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={tripsPerDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      fontSize={10}
                      tickFormatter={(d) => d.slice(5)}
                    />
                    <YAxis fontSize={10} allowDecimals={false} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#00A3C4"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <Card title="Top 5 routes">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={topRoutes} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" fontSize={10} allowDecimals={false} />
                    <YAxis
                      dataKey="route"
                      type="category"
                      fontSize={10}
                      width={130}
                    />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0B2B4F" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-5">
              <Card title="Booking status">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={statusBreakdown}
                      dataKey="count"
                      nameKey="status"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {statusBreakdown.map((entry) => (
                        <Cell
                          key={entry.status}
                          fill={STATUS_COLORS[entry.status] || "#94a3b8"}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend fontSize={11} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              <Card title="Members by role">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={roleBreakdown}
                      dataKey="count"
                      nameKey="role"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {roleBreakdown.map((entry) => (
                        <Cell
                          key={entry.role}
                          fill={ROLE_COLORS[entry.role] || "#94a3b8"}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend fontSize={11} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}