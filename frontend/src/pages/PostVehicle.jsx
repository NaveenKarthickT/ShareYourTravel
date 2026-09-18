import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Car, Hash, MapPin, Flag, Calendar, Clock, Users, IndianRupee, FileText, Send } from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import Sidebar from "../components/Sidebar.jsx";

const links = [
  { to: "/dashboard", label: "Overview" },
  { to: "/vehicles/search", label: "Search Vehicles" },
  { to: "/vehicles/post", label: "Post a Vehicle", end: true },
  { to: "/trips/confirmed", label: "Confirmed Trips" },
  { to: "/trips/ongoing", label: "Ongoing Trip" },
  { to: "/trips/requests", label: "My Requests" },
  { to: "/trips/completed", label: "Completed Trips" },
];

export default function PostVehicle() {
  const { activeOrg } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    vehicleType: "car", vehicleModel: "", vehicleNumber: "",
    startLocation: "", destination: "", travelDate: "", travelTime: "",
    totalSeats: 3, farePerSeat: 0, notes: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.startLocation || !form.destination || !form.travelDate || !form.travelTime) {
      return setError("Please fill in route, date and time.");
    }
    try {
      setLoading(true);
      await api.post("/vehicles", { ...form, organization: activeOrg.org._id });
      setSuccess("Trip posted! It is now visible to other members of your community.");
      setTimeout(() => navigate("/vehicles/search"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Could not post trip.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar links={links} />
      <div className="flex-1 px-6 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-1">Post a vehicle for pooling</h1>
        <p className="text-slate-500 mb-6">Share your trip so others in {activeOrg?.org?.name} can join.</p>

        <form onSubmit={submit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          {error && <div className="bg-rose-50 text-rose-700 text-sm px-3 py-2 rounded-md">{error}</div>}
          {success && <div className="bg-emerald-50 text-emerald-700 text-sm px-3 py-2 rounded-md">{success}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Vehicle type</label>
              <div className="relative">
                <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
                  className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2">
                  <option value="car">Car</option><option value="bike">Bike</option>
                  <option value="van">Van</option><option value="other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Vehicle model</label>
              <div className="relative">
                <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={form.vehicleModel} onChange={(e) => setForm({ ...form, vehicleModel: e.target.value })}
                  className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2" placeholder="e.g. Honda City" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Vehicle number</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value.toUpperCase() })}
                className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2" placeholder="e.g. TN 59 AB 1234" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Starting location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={form.startLocation} onChange={(e) => setForm({ ...form, startLocation: e.target.value })}
                  className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Destination</label>
              <div className="relative">
                <Flag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })}
                  className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Travel date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input type="date" value={form.travelDate} onChange={(e) => setForm({ ...form, travelDate: e.target.value })}
                  className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Travel time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input type="time" value={form.travelTime} onChange={(e) => setForm({ ...form, travelTime: e.target.value })}
                  className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Available seats</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="number" min={1} value={form.totalSeats}
                  onChange={(e) => setForm({ ...form, totalSeats: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fare per seat (₹, optional)</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="number" min={0} value={form.farePerSeat}
                  onChange={(e) => setForm({ ...form, farePerSeat: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes (optional)</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2" rows={2} />
            </div>
          </div>

          <button disabled={loading} className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white rounded-md py-2.5 font-medium hover:bg-brand-700 disabled:opacity-60">
            <Send className="w-4 h-4" />
            {loading ? "Posting..." : "Post this trip"}
          </button>
        </form>
      </div>
    </div>
  );
}
