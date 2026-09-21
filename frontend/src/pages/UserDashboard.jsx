import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Car, PlusCircle } from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import Sidebar from "../components/Sidebar.jsx";
import VehicleCard from "../components/VehicleCard.jsx";
import { SkeletonGrid, SkeletonStatRow } from "../components/Skeleton.jsx";

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
        <h1 className="text-2xl font-bold mb-1 text-primary dark:text-sky-300">Welcome back</h1>
        <p className="text-slate-500 mb-6">{activeOrg?.org?.name} community dashboard</p>

        {loading ? (
          <SkeletonStatRow count={3} />
        ) : (
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {[
              ["Confirmed trips", counts.confirmed, "/trips/confirmed"],
              ["Pending requests", counts.requested, "/trips/requests"],
              ["Completed trips", counts.completed, "/trips/completed"],
            ].map(([label, value, to]) => (
              <Link key={label} to={to}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:border-accent hover:shadow-sm transition">
                <div className="text-3xl font-bold text-primary dark:text-sky-300">{value}</div>
                <div className="text-sm text-slate-500 mt-1">{label}</div>
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg text-slate-700 dark:text-slate-300">Latest posted vehicles</h2>
          <Link to="/vehicles/search" className="text-sm text-accent font-medium hover:underline">See all →</Link>
        </div>

        {loading ? (
          <SkeletonGrid count={3} />
        ) : latest.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-accent-soft flex items-center justify-center mx-auto mb-4">
              <Car className="w-7 h-7 text-accent" />
            </div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">No vehicles yet</h3>
            <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
              Be the first to share a ride in <strong>{activeOrg?.org?.name}</strong>.
            </p>
            <Link to="/vehicles/post"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-accent text-white text-sm font-medium hover:bg-[#008fad]">
              <PlusCircle className="w-4 h-4" /> Post the first vehicle
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {latest.map((v) => <VehicleCard key={v._id} vehicle={v} />)}
          </div>
        )}
      </div>
    </div>
  );
}
