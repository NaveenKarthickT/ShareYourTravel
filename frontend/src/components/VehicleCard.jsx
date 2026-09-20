import { Link } from "react-router-dom";
import { Hash, Users, Tag, Info, Send, MapPin, Flag } from "lucide-react";

const TYPE_ICON = {
  car: (
    <svg viewBox="0 0 64 40" className="w-12 h-8 text-slate-500 dark:text-slate-400" fill="currentColor">
      <path d="M10 28h44l-3-12a5 5 0 0 0-5-4H18a5 5 0 0 0-5 4l-3 12z" opacity="0.85"/>
      <rect x="14" y="16" width="10" height="6" rx="1" fill="#fff" opacity="0.7"/>
      <rect x="26" y="16" width="10" height="6" rx="1" fill="#fff" opacity="0.7"/>
      <rect x="38" y="16" width="10" height="6" rx="1" fill="#fff" opacity="0.7"/>
      <circle cx="18" cy="30" r="5" fill="#334155"/>
      <circle cx="46" cy="30" r="5" fill="#334155"/>
    </svg>
  ),
  bike: (
    <svg viewBox="0 0 64 40" className="w-12 h-8 text-slate-500 dark:text-slate-400" fill="currentColor">
      <circle cx="16" cy="28" r="7" fill="none" stroke="currentColor" strokeWidth="2.5"/>
      <circle cx="48" cy="28" r="7" fill="none" stroke="currentColor" strokeWidth="2.5"/>
      <path d="M16 28 L28 14 L44 20 M28 14 L48 28" stroke="currentColor" strokeWidth="2.5" fill="none"/>
    </svg>
  ),
  van: (
    <svg viewBox="0 0 64 40" className="w-12 h-8 text-slate-500 dark:text-slate-400" fill="currentColor">
      <rect x="6" y="12" width="52" height="18" rx="3" opacity="0.85"/>
      <rect x="12" y="16" width="10" height="6" rx="1" fill="#fff" opacity="0.7"/>
      <rect x="26" y="16" width="10" height="6" rx="1" fill="#fff" opacity="0.7"/>
      <circle cx="18" cy="32" r="5" fill="#334155"/>
      <circle cx="46" cy="32" r="5" fill="#334155"/>
    </svg>
  ),
  other: (
    <svg viewBox="0 0 64 40" className="w-12 h-8 text-slate-500 dark:text-slate-400" fill="currentColor">
      <path d="M10 28h44l-3-12a5 5 0 0 0-5-4H18a5 5 0 0 0-5 4l-3 12z" opacity="0.85"/>
      <circle cx="18" cy="30" r="5" fill="#334155"/>
      <circle cx="46" cy="30" r="5" fill="#334155"/>
    </svg>
  ),
};

const STATUS_BADGE = {
  available: "bg-cyan-600 text-white",
  full: "bg-slate-500 text-white",
  ongoing: "bg-amber-600 text-white",
  completed: "bg-slate-500 text-white",
  cancelled: "bg-rose-500 text-white",
};

export default function VehicleCard({ vehicle }) {
  const Icon = TYPE_ICON[vehicle.vehicleType] || TYPE_ICON.other;
  const isFree = !vehicle.farePerSeat || vehicle.farePerSeat === 0;
  const canRequest = vehicle.status === "available";
  const badgeColor = STATUS_BADGE[vehicle.status] || "bg-slate-500 text-white";
  const seatsLeft = vehicle.availableSeats;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col group">

      {/* Slim icon header */}
      <div className="relative h-16 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-850 flex items-center justify-center border-b border-slate-200 dark:border-slate-800">
        {Icon}
        <span className={`absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide shadow-sm ${badgeColor}`}>
          {vehicle.status}
        </span>
        {seatsLeft > 0 && seatsLeft <= 1 && vehicle.status === "available" && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-amber-500 text-white shadow-sm animate-pulse">
            🔥 Last Seat
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-3.5 flex flex-col gap-2.5 flex-1">

        {/* Name + type */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
            {vehicle.vehicleModel || vehicle.vehicleType}
          </h3>
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full capitalize shrink-0">
            {vehicle.vehicleType}
          </span>
        </div>

        {/* Route visual curve */}
        <div className="relative h-6">
          <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="w-full h-full">
            <defs>
              <linearGradient id={`route-${vehicle._id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#f43f5e" />
              </linearGradient>
            </defs>
            <path
              d="M 8,18 Q 50,2 92,8"
              fill="none"
              stroke={`url(#route-${vehicle._id})`}
              strokeWidth="1.8"
              strokeDasharray="2.5 3"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute left-0 bottom-0 w-3.5 h-3.5 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center shadow ring-2 ring-white dark:ring-slate-900">
            <MapPin className="w-2 h-2 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="absolute right-0 top-0 w-3.5 h-3.5 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center shadow ring-2 ring-white dark:ring-slate-900">
            <Flag className="w-2 h-2 text-rose-600 dark:text-rose-400" />
          </div>
        </div>

        {/* Route labels */}
        <div className="flex items-center justify-between gap-1.5 text-xs">
          <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-lg px-2 py-1 min-w-0 flex-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 truncate">
              {vehicle.startLocation}
            </span>
          </div>
          <span className="text-slate-300 dark:text-slate-600 text-xs shrink-0">→</span>
          <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-lg px-2 py-1 min-w-0 flex-1 justify-end">
            <span className="text-[11px] font-semibold text-rose-800 dark:text-rose-300 truncate">
              {vehicle.destination}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
          </div>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-100 dark:border-slate-800">
          <span className="flex items-center gap-1">
            <Hash className="w-3 h-3 text-[#00A3C4]" />
            {vehicle.vehicleNumber || "—"}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3 text-[#00A3C4]" />
            {seatsLeft}/{vehicle.totalSeats} seats
          </span>
          <span className="flex items-center gap-1 ml-auto font-bold text-emerald-600 dark:text-emerald-400">
            <Tag className="w-3 h-3 text-emerald-500" />
            {isFree ? "Free" : `₹${vehicle.farePerSeat}`}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-1">
          <Link
            to={`/vehicles/${vehicle._id}`}
            className="flex-1 flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition"
          >
            <Info className="w-3 h-3" />
            Details
          </Link>
          {canRequest ? (
            <Link
              to={`/vehicles/${vehicle._id}#request`}
              className="flex-1 flex items-center justify-center gap-1 bg-gradient-to-r from-[#00A3C4] to-[#0284C7] text-white rounded-xl py-1.5 text-[11px] font-semibold shadow-sm hover:shadow transition"
            >
              <Send className="w-3 h-3" />
              Request
            </Link>
          ) : (
            <Link
              to={`/vehicles/${vehicle._id}`}
              className="flex-1 flex items-center justify-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl py-1.5 text-[11px] font-semibold transition"
            >
              View
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}