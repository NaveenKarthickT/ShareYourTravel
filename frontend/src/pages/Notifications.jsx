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

export default function Notifications() {
  const { pendingRequests, pendingJoinRequests, unreadChats, totalCount, refresh } = useNotifications() || {};

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-accent" />
          <h1 className="text-2xl font-bold text-primary">Notifications</h1>
        </div>
        <button onClick={refresh} className="text-xs text-slate-400 hover:text-slate-600">Refresh</button>
      </div>
      <p className="text-slate-500 mb-6">
        {totalCount > 0 ? `${totalCount} item${totalCount > 1 ? "s" : ""} need your attention` : "You're all caught up"}
      </p>

      {(!pendingRequests?.length && !pendingJoinRequests?.length && !unreadChats?.length) ? (
        <div className="text-slate-400 bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center">
          <Bell className="w-8 h-8 mx-auto mb-3 opacity-30" />
          Nothing new right now.
        </div>
      ) : (
        <div className="space-y-6">
          {pendingJoinRequests?.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Membership requests</h2>
              <div className="space-y-2">
                {pendingJoinRequests.map((r) => (
                  <Link key={r.membershipId} to="/admin/members"
                    className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl p-4 hover:border-accent">
                    <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-800">{r.userName} wants to join</div>
                      <div className="text-xs text-slate-400 mt-0.5">{r.organizationName}</div>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap">{timeAgo(r.createdAt)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {pendingRequests?.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Seat requests</h2>
              <div className="space-y-2">
                {pendingRequests.map((r) => (
                  <Link key={r.bookingId} to={`/vehicles/${r.vehicleId}`}
                    className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl p-4 hover:border-accent">
                    <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-800">{r.passengerName} wants a seat</div>
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
                    className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl p-4 hover:border-accent">
                    <div className="w-9 h-9 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-800">
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
