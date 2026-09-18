import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import Sidebar from "../components/Sidebar.jsx";
import VehicleCard from "../components/VehicleCard.jsx";

const links = [
  { to: "/dashboard", label: "Overview", end: true },
  { to: "/vehicles/search", label: "Search Vehicles" },
  { to: "/vehicles/post", label: "Post a Vehicle" },
  { to: "/trips/confirmed", label: "Confirmed Trips" },
  { to: "/trips/ongoing", label: "Ongoing Trip" },
  { to: "/trips/requests", label: "My Requests" },
  { to: "/trips/completed", label: "Completed Trips" },
];

export default function UserDashboard() {
  const { activeOrg } = useAuth();
  const orgId = activeOrg?.org?._id;
  const [latest, setLatest] = useState([]);
  const [counts, setCounts] = useState({ confirmed: 0, requested: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    (async () => {
      setLoading(true);
      const [latestRes, confirmedRes, requestedRes, completedRes] = await Promise.all([
        api.get("/vehicles/latest", { params: { organization: orgId, limit: 6 } }),
        api.get("/bookings/mine", { params: { status: "confirmed" } }),
        api.get("/bookings/mine", { params: { status: "requested" } }),
        api.get("/bookings/mine", { params: { status: "completed" } }),
      ]);
      setLatest(latestRes.data.data);
      setCounts({
        confirmed: confirmedRes.data.data.length,
        requested: requestedRes.data.data.length,
        completed: completedRes.data.data.length,
      });
      setLoading(false);
    })();
  }, [orgId]);

  return (
    <div className="flex">
      <Sidebar links={links} />
      <div className="flex-1 px-6 py-8 max-w-6xl">
        <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
        <p className="text-slate-500 mb-6">{activeOrg?.org?.name} community dashboard</p>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {[
            ["Confirmed trips", counts.confirmed, "/trips/confirmed"],
            ["Pending requests", counts.requested, "/trips/requests"],
            ["Completed trips", counts.completed, "/trips/completed"],
          ].map(([label, value, to]) => (
            <Link key={label} to={to} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-brand-400">
              <div className="text-3xl font-bold text-brand-700">{value}</div>
              <div className="text-sm text-slate-500 mt-1">{label}</div>
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Latest posted vehicles</h2>
          <Link to="/vehicles/search" className="text-sm text-brand-600 font-medium">See all →</Link>
        </div>

        {loading ? (
          <div className="text-slate-500">Loading...</div>
        ) : latest.length === 0 ? (
          <div className="text-slate-500 bg-white border border-dashed border-slate-300 rounded-lg p-8 text-center">
            No vehicles posted yet in this community.{" "}
            <Link to="/vehicles/post" className="text-brand-600 font-medium">Post the first one</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {latest.map((v) => <VehicleCard key={v._id} vehicle={v} />)}
          </div>
        )}
      </div>
    </div>
  );
}
