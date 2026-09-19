import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bell, UserPlus, MessageCircle, UserCheck } from "lucide-react";
import { useNotifications } from "../context/NotificationsContext.jsx";

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationBell() {
  const { pendingRequests, pendingJoinRequests, unreadChats, totalCount } = useNotifications() || {};
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} aria-label="Notifications"
        className="relative w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100">
        <Bell className="w-5 h-5" />
        {totalCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
            {totalCount > 9 ? "9+" : totalCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-[28rem] overflow-y-auto">
          {(!pendingRequests?.length && !pendingJoinRequests?.length && !unreadChats?.length) ? (
            <div className="p-6 text-sm text-slate-400 text-center">You're all caught up.</div>
          ) : (
            <>
              {pendingJoinRequests?.length > 0 && (
                <div>
                  <div className="px-3 pt-3 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Membership requests
                  </div>
                  {pendingJoinRequests.map((r) => (
                    <Link key={r.membershipId} to="/admin/members" onClick={() => setOpen(false)}
                      className="block px-3 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-0">
                      <div className="text-sm font-medium flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-amber-500" />
                        {r.userName} wants to join
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{r.organizationName} · {timeAgo(r.createdAt)}</div>
                    </Link>
                  ))}
                </div>
              )}
              {pendingRequests?.length > 0 && (
                <div>
                  <div className="px-3 pt-3 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Seat requests
                  </div>
                  {pendingRequests.map((r) => (
                    <Link key={r.bookingId} to={`/vehicles/${r.vehicleId}`} onClick={() => setOpen(false)}
                      className="block px-3 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-0">
                      <div className="text-sm font-medium flex items-center gap-1.5">
                        <UserPlus className="w-3.5 h-3.5 text-amber-500" />
                        {r.passengerName} wants a seat
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{r.route} · {timeAgo(r.createdAt)}</div>
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
                    <Link key={c.bookingId} to={`/chat/${c.bookingId}`} onClick={() => setOpen(false)}
                      className="block px-3 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-0">
                      <div className="text-sm font-medium flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5 text-cyan-500" />
                        {c.otherPartyLabel} · {c.unreadCount} new
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{c.route}</div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
          <Link to="/notifications" onClick={() => setOpen(false)}
            className="block text-center text-sm font-semibold text-accent py-2.5 border-t border-slate-100 hover:bg-slate-50">
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
