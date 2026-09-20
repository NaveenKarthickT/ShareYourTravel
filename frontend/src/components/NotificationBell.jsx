import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bell, UserPlus, MessageCircle, UserCheck, CheckCircle } from "lucide-react";
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
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 border border-white/10 dark:border-slate-800 bg-white/10 dark:bg-slate-900 text-white/90 hover:bg-white/20 dark:hover:bg-slate-800"
      >
        <Bell className="w-4 h-4" />
        {totalCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-slate-900 shadow-sm animate-pulse">
            {totalCount > 9 ? "9+" : totalCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 max-h-[28rem] overflow-y-auto overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          <div className="px-4 py-3 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Notifications
            </span>
            {totalCount > 0 && (
              <span className="text-[11px] font-semibold bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 px-2 py-0.5 rounded-full">
                {totalCount} new
              </span>
            )}
          </div>

          {!pendingRequests?.length && !pendingJoinRequests?.length && !unreadChats?.length ? (
            <div className="p-8 text-sm text-slate-400 dark:text-slate-500 text-center flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              </div>
              <span>You're all caught up!</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {pendingJoinRequests?.length > 0 && (
                <div>
                  <div className="px-3 pt-2.5 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Community Join Requests
                  </div>
                  {pendingJoinRequests.map((r) => (
                    <Link
                      key={r.membershipId}
                      to="/admin/members"
                      onClick={() => setOpen(false)}
                      className="block px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition"
                    >
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">{r.userName} wants to join</span>
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {r.organizationName} · {timeAgo(r.createdAt)}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              {pendingRequests?.length > 0 && (
                <div>
                  <div className="px-3 pt-2.5 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Seat Requests
                  </div>
                  {pendingRequests.map((r) => (
                    <Link
                      key={r.bookingId}
                      to={`/vehicles/${r.vehicleId}`}
                      onClick={() => setOpen(false)}
                      className="block px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition"
                    >
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <UserPlus className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                        <span className="truncate">{r.passengerName} requested a seat</span>
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {r.route} · {timeAgo(r.createdAt)}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              {unreadChats?.length > 0 && (
                <div>
                  <div className="px-3 pt-2.5 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Unread Messages
                  </div>
                  {unreadChats.map((c) => (
                    <Link
                      key={c.bookingId}
                      to={`/chat/${c.bookingId}`}
                      onClick={() => setOpen(false)}
                      className="block px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition"
                    >
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                        <span className="truncate">{c.otherPartyLabel}</span>
                        <span className="ml-auto text-[10px] bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 px-1.5 py-0.2 rounded-full">
                          {c.unreadCount} new
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{c.route}</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block text-center text-xs font-semibold text-cyan-600 dark:text-cyan-400 py-2.5 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            View all notifications →
          </Link>
        </div>
      )}
    </div>
  );
}
