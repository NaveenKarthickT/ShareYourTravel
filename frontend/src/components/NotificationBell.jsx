import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useNotifications } from "../context/NotificationsContext.jsx";

export default function NotificationBell() {
  const { pendingRequests, unreadChats, totalCount } = useNotifications() || {};
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100"
      >
        🔔
        {totalCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
          {(!pendingRequests?.length && !unreadChats?.length) ? (
            <div className="p-4 text-sm text-slate-400 text-center">You're all caught up.</div>
          ) : (
            <>
              {pendingRequests?.length > 0 && (
                <div>
                  <div className="px-3 pt-3 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Requests to review
                  </div>
                  {pendingRequests.map((r) => (
                    <Link
                      key={r.bookingId}
                      to={`/vehicles/${r.vehicleId}`}
                      onClick={() => setOpen(false)}
                      className="block px-3 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                    >
                      <div className="text-sm font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                        {r.passengerName} wants a seat
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{r.route}</div>
                    </Link>
                  ))}
                </div>
              )}
              {unreadChats?.length > 0 && (
                <div>
                  <div className="px-3 pt-3 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Unread messages
                  </div>
                  {unreadChats.map((c) => (
                    <Link
                      key={c.bookingId}
                      to={`/chat/${c.bookingId}`}
                      onClick={() => setOpen(false)}
                      className="block px-3 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                    >
                      <div className="text-sm font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                        {c.otherPartyLabel} · {c.unreadCount} new message{c.unreadCount > 1 ? "s" : ""}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{c.route}</div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
