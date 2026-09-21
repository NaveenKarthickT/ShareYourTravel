import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, X } from "lucide-react";
import api from "../api/axios.js";
import Sidebar from "../components/Sidebar.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import { useToast } from "../components/Toast.jsx";
import { useNotifications } from "../context/NotificationsContext.jsx";
import { SkeletonList } from "../components/Skeleton.jsx";

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
      showToast("Booking cancelled", "error");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Could not cancel", "error");
    }
  };

  return (
    <div className="flex">
      <Sidebar links={links} />
      <div className="flex-1 px-6 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6 text-primary dark:text-sky-300">{title}</h1>
        {loading ? (
          <SkeletonList count={3} />
        ) : bookings.length === 0 ? (
          <div className="text-slate-500 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-12 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Nothing here yet</h3>
            <p className="text-sm text-slate-500 mb-5">
              {status === "requested" ? "Browse trips and request a seat to see it here." : "Once you have trips in this category, they'll appear here."}
            </p>
            <Link to="/vehicles/search" className="inline-flex px-4 py-2 rounded-md bg-accent text-white text-sm font-medium hover:bg-[#008fad]">
              Search trips
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div key={b._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-800 dark:text-slate-200">
                    {b.vehicle.startLocation} <span className="text-slate-400">→</span> {b.vehicle.destination}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {new Date(b.vehicle.travelDate).toLocaleDateString()} · {b.vehicle.travelTime} · Driver: {b.vehicle.postedBy?.name} · {b.seatsRequested} seat(s)
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={b.status} />
                  {status === "requested" && (
                    <button onClick={() => setCancelTarget(b)}
                      className="text-xs px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 inline-flex items-center gap-1">
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  )}
                  {status === "confirmed" && (
                    <>
                      <Link to={`/chat/${b._id}`}
                        className="relative text-xs px-2.5 py-1 rounded-md bg-slate-800 text-white hover:bg-slate-700 flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" /> Chat
                        {hasUnreadChat?.(b._id) && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />}
                      </Link>
                      <button onClick={() => setCancelTarget(b)}
                        className="text-xs px-2.5 py-1 rounded-md border border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 inline-flex items-center gap-1">
                        <X className="w-3 h-3" /> Cancel
                      </button>
                    </>
                  )}
                  {status === "completed" && (
                    <>
                      <Link to={`/chat/${b._id}`}
                        className="relative text-xs px-2.5 py-1 rounded-md bg-slate-800 text-white hover:bg-slate-700 flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" /> Chat
                      </Link>
                      <Link to={`/feedback/${b._id}`}
                        className="text-xs px-2.5 py-1 rounded-md bg-accent text-white hover:bg-[#008fad]">Leave feedback</Link>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal open={!!cancelTarget} title="Cancel this booking?"
        message={cancelTarget ? `Your seat on "${cancelTarget.vehicle.startLocation} → ${cancelTarget.vehicle.destination}" will be released.` : ""}
        confirmLabel="Cancel booking" danger
        onCancel={() => setCancelTarget(null)}
        onConfirm={() => { cancel(cancelTarget._id); setCancelTarget(null); }} />
    </div>
  );
}
