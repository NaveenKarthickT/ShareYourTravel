import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Car, PlusCircle, Search, CheckCircle2, Clock, CalendarCheck,
  Sparkles, ArrowRight, ShieldCheck
} from "lucide-react";
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
  const { user, activeOrg } = useAuth();
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
      <div className="flex-1 px-4 sm:px-8 py-8 max-w-6xl">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 rounded-3xl p-6 sm:p-8 text-white mb-8 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-cyan-300 text-xs font-semibold mb-3 border border-white/10">
                <Sparkles className="w-3.5 h-3.5" /> Community Carpool Hub
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome back, {user?.name?.split(" ")[0]}! 👋
              </h1>
              <p className="text-slate-300 text-sm mt-1 max-w-xl">
                Ready to travel together? Share or find verified rides in{" "}
                <strong className="text-white">{activeOrg?.org?.name}</strong>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/vehicles/post"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00A3C4] to-[#0284C7] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#00A3C4]/30 hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <PlusCircle className="w-4 h-4" /> Offer a Ride
              </Link>
              <Link
                to="/vehicles/search"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs sm:text-sm font-bold transition-all"
              >
                <Search className="w-4 h-4" /> Find a Ride
              </Link>
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        {loading ? (
          <SkeletonStatRow count={3} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Link
              to="/trips/confirmed"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-cyan-500/50 hover:shadow-md hover:-translate-y-0.5 transition-all group flex items-center justify-between"
            >
              <div>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  {counts.confirmed}
                </div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Confirmed Trips
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </Link>

            <Link
              to="/trips/requests"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-amber-500/50 hover:shadow-md hover:-translate-y-0.5 transition-all group flex items-center justify-between"
            >
              <div>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                  {counts.requested}
                </div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Pending Seat Requests
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </Link>

            <Link
              to="/trips/completed"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-indigo-500/50 hover:shadow-md hover:-translate-y-0.5 transition-all group flex items-center justify-between"
            >
              <div>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors">
                  {counts.completed}
                </div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Completed Trips
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <CalendarCheck className="w-6 h-6" />
              </div>
            </Link>
          </div>
        )}

        {/* Latest Posted Vehicles Section */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-lg text-slate-900 dark:text-white">
              Recently Posted Community Rides
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Latest departures shared by members in your group
            </p>
          </div>
          <Link
            to="/vehicles/search"
            className="text-xs font-bold text-[#00A3C4] hover:text-[#0284C7] dark:text-cyan-400 flex items-center gap-1 transition"
          >
            Explore all rides <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <SkeletonGrid count={3} />
        ) : latest.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 text-[#00A3C4] flex items-center justify-center mx-auto mb-4 border border-cyan-500/20">
              <Car className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">
              No rides posted yet today
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-sm mx-auto">
              Be the first to offer a seat and help reduce traffic in <strong>{activeOrg?.org?.name}</strong>.
            </p>
            <Link
              to="/vehicles/post"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00A3C4] to-[#0284C7] text-white text-sm font-bold shadow-md shadow-[#00A3C4]/25 hover:shadow-lg transition"
            >
              <PlusCircle className="w-4 h-4" /> Post the First Vehicle
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {latest.map((v) => (
              <VehicleCard key={v._id} vehicle={v} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}