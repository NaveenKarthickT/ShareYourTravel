import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Car, Hash, MapPin, Flag, Calendar, Clock, Users,
  IndianRupee, FileText, Send,
} from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";
import Sidebar from "../components/Sidebar.jsx";
import CityInput from "../components/CityInput.jsx";
import PageHeader from "../components/PageHeader.jsx";

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
    "w-full border rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 transition " +
    (errors[key]
      ? "border-rose-400 focus:ring-rose-200"
      : "border-slate-300 dark:border-slate-600 dark:bg-slate-900 focus:ring-accent");

  const submit = async (e) => {
    e.preventDefault();
    setTouched({
      startLocation: true,
      destination: true,
      travelDate: true,
      travelTime: true,
      totalSeats: true,
    });

    if (!activeOrg?.org?._id) {
      showToast("Please pick a community first", "error");
      return;
    }
    if (!canSubmit) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    try {
      setLoading(true);
      await api.post("/vehicles", { ...form, organization: activeOrg.org._id });
      showToast("Trip posted successfully");
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
      <div className="flex-1 px-6 py-8 max-w-2xl">
        <PageHeader
          icon={Car}
          eyebrow="New trip"
          title="Post a vehicle for pooling"
          subtitle={
            "Share your trip so others in " +
            (activeOrg?.org?.name || "your community") +
            " can join."
          }
        />

        <form
          onSubmit={submit}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-4"
          noValidate
        >
          {/* Vehicle type + model */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                Vehicle type
              </label>
              <div className="relative">
                <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select {...field("vehicleType")} className={inputClass("vehicleType")}>
                  <option value="car">Car</option>
                  <option value="bike">Bike</option>
                  <option value="van">Van</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                Vehicle model
              </label>
              <div className="relative">
                <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  {...field("vehicleModel")}
                  className={inputClass("vehicleModel")}
                  placeholder="e.g. Honda City"
                />
              </div>
            </div>
          </div>

          {/* Vehicle number */}
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
              Vehicle number
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                {...field("vehicleNumber")}
                onChange={(e) =>
                  setForm({ ...form, vehicleNumber: e.target.value.toUpperCase() })
                }
                className={inputClass("vehicleNumber")}
                placeholder="e.g. TN 59 AB 1234"
              />
            </div>
          </div>

          {/* From / To */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                From *
              </label>
              <CityInput
                value={form.startLocation}
                onChange={(v) => {
                  setForm({ ...form, startLocation: v });
                  setTouched((t) => ({ ...t, startLocation: true }));
                }}
                onSelect={(v) =>
                  setForm({ ...form, startLocation: v })
                }
                placeholder="Search city or area"
                icon={MapPin}
              />
              {errors.startLocation && (
                <p className="text-xs text-rose-600 mt-1">Required</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                To *
              </label>
              <CityInput
                value={form.destination}
                onChange={(v) => {
                  setForm({ ...form, destination: v });
                  setTouched((t) => ({ ...t, destination: true }));
                }}
                onSelect={(v) =>
                  setForm({ ...form, destination: v })
                }
                placeholder="Search city or area"
                icon={Flag}
              />
              {errors.destination && (
                <p className="text-xs text-rose-600 mt-1">Required</p>
              )}
            </div>
          </div>

          {/* Date / Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  {...field("travelDate")}
                  className={inputClass("travelDate")}
                />
              </div>
              {errors.travelDate && (
                <p className="text-xs text-rose-600 mt-1">Required</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                Time *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="time"
                  {...field("travelTime")}
                  className={inputClass("travelTime")}
                />
              </div>
              {errors.travelTime && (
                <p className="text-xs text-rose-600 mt-1">Required</p>
              )}
            </div>
          </div>

          {/* Seats / Fare */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                Available seats
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  min={1}
                  {...field("totalSeats")}
                  onChange={(e) =>
                    setForm({ ...form, totalSeats: Number(e.target.value) })
                  }
                  className={inputClass("totalSeats")}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                Fare per seat (₹)
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  min={0}
                  {...field("farePerSeat")}
                  onChange={(e) =>
                    setForm({ ...form, farePerSeat: Number(e.target.value) })
                  }
                  className={inputClass("farePerSeat")}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
              Notes (optional)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <textarea
                {...field("notes")}
                className={inputClass("notes")}
                rows={2}
              />
            </div>
          </div>

          <button
            disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-2 bg-accent text-white rounded-md py-2.5 font-semibold hover:bg-[#008fad] disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            <Send className="w-4 h-4" />
            {loading ? "Posting..." : "Post this trip"}
          </button>
        </form>
      </div>
    </div>
  );
}
