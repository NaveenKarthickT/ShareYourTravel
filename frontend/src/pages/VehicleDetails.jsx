import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { MessageCircle, Calendar, Users, IndianRupee, User } from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotifications } from "../context/NotificationsContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import { useToast } from "../components/Toast.jsx";
import RouteMap from "../components/RouteMap.jsx";

export default function VehicleDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasUnreadChat } = useNotifications() || {};
  const showToast = useToast();
  const [vehicle, setVehicle] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [seats, setSeats] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState(null);

  const isOwner = vehicle && String(vehicle.postedBy?._id) === String(user?.id);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get(`/vehicles/${id}`);
    setVehicle(data.data);
    if (String(data.data.postedBy?._id) === String(user?.id)) {
      const b = await api.get(`/bookings/for-vehicle/${id}`);
      setBookings(b.data.data);
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  useEffect(() => {
    if (!loading && location.hash === "#request") {
      document.getElementById("request")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [loading, location.hash]);

  const requestSeat = async () => {
    try {
      await api.post("/bookings", { vehicleId: id, seatsRequested: seats });
      showToast(`Request sent for ${seats} seat${seats > 1 ? "s" : ""}`);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Could not send request", "error");
    }
  };

  const respond = async (bookingId, status) => {
    try {
      await api.patch(`/bookings/${bookingId}`, { status });
      showToast(status === "confirmed" ? "Request confirmed" : "Request rejected", status === "confirmed" ? "success" : "error");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Could not update request", "error");
    }
  };

  const updateVehicleStatus = async (status) => {
    try {
      await api.patch(`/vehicles/${id}`, { status });
      showToast(status === "ongoing" ? "Trip started" : "Trip marked completed");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Could not update trip", "error");
    }
  };

  if (loading || !vehicle) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 animate-pulse space-y-4">
          <div className="h-6 w-2/3 bg-slate-200 rounded" />
          <div className="grid sm:grid-cols-2 gap-4">
            {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-4 bg-slate-100 rounded" />)}
          </div>
          <div className="h-10 w-40 bg-slate-200 rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <button onClick={() => navigate(-1)} className="text-sm text-slate-500 mb-4 hover:text-slate-700">← Back</button>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-primary dark:text-sky-300">
            {vehicle.startLocation} <span className="text-slate-400">→</span> {vehicle.destination}
          </h1>
          <StatusBadge status={vehicle.status} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4 text-sm text-slate-700 dark:text-slate-300 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Vehicle:</span>
            <span>{vehicle.vehicleType} {vehicle.vehicleModel && `· ${vehicle.vehicleModel}`}{vehicle.vehicleNumber && ` · ${vehicle.vehicleNumber}`}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{new Date(vehicle.travelDate).toLocaleDateString()} · {vehicle.travelTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>{vehicle.availableSeats}/{vehicle.totalSeats} available</span>
          </div>
          <div className="flex items-center gap-2">
            <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
            <span>{vehicle.farePerSeat > 0 ? `₹${vehicle.farePerSeat}/seat` : "Free"}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>{vehicle.postedBy?.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Contact:</span>
            <span>{vehicle.postedBy?.phone || vehicle.postedBy?.email}</span>
          </div>
        </div>

        {vehicle.notes && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 bg-slate-50 dark:bg-slate-800 rounded-md p-3">{vehicle.notes}</p>
        )}

        <div className="mb-6">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Route map</h2>
          <RouteMap startLocation={vehicle.startLocation} destination={vehicle.destination} height={280} />
        </div>

        {!isOwner && vehicle.status === "available" && (
          <div id="request" className="flex items-end gap-3 scroll-mt-24 p-4 bg-accent-soft/50 dark:bg-slate-800 rounded-xl border border-accent/20">
            <div>
              <label className="block text-xs font-medium mb-1 text-slate-600 dark:text-slate-400">Seats to request</label>
              <input type="number" min={1} max={vehicle.availableSeats} value={seats}
                onChange={(e) => setSeats(Number(e.target.value))}
                className="border border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-md px-3 py-2 w-24 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
            <button onClick={requestSeat}
              className="px-5 py-2.5 rounded-md bg-accent text-white font-semibold hover:bg-[#008fad] transition">Request seat</button>
          </div>
        )}

        {!isOwner && vehicle.status === "ongoing" && (
          <div className="bg-accent-soft text-primary text-sm px-4 py-3 rounded-lg">
            🚗 Trip in progress — check <strong>Ongoing Trip</strong> in the sidebar to chat with the driver.
          </div>
        )}
        {!isOwner && vehicle.status === "completed" && (
          <div className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm px-4 py-3 rounded-lg">
            This trip has been completed.
          </div>
        )}

        {isOwner && (
          <div className="mb-6 flex flex-wrap items-center gap-3">
            {(vehicle.status === "available" || vehicle.status === "full") && (
              <button onClick={() => updateVehicleStatus("ongoing")}
                className="px-4 py-2 rounded-md bg-accent text-white font-medium hover:bg-[#008fad] transition">🚗 Start Trip</button>
            )}
            {vehicle.status === "ongoing" && (
              <button onClick={() => updateVehicleStatus("completed")}
                className="px-4 py-2 rounded-md bg-slate-800 text-white font-medium hover:bg-slate-700 transition">✅ Mark Completed</button>
            )}
          </div>
        )}

        {isOwner && (
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
            <h2 className="font-semibold mb-3 text-slate-700 dark:text-slate-300">
              Passenger requests <span className="text-slate-400 font-normal">({bookings.length})</span>
            </h2>
            {bookings.length === 0 ? (
              <p className="text-sm text-slate-500">No requests yet.</p>
            ) : (
              <div className="space-y-2">
                {bookings.map((b) => (
                  <div key={b._id}
                    className={`flex items-center justify-between border rounded-md p-3 ${b.status === "requested" ? "border-amber-200 bg-amber-50/50 dark:bg-amber-900/10" : "border-slate-200 dark:border-slate-700"}`}>
                    <div>
                      <div className="font-medium text-sm text-slate-800 dark:text-slate-200">{b.passenger.name}</div>
                      <div className="text-xs text-slate-400">{b.seatsRequested} seat(s) · {b.passenger.phone || b.passenger.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={b.status} />
                      {(b.status === "confirmed" || b.status === "completed") && (
                        <Link to={`/chat/${b._id}`}
                          className="relative text-xs px-2 py-1 rounded-md bg-slate-800 text-white hover:bg-slate-700 flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" /> Chat
                          {hasUnreadChat?.(b._id) && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />}
                        </Link>
                      )}
                      {b.status === "requested" && (
                        <>
                          <button onClick={() => respond(b._id, "confirmed")}
                            className="text-xs px-3 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700">Confirm</button>
                          <button onClick={() => setRejectTarget(b)}
                            className="text-xs px-3 py-1 rounded-md bg-rose-600 text-white hover:bg-rose-700">Reject</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmModal open={!!rejectTarget} title="Reject this request?"
        message={rejectTarget ? `${rejectTarget.passenger.name}'s ${rejectTarget.seatsRequested} seat request will be declined.` : ""}
        confirmLabel="Reject request" danger
        onCancel={() => setRejectTarget(null)}
        onConfirm={() => { respond(rejectTarget._id, "rejected"); setRejectTarget(null); }} />
    </div>
  );
}
