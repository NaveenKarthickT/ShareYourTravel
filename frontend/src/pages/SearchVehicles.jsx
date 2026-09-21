import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Flag, Calendar, Users, Search as SearchIcon, PlusCircle } from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import Sidebar from "../components/Sidebar.jsx";
import VehicleCard from "../components/VehicleCard.jsx";
import { SkeletonGrid } from "../components/Skeleton.jsx";
import FilterChips from "../components/FilterChips.jsx";
import CityInput from "../components/CityInput.jsx";

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
const EMPTY = { startLocation: "", destination: "", date: "", minSeats: "" };

export default function SearchVehicles() {
  const { activeOrg } = useAuth();
  const [filters, setFilters] = useState(EMPTY);
  const [applied, setApplied] = useState(EMPTY);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const search = async (f = filters) => {
    setLoading(true);
    try {
      const params = { organization: activeOrg.org._id };
      Object.entries(f).forEach(([k, v]) => {
        if (v) params[k] = v;
      });
      const { data } = await api.get("/vehicles", { params });
      setResults(data.data);
      setApplied(f);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    search();
    // eslint-disable-next-line
  }, []);

  const removeFilter = (key) => {
    const next = { ...applied, [key]: "" };
    setFilters(next);
    search(next);
  };

  const clearAll = () => {
    setFilters(EMPTY);
    search(EMPTY);
  };

  const typedSomething = Object.values(filters).some(Boolean);
  const hasAppliedFilters = Object.values(applied).some(Boolean);
  const filtersChanged = JSON.stringify(filters) !== JSON.stringify(applied);
  const canApply = (typedSomething && filtersChanged) || hasAppliedFilters;

  return (
    <div className="flex">
      <Sidebar links={links} />
      <div className="flex-1 px-6 py-8 max-w-6xl">
        <h1 className="text-2xl font-bold mb-1 text-primary dark:text-sky-300">
          Search vehicles
        </h1>
        <p className="text-slate-500 mb-6">
          Find a pooling trip in {activeOrg?.org?.name}.
        </p>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 mb-4 grid sm:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium mb-1 text-slate-600 dark:text-slate-400">
              From
            </label>
            <CityInput
              value={filters.startLocation}
              onChange={(v) => setFilters({ ...filters, startLocation: v })}
              onSelect={(v) => {
                const next = { ...filters, startLocation: v };
                setFilters(next);
                search(next);
              }}
              placeholder="Search city or area"
              icon={MapPin}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 text-slate-600 dark:text-slate-400">
              To
            </label>
            <CityInput
              value={filters.destination}
              onChange={(v) => setFilters({ ...filters, destination: v })}
              onSelect={(v) => {
                const next = { ...filters, destination: v };
                setFilters(next);
                search(next);
              }}
              placeholder="Search city or area"
              icon={Flag}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 text-slate-600 dark:text-slate-400">
              Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-900 rounded-full pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 text-slate-600 dark:text-slate-400">
              Min. seats
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="number"
                min={1}
                value={filters.minSeats}
                onChange={(e) => setFilters({ ...filters, minSeats: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && canApply && search()}
                className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-900 rounded-full pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>

          <button
            onClick={() => search()}
            disabled={!canApply}
            className="flex items-center justify-center gap-1.5 bg-accent text-white rounded-full py-2 text-sm font-semibold hover:bg-[#008fad] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SearchIcon className="w-4 h-4" /> Apply
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
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-accent-soft flex items-center justify-center mx-auto mb-4">
              <SearchIcon className="w-7 h-7 text-accent" />
            </div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
              {hasAppliedFilters ? "No matching trips" : "No trips posted yet"}
            </h3>
            <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
              {hasAppliedFilters
                ? "Try widening your search — different date, fewer seats, or a broader route."
                : "Start by posting the first trip for your community."}
            </p>
            {hasAppliedFilters ? (
              <button
                onClick={clearAll}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Clear filters
              </button>
            ) : (
              <Link
                to="/vehicles/post"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-accent text-white text-sm font-medium hover:bg-[#008fad]"
              >
                <PlusCircle className="w-4 h-4" /> Post a trip
              </Link>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {results.map((v) => (
              <VehicleCard key={v._id} vehicle={v} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}