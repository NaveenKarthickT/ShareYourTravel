import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import api from "../api/axios.js";
import Sidebar from "../components/Sidebar.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import { useToast } from "../components/Toast.jsx";
import { useNotifications } from "../context/NotificationsContext.jsx";

const links = [
  { to: "/dashboard", label: "Overview" },
  { to: "/vehicles/search", label: "Search Vehicles" },
  { to: "/vehicles/post", label: "Post a Vehicle" },
  { to: "/trips/confirmed", label: "Confirmed Trips" },
  { to: "/trips/ongoing", label: "Ongoing Trip" },
  { to: "/trips/requests", label: "My Requests" },
  { to: "/trips/completed", label: "Completed Trips" },
];

export default function TripsList({ status, title }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState(null);
  const { hasUnreadChat } = useNotifications() || {};
  const showToast = useToast();

  const load = async () => {
    setLoading(true);
    const { data } = await api.get("/bookings/mine", { params: { status } });
    const filtered = status === "confirmed"
      ? data.data.filter((b) => !["ongoing", "completed"].includes(b.vehicle?.status))
      : data.data;
    setBookings(filtered);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);

  const cancel = async (id) => {
    try {
      await api.patch(`/bookings/${id}`, { status: "cancelled" });
      showToast("Request cancelled", "error");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Could not cancel this request.", "error");
    }
  };

  return (
    <div className="flex">
      <Sidebar links={links} />
      <div className="flex-1 px-6 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6 text-primary">{title}</h1>
        {loading ? (
          <div className="text-slate-500">Loading...</div>
        ) : bookings.length === 0 ? (
          <div className="text-slate-500 bg-white border border-dashed border-slate-300 rounded-lg p-8 text-center">
            Nothing here yet.
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div key={b._id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-800">
                    {b.vehicle.startLocation} <span className="text-slate-400">→</span> {b.vehicle.destination}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {new Date(b.vehicle.travelDate).toLocaleDateString()} · {b.vehicle.travelTime} ·
                    {" "}Driver: {b.vehicle.postedBy?.name} · {b.seatsRequested} seat(s)
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={b.status} />
                  {status === "requested" && (
                    <button onClick={() => setCancelTarget(b)}
                      className="text-xs px-2 py-1 rounded-md border border-slate-300 hover:bg-slate-50 text-slate-700">
                      Cancel
                    </button>
                  )}
                  {(status === "confirmed" || status === "completed") && (
                    <Link to={`/chat/${b._id}`}
                      className="relative text-xs px-2 py-1 rounded-md bg-slate-800 text-white hover:bg-slate-700 flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" /> Chat
                      {hasUnreadChat?.(b._id) && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
                      )}
                    </Link>
                  )}
                  {status === "completed" && (
                    <Link to={`/feedback/${b._id}`}
                      className="text-xs px-2 py-1 rounded-md bg-accent text-white">Leave feedback</Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!cancelTarget}
        title="Cancel this request?"
        message={cancelTarget ? `Your request for ${cancelTarget.vehicle.startLocation} → ${cancelTarget.vehicle.destination} will be withdrawn.` : ""}
        confirmLabel="Cancel request"
        danger
        onCancel={() => setCancelTarget(null)}
        onConfirm={() => { cancel(cancelTarget._id); setCancelTarget(null); }}
      />
    </div>
  );
}
