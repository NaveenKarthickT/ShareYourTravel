import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Car, Bike, Truck, Sparkles, Hash, MapPin, Flag, Calendar, Clock,
  Users, IndianRupee, FileText, Send, Eye, ShieldCheck
} from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";
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

const VEHICLE_TYPES = [
  { id: "car", label: "Car", icon: Car },
  { id: "bike", label: "Bike", icon: Bike },
  { id: "van", label: "Van", icon: Truck },
  { id: "other", label: "Other", icon: Sparkles },
];

export default function PostVehicle() {
  const { user, activeOrg } = useAuth();
  const navigate = useNavigate();
  const showToast = useToast();
  const [form, setForm] = useState({
    vehicleType: "car",
    vehicleModel: "",
    vehicleNumber: "",
    startLocation: "",
    destination: "",
    travelDate: "",
    travelTime: "",
    totalSeats: 3,
    farePerSeat: 0,
    notes: "",
  });
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);

  const errors = {
    startLocation: touched.startLocation && !form.startLocation.trim(),
    destination: touched.destination && !form.destination.trim(),
    travelDate: touched.travelDate && !form.travelDate,
    travelTime: touched.travelTime && !form.travelTime,
    totalSeats: touched.totalSeats && (!form.totalSeats || form.totalSeats < 1),
  };

  const canSubmit =
    form.startLocation.trim() &&
    form.destination.trim() &&
    form.travelDate &&
    form.travelTime &&
    form.totalSeats >= 1 &&
    !loading;

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm({ ...form, [key]: e.target.value }),
    onBlur: () => setTouched((t) => ({ ...t, [key]: true })),
  });

  const inputClass = (key) =>
    `w-full bg-slate-50/80 dark:bg-slate-900 border rounded-xl pl-10 pr-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-slate-900 transition-all ${
      errors[key]
        ? "border-rose-400 focus:ring-rose-200 dark:border-rose-500/60 dark:focus:ring-rose-950"
        : "border-slate-200 dark:border-slate-700/80 focus:border-[#00A3C4] focus:ring-[#00A3C4]/20"
    }`;

  const submit = async (e) => {
    e.preventDefault();
    setTouched({
      startLocation: true,
      destination: true,
      travelDate: true,
      travelTime: true,
      totalSeats: true,
    });
    if (!canSubmit) return;
    try {
      setLoading(true);
      await api.post("/vehicles", { ...form, organization: activeOrg.org._id });
      showToast("Trip posted successfully!", "success");
      navigate("/vehicles/search");
    } catch (err) {
      showToast(err.response?.data?.message || "Could not post trip", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar links={links} />
      <div className="flex-1 px-4 sm:px-8 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-800 text-[11px] font-bold tracking-wide uppercase text-cyan-700 dark:text-cyan-400 mb-2">
            <Sparkles className="w-3 h-3" /> Community Carpooling
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Post a Vehicle for Pooling
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Share your upcoming ride with verified members in{" "}
            <strong className="text-slate-800 dark:text-slate-200">{activeOrg?.org?.name}</strong>.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Main Form */}
          <form
            onSubmit={submit}
            className="lg:col-span-7 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-sm space-y-6"
            noValidate
          >
            {/* 1. Vehicle Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                1. Select Vehicle Type
              </label>
              <div className="grid grid-cols-4 gap-2">
                {VEHICLE_TYPES.map((vt) => {
                  const Icon = vt.icon;
                  const isSelected = form.vehicleType === vt.id;
                  return (
                    <button
                      key={vt.id}
                      type="button"
                      onClick={() => setForm({ ...form, vehicleType: vt.id })}
                      className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition-all ${
                        isSelected
                          ? "bg-gradient-to-r from-[#00A3C4] to-[#0284C7] text-white border-transparent shadow-md shadow-[#00A3C4]/20 scale-[1.02]"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{vt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Vehicle Model & Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Vehicle Model
                </label>
                <div className="relative">
                  <Car className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    {...field("vehicleModel")}
                    className={inputClass("vehicleModel")}
                    placeholder="e.g. Honda City, Activa"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Vehicle Plate / Reg No.
                </label>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    {...field("vehicleNumber")}
                    onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value.toUpperCase() })}
                    className={inputClass("vehicleNumber")}
                    placeholder="e.g. TN 59 AB 1234"
                  />
                </div>
              </div>
            </div>

            {/* 2. Route */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                2. Route Locations
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Start Location *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none" />
                    <input
                      {...field("startLocation")}
                      className={inputClass("startLocation")}
                      placeholder="e.g. Koramangala / Gate 1"
                    />
                  </div>
                  {errors.startLocation && (
                    <p className="text-xs text-rose-500 font-medium mt-1">Start location is required</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Destination *
                  </label>
                  <div className="relative">
                    <Flag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500 pointer-events-none" />
                    <input
                      {...field("destination")}
                      className={inputClass("destination")}
                      placeholder="e.g. Whitefield Tech Park"
                    />
                  </div>
                  {errors.destination && (
                    <p className="text-xs text-rose-500 font-medium mt-1">Destination is required</p>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Schedule */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                3. Departure Schedule
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Travel Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="date"
                      {...field("travelDate")}
                      className={inputClass("travelDate")}
                    />
                  </div>
                  {errors.travelDate && (
                    <p className="text-xs text-rose-500 font-medium mt-1">Travel date is required</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Departure Time *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="time"
                      {...field("travelTime")}
                      className={inputClass("travelTime")}
                    />
                  </div>
                  {errors.travelTime && (
                    <p className="text-xs text-rose-500 font-medium mt-1">Departure time is required</p>
                  )}
                </div>
              </div>
            </div>

            {/* 4. Seats & Pricing */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                4. Capacity & Pricing
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Available Seats
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="number"
                      min={1}
                      max={12}
                      {...field("totalSeats")}
                      onChange={(e) => setForm({ ...form, totalSeats: Number(e.target.value) })}
                      className={inputClass("totalSeats")}
                    />
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    {[1, 2, 3, 4, 6].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setForm({ ...form, totalSeats: num })}
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border transition ${
                          form.totalSeats === num
                            ? "bg-[#00A3C4] text-white border-[#00A3C4]"
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Fare per Seat (₹)
                    </label>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, farePerSeat: 0 })}
                      className={`text-[11px] font-bold px-1.5 py-0.5 rounded transition ${
                        form.farePerSeat === 0
                          ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60"
                          : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      }`}
                    >
                      {form.farePerSeat === 0 ? "✓ Free Ride" : "Set Free"}
                    </button>
                  </div>
                  <div className="relative">
                    <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="number"
                      min={0}
                      step={10}
                      {...field("farePerSeat")}
                      onChange={(e) => setForm({ ...form, farePerSeat: Number(e.target.value) })}
                      className={inputClass("farePerSeat")}
                      placeholder="0 for free"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Notes */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Notes for Passengers (Optional)
              </label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                <textarea
                  {...field("notes")}
                  className={`${inputClass("notes")} pl-10 resize-none`}
                  rows={2}
                  placeholder="e.g. AC on, non-smoking, boot space available for 1 small bag"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#00A3C4] to-[#0284C7] text-white rounded-xl py-3 font-bold text-sm shadow-md shadow-[#00A3C4]/25 hover:shadow-lg hover:shadow-[#00A3C4]/35 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200"
            >
              <Send className="w-4 h-4" />
              {loading ? "Publishing Trip..." : "Publish This Trip"}
            </button>
          </form>

          {/* Real-Time Live Preview Card */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Eye className="w-4 h-4 text-[#00A3C4]" /> Passenger Card Preview
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/15 to-blue-500/15 text-[#00A3C4] dark:text-cyan-400 flex items-center justify-center font-bold">
                    {form.vehicleType === "bike" ? "🏍️" : form.vehicleType === "van" ? "🚐" : "🚗"}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                      {form.vehicleModel.trim() || `${form.vehicleType} pool`}
                    </h3>
                    <div className="text-[11px] text-slate-400">
                      {form.vehicleNumber || "Plate not set"}
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Available
                </span>
              </div>

              {/* Route line */}
              <div className="space-y-2 py-1">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                    {form.startLocation.trim() || "Pickup Location"}
                  </span>
                </div>
                <div className="ml-1 border-l-2 border-dashed border-slate-200 dark:border-slate-800 h-4" />
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-500/20 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                    {form.destination.trim() || "Destination"}
                  </span>
                </div>
              </div>

              {/* Stats badges */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-center text-xs">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">Departure</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {form.travelTime || "--:--"}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">Seats Left</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {form.totalSeats || 1}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">Fare</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {form.farePerSeat > 0 ? `₹${form.farePerSeat}` : "Free"}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                <span>Driver: {user?.name || "You"}</span>
                <span className="text-cyan-600 dark:text-cyan-400 font-medium">Verified Member</span>
              </div>
            </div>

            {/* Community Safety Trust Banner */}
            <div className="bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20 rounded-2xl p-4 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#00A3C4] shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mb-0.5">
                  Private Community Pool
                </div>
                <div>
                  Only members of <strong>{activeOrg?.org?.name}</strong> can view and request seats on this vehicle.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}