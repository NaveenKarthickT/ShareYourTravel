import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotifications } from "../context/NotificationsContext.jsx";
import Sidebar from "../components/Sidebar.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

const links = [
  { to: "/dashboard", label: "Overview" },
  { to: "/vehicles/search", label: "Search Vehicles" },
  { to: "/vehicles/post", label: "Post a Vehicle" },
  { to: "/trips/confirmed", label: "Confirmed Trips" },
  { to: "/trips/ongoing", label: "Ongoing Trip", end: true },
  { to: "/trips/requests", label: "My Requests" },
  { to: "/trips/completed", label: "Completed Trips" },
];

// Shows every trip currently in progress that this user is involved in —
// either as the driver (their posted vehicle is "ongoing") or as a
// passenger (their confirmed booking's vehicle is "ongoing"). Both sides
// land on the same Vehicle Details page from here.
export default function OngoingTrips() {
  const { activeOrg } = useAuth();
  const orgId = activeOrg?.org?._id;
  const { hasUnreadChat } = useNotifications() || {};
  const [asDriver, setAsDriver] = useState([]);
  const [asPassenger, setAsPassenger] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    (async () => {
      setLoading(true);
      const [myVehiclesRes, myBookingsRes] = await Promise.all([
        api.get("/vehicles/mine", { params: { organization: orgId, status: "ongoing" } }),
        api.get("/bookings/mine", { params: { status: "confirmed" } }),
      ]);
      setAsDriver(myVehiclesRes.data.data);
      setAsPassenger(
        myBookingsRes.data.data.filter((b) => b.vehicle?.status === "ongoing")
      );
      setLoading(false);
    })();
  }, [orgId]);

  const nothingToShow = !loading && asDriver.length === 0 && asPassenger.length === 0;

  return (
    <div className="flex">
      <Sidebar links={links} />
      <div className="flex-1 px-6 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold mb-1">Ongoing trip</h1>
        <p className="text-slate-500 mb-6">
          Trips currently in progress — as the driver or as a passenger.
        </p>

        {loading ? (
          <div className="text-slate-500">Loading...</div>
        ) : nothingToShow ? (
          <div className="text-slate-500 bg-white border border-dashed border-slate-300 rounded-lg p-8 text-center">
            No trip is currently in progress. Start a trip from a vehicle you've posted, once it's
            time to head out.
          </div>
        ) : (
          <div className="space-y-6">
            {asDriver.length > 0 && (
              <div>
                <h2 className="font-semibold mb-3">You're driving</h2>
                <div className="space-y-3">
                  {asDriver.map((v) => (
                    <Link
                      key={v._id}
                      to={`/vehicles/${v._id}`}
                      className="block bg-white border border-slate-200 rounded-xl p-4 hover:border-brand-400"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">
                          {v.startLocation} <span className="text-slate-400">→</span> {v.destination}
                        </div>
                        <StatusBadge status={v.status} />
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {new Date(v.travelDate).toLocaleDateString()} · {v.travelTime} ·
                        {" "}{v.availableSeats}/{v.totalSeats} seats free
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {asPassenger.length > 0 && (
              <div>
                <h2 className="font-semibold mb-3">You're riding</h2>
                <div className="space-y-3">
                  {asPassenger.map((b) => (
                    <Link
                      key={b._id}
                      to={`/vehicles/${b.vehicle._id}`}
                      className="block bg-white border border-slate-200 rounded-xl p-4 hover:border-brand-400"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-1.5">
                          {b.vehicle.startLocation} <span className="text-slate-400">→</span> {b.vehicle.destination}
                          {hasUnreadChat?.(b._id) && (
                            <span className="w-2 h-2 rounded-full bg-rose-500" title="Unread message" />
                          )}
                        </div>
                        <StatusBadge status={b.vehicle.status} />
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {new Date(b.vehicle.travelDate).toLocaleDateString()} · {b.vehicle.travelTime} ·
                        {" "}Driver: {b.vehicle.postedBy?.name} · {b.seatsRequested} seat(s)
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
