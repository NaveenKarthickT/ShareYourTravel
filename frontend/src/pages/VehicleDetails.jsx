import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotifications } from "../context/NotificationsContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

export default function VehicleDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { hasUnreadChat } = useNotifications() || {};
  const [vehicle, setVehicle] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [seats, setSeats] = useState(1);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

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

  const requestSeat = async () => {
    setMsg("");
    try {
      await api.post("/bookings", { vehicleId: id, seatsRequested: seats });
      setMsg("Request sent! You'll be notified once the driver confirms.");
    } catch (err) {
      setMsg(err.response?.data?.message || "Could not send request.");
    }
  };

  const respond = async (bookingId, status) => {
    await api.patch(`/bookings/${bookingId}`, { status });
    load();
  };

  const updateVehicleStatus = async (status) => {
    setMsg("");
    try {
      await api.patch(`/vehicles/${id}`, { status });
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || "Could not update trip status.");
    }
  };

  if (loading || !vehicle) return <div className="max-w-3xl mx-auto px-4 py-10 text-slate-500">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <button onClick={() => navigate(-1)} className="text-sm text-slate-500 mb-4">← Back</button>
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">
            {vehicle.startLocation} <span className="text-slate-400">→</span> {vehicle.destination}
          </h1>
          <StatusBadge status={vehicle.status} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4 text-sm text-slate-700 mb-6">
          <div><span className="text-slate-400">Vehicle:</span> {vehicle.vehicleType} {vehicle.vehicleModel && `· ${vehicle.vehicleModel}`}{vehicle.vehicleNumber && ` · ${vehicle.vehicleNumber}`}</div>
          <div><span className="text-slate-400">Date/time:</span> {new Date(vehicle.travelDate).toLocaleDateString()} · {vehicle.travelTime}</div>
          <div><span className="text-slate-400">Seats:</span> {vehicle.availableSeats}/{vehicle.totalSeats} available</div>
          <div><span className="text-slate-400">Fare:</span> {vehicle.farePerSeat > 0 ? `₹${vehicle.farePerSeat}/seat` : "Free"}</div>
          <div><span className="text-slate-400">Driver:</span> {vehicle.postedBy?.name}</div>
          <div><span className="text-slate-400">Contact:</span> {vehicle.postedBy?.phone || vehicle.postedBy?.email}</div>
        </div>
        {vehicle.notes && <p className="text-sm text-slate-600 mb-6 bg-slate-50 rounded-md p-3">{vehicle.notes}</p>}

        {msg && <div className="bg-brand-50 text-brand-700 text-sm px-3 py-2 rounded-md mb-4">{msg}</div>}

        {!isOwner && vehicle.status === "available" && (
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Seats to request</label>
              <input type="number" min={1} max={vehicle.availableSeats} value={seats}
                onChange={(e) => setSeats(Number(e.target.value))}
                className="border border-slate-300 rounded-md px-2 py-1.5 w-24 text-sm" />
            </div>
            <button onClick={requestSeat} className="px-4 py-2 rounded-md bg-brand-600 text-white font-medium hover:bg-brand-700">
              Request / Book seat
            </button>
          </div>
        )}

        {!isOwner && vehicle.status === "ongoing" && (
          <div className="bg-brand-50 text-brand-700 text-sm px-3 py-2 rounded-md">
            🚗 This trip is currently in progress. Use the Chat button from your Ongoing Trip page to
            reach the driver.
          </div>
        )}
        {!isOwner && vehicle.status === "completed" && (
          <div className="bg-slate-100 text-slate-600 text-sm px-3 py-2 rounded-md">
            This trip has been completed.
          </div>
        )}

        {isOwner && (
          <div className="mb-6 flex items-center gap-3">
            {(vehicle.status === "available" || vehicle.status === "full") && (
              <button
                onClick={() => updateVehicleStatus("ongoing")}
                className="px-4 py-2 rounded-md bg-brand-600 text-white font-medium hover:bg-brand-700"
              >
                🚗 Start Trip
              </button>
            )}
            {vehicle.status === "ongoing" && (
              <button
                onClick={() => updateVehicleStatus("completed")}
                className="px-4 py-2 rounded-md bg-slate-800 text-white font-medium hover:bg-slate-700"
              >
                ✅ Mark Trip Completed
              </button>
            )}
            {vehicle.status === "ongoing" && (
              <span className="text-xs text-slate-500">
                Trip in progress — passengers can see this from their Ongoing Trip page.
              </span>
            )}
          </div>
        )}

        {isOwner && (
          <div>
            <h2 className="font-semibold mb-3">Requests & interested passengers</h2>
            {bookings.length === 0 ? (
              <div className="text-sm text-slate-500">No requests yet.</div>
            ) : (
              <div className="space-y-2">
                {bookings.map((b) => (
                  <div key={b._id} className="flex items-center justify-between border border-slate-200 rounded-md p-3">
                    <div>
                      <div className="font-medium text-sm">{b.passenger.name}</div>
                      <div className="text-xs text-slate-400">{b.seatsRequested} seat(s) · {b.passenger.phone || b.passenger.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {b.status === "requested" && (
                        <span className="w-2 h-2 rounded-full bg-rose-500" title="Needs your response" />
                      )}
                      <StatusBadge status={b.status} />
                      {(b.status === "confirmed" || b.status === "completed") && (
                        <Link to={`/chat/${b._id}`} className="relative text-xs px-2 py-1 rounded-md bg-slate-800 text-white hover:bg-slate-700">
                          💬 Chat
                          {hasUnreadChat?.(b._id) && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
                          )}
                        </Link>
                      )}
                      {b.status === "requested" && (
                        <>
                          <button onClick={() => respond(b._id, "confirmed")} className="text-xs px-2 py-1 rounded-md bg-emerald-600 text-white">Confirm</button>
                          <button onClick={() => respond(b._id, "rejected")} className="text-xs px-2 py-1 rounded-md bg-rose-600 text-white">Reject</button>
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
    </div>
  );
}
