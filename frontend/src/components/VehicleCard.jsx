import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge.jsx";

export default function VehicleCard({ vehicle, actionLabel = "View details" }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
          {vehicle.vehicleType}
        </span>
        <StatusBadge status={vehicle.status} />
      </div>
      <div className="font-semibold text-slate-800">
        {vehicle.startLocation} <span className="text-slate-400">→</span> {vehicle.destination}
      </div>
      <div className="text-sm text-slate-500 mt-1">
        {new Date(vehicle.travelDate).toLocaleDateString()} · {vehicle.travelTime}
      </div>
      <div className="flex items-center justify-between mt-3 text-sm">
        <span className="text-slate-600">
          Seats: <span className="font-medium">{vehicle.availableSeats}</span>/{vehicle.totalSeats}
        </span>
        {vehicle.farePerSeat > 0 && (
          <span className="font-medium text-brand-700">₹{vehicle.farePerSeat}/seat</span>
        )}
      </div>
      {vehicle.postedBy?.name && (
        <div className="text-xs text-slate-400 mt-2">Posted by {vehicle.postedBy.name}</div>
      )}
      <Link
        to={`/vehicles/${vehicle._id}`}
        className="mt-3 inline-block w-full text-center px-3 py-2 rounded-md bg-brand-600 text-white text-sm font-medium hover:bg-brand-700"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
