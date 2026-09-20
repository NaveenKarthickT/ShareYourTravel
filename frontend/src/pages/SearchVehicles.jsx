import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search as SearchIcon, MapPin, Flag, Calendar, Users, PlusCircle, Sparkles } from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import Sidebar from "../components/Sidebar.jsx";
import VehicleCard from "../components/VehicleCard.jsx";
import FilterChips from "../components/FilterChips.jsx";
import { SkeletonGrid } from "../components/Skeleton.jsx";

const links = [
  { to: "/dashboard", label: "Overview" },
  { to: "/vehicles/search", label: "Search Vehicles", end: true },
  { to: "/vehicles/post", label: "Post a Vehicle" },
  { to: "/trips/confirmed", label: "Confirmed Trips" },
  { to: "/trips/ongoing", label: "Ongoing Trip" },
  { to: "/trips/requests", label: "My Requests" },
  { to: "/trips/completed", label: "Completed Trips" },
];

const FILTER_LABELS = {
  startLocation: "From",
  destination: "To",
  date: "Date",
  minSeats: "Min seats",
};

export default function SearchVehicles() {
  const { activeOrg } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form inputs (typed by user)
  const [filters, setFilters] = useState({
    startLocation: "",
    destination: "",
    date: "",
    minSeats: "",
  });

  // Actually applied filters sent to the server
  const [applied, setApplied] = useState({
    startLocation: "",
    destination: "",
    date: "",
    minSeats: "",
  });

  const search = async (override) => {
    setLoading(true);
    const active = override || filters;
    const params = { organization: activeOrg.org._id };
    if (active.startLocation) params.startLocation = active.startLocation;
    if (active.destination) params.destination = active.destination;
    if (active.date) params.date = active.date;
    if (active.minSeats) params.minSeats = active.minSeats;

    const { data } = await api.get("/vehicles", { params });
    setResults(data.data);
    setApplied(active);
    setLoading(false);
  };

  useEffect(() => {
    if (activeOrg?.org?._id) search();
    // eslint-disable-next-line
  }, [activeOrg]);

  const removeFilter = (key) => {
    const next = { ...applied, [key]: "" };
    setFilters(next);
    search(next);
  };

  const clearAll = () => {
    const empty = { startLocation: "", destination: "", date: "", minSeats: "" };
    setFilters(empty);
    search(empty);
  };

  const hasAppliedFilters = Object.values(applied).some(Boolean);
  const filtersChanged = Object.keys(filters).some((k) => filters[k] !== applied[k]);
  const typedSomething = Object.values(filters).some(Boolean);
  const canApply = (typedSomething && filtersChanged) || hasAppliedFilters;

  return (
    <div className="flex">
      <Sidebar links={links} />
      <div className="flex-1 px-4 sm:px-8 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-800 text-[11px] font-bold tracking-wide uppercase text-cyan-700 dark:text-cyan-400 mb-2">
            <Sparkles className="w-3 h-3" /> Ride Finder
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Search Available Rides
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Browse and filter verified pooling trips in{" "}
            <strong className="text-slate-800 dark:text-slate-200">{activeOrg?.org?.name}</strong>.
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 mb-5 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-end">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              From
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none" />
              <input
                value={filters.startLocation}
                onChange={(e) => setFilters({ ...filters, startLocation: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && canApply && search()}
                placeholder="Pickup area"
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-10 pr-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#00A3C4] focus:ring-2 focus:ring-[#00A3C4]/20 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              To
            </label>
            <div className="relative">
              <Flag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500 pointer-events-none" />
              <input
                value={filters.destination}
                onChange={(e) => setFilters({ ...filters, destination: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && canApply && search()}
                placeholder="Destination"
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-10 pr-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#00A3C4] focus:ring-2 focus:ring-[#00A3C4]/20 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-10 pr-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#00A3C4] focus:ring-2 focus:ring-[#00A3C4]/20 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Min Seats
            </label>
            <div className="relative">
              <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="number"
                min={1}
                max={10}
                value={filters.minSeats}
                onChange={(e) => setFilters({ ...filters, minSeats: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && canApply && search()}
                placeholder="1+"
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-10 pr-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#00A3C4] focus:ring-2 focus:ring-[#00A3C4]/20 transition"
              />
            </div>
          </div>

          <button
            onClick={() => search()}
            disabled={!canApply}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#00A3C4] to-[#0284C7] text-white rounded-xl py-2.5 text-sm font-bold shadow-md shadow-[#00A3C4]/20 hover:shadow-lg hover:shadow-[#00A3C4]/30 disabled:opacity-50 disabled:pointer-events-none transition-all"
          >
            <SearchIcon className="w-4 h-4" />
            Apply Filters
          </button>
        </div>

        <FilterChips
          filters={applied}
          labels={FILTER_LABELS}
          onRemove={removeFilter}
          onClearAll={clearAll}
        />

        {loading ? (
          <SkeletonGrid count={6} />
        ) : results.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 text-[#00A3C4] flex items-center justify-center mx-auto mb-4 border border-cyan-500/20">
              <SearchIcon className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5">
              {hasAppliedFilters ? "No matching trips found" : "No trips posted yet"}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-md mx-auto">
              {hasAppliedFilters
                ? "Try adjusting your dates or expanding your route to find nearby rides."
                : "Be the first to offer a seat in your community!"}
            </p>
            {hasAppliedFilters ? (
              <button
                onClick={clearAll}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Reset Search Filters
              </button>
            ) : (
              <Link
                to="/vehicles/post"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00A3C4] to-[#0284C7] text-white text-sm font-bold shadow-md shadow-[#00A3C4]/25 hover:shadow-lg transition"
              >
                <PlusCircle className="w-4 h-4" /> Post the First Trip
              </Link>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Found {results.length} Available {results.length === 1 ? "Trip" : "Trips"}
              </span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {results.map((v) => (
                <VehicleCard key={v._id} vehicle={v} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}