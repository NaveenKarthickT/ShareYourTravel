import { useEffect, useState } from "react";
import { MapPin, Flag, Calendar, Users, Search as SearchIcon } from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import Sidebar from "../components/Sidebar.jsx";
import VehicleCard from "../components/VehicleCard.jsx";

const links = [
  { to: "/dashboard", label: "Overview" },
  { to: "/vehicles/search", label: "Search Vehicles", end: true },
  { to: "/vehicles/post", label: "Post a Vehicle" },
  { to: "/trips/confirmed", label: "Confirmed Trips" },
  { to: "/trips/ongoing", label: "Ongoing Trip" },
  { to: "/trips/requests", label: "My Requests" },
  { to: "/trips/completed", label: "Completed Trips" },
];

export default function SearchVehicles() {
  const { activeOrg } = useAuth();
  const [filters, setFilters] = useState({ startLocation: "", destination: "", date: "", minSeats: "" });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const search = async () => {
    setLoading(true);
    try {
      const params = { organization: activeOrg.org._id };
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const { data } = await api.get("/vehicles", { params });
      setResults(data.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { search(); /* eslint-disable-next-line */ }, []);

  return (
    <div className="flex">
      <Sidebar links={links} />
      <div className="flex-1 px-6 py-8 max-w-6xl">
        <h1 className="text-2xl font-bold mb-1 text-primary">Search vehicles</h1>
        <p className="text-slate-500 mb-6">Find a pooling trip in {activeOrg?.org?.name}.</p>

        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 grid sm:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium mb-1 text-slate-600">From</label>
            <div className="relative">
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={filters.startLocation} onChange={(e) => setFilters({ ...filters, startLocation: e.target.value })}
                className="w-full border border-slate-300 rounded-md pl-8 pr-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-slate-600">To</label>
            <div className="relative">
              <Flag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={filters.destination} onChange={(e) => setFilters({ ...filters, destination: e.target.value })}
                className="w-full border border-slate-300 rounded-md pl-8 pr-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-slate-600">Date</label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                className="w-full border border-slate-300 rounded-md pl-8 pr-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-slate-600">Min. seats</label>
            <div className="relative">
              <Users className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input type="number" min={1} value={filters.minSeats}
                onChange={(e) => setFilters({ ...filters, minSeats: e.target.value })}
                className="w-full border border-slate-300 rounded-md pl-8 pr-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
          </div>
          <button onClick={search}
            className="flex items-center justify-center gap-1.5 bg-accent text-white rounded-md py-2 text-sm font-medium hover:bg-[#008fad]">
            <SearchIcon className="w-3.5 h-3.5" />
            Apply filters
          </button>
        </div>

        {loading ? (
          <div className="text-slate-500">Loading...</div>
        ) : results.length === 0 ? (
          <div className="text-slate-500 bg-white border border-dashed border-slate-300 rounded-lg p-8 text-center">
            No trips match your filters.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((v) => <VehicleCard key={v._id} vehicle={v} actionLabel="Request / View details" />)}
          </div>
        )}
      </div>
    </div>
  );
}
