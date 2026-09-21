import { Link } from "react-router-dom";
import { Bell, UserPlus, MessageCircle } from "lucide-react";
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

export default function Notifications() {
  const { pendingRequests, unreadChats, totalCount, refresh } = useNotifications() || {};

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-accent" />
          <h1 className="text-2xl font-bold text-primary dark:text-sky-300">Notifications</h1>
        </div>
        <button onClick={refresh} className="text-xs text-slate-400 hover:text-slate-600">Refresh</button>
      </div>
      <p className="text-slate-500 mb-6">
        {totalCount > 0 ? `${totalCount} item${totalCount > 1 ? "s" : ""} need your attention` : "You're all caught up"}
      </p>

      {(!pendingRequests?.length && !unreadChats?.length) ? (
        <div className="text-slate-400 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-10 text-center">
          <Bell className="w-8 h-8 mx-auto mb-3 opacity-30" />
          Nothing new right now.
        </div>
      ) : (
        <div className="space-y-6">
          {pendingRequests?.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Seat requests</h2>
              <div className="space-y-2">
                {pendingRequests.map((r) => (
                  <Link key={r.bookingId} to={`/vehicles/${r.vehicleId}`}
                    className="flex items-start gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-accent">
                    <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 flex items-center justify-center shrink-0">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{r.passengerName} wants a seat</div>
                      <div className="text-xs text-slate-400 mt-0.5">{r.route}</div>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap">{timeAgo(r.createdAt)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {unreadChats?.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Unread messages</h2>
              <div className="space-y-2">
                {unreadChats.map((c) => (
                  <Link key={c.bookingId} to={`/chat/${c.bookingId}`}
                    className="flex items-start gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-accent">
                    <div className="w-9 h-9 rounded-full bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {c.otherPartyLabel} · {c.unreadCount} new message{c.unreadCount > 1 ? "s" : ""}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{c.route}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
