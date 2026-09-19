import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Search, PlusCircle, CheckCircle2, Navigation,
  Inbox, Flag, Shield, Users, Car, Circle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotifications } from "../context/NotificationsContext.jsx";

const ICONS = {
  "/dashboard": LayoutDashboard,
  "/vehicles/search": Search,
  "/vehicles/post": PlusCircle,
  "/trips/confirmed": CheckCircle2,
  "/trips/ongoing": Navigation,
  "/trips/requests": Inbox,
  "/trips/completed": Flag,
  "/admin": Shield,
  "/admin/members": Users,
  "/admin/vehicles": Car,
};
const iconFor = (to) => ICONS[to] || Circle;

const desktopButtonClass = ({ isActive }) =>
  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
    isActive ? "bg-accent border-accent text-white" : "bg-white border-slate-200 text-slate-600 hover:border-accent hover:bg-accent-soft"
  }`;

const mobileButtonClass = ({ isActive }) =>
  `flex flex-col items-center justify-center gap-0.5 shrink-0 w-16 py-1.5 rounded-lg text-[11px] font-medium ${
    isActive ? "bg-accent text-white" : "text-slate-500"
  }`;

export default function Sidebar({ links }) {
  const { activeOrg } = useAuth();
  const { pendingJoinRequests, totalCount } = useNotifications() || {};
  const location = useLocation();
  const isOrgAdmin = activeOrg?.membership?.role === "org_admin";
  const onAdminPages = location.pathname.startsWith("/admin");
  const pendingMembers = (pendingJoinRequests || []).length;

  const switchLink = isOrgAdmin
    ? onAdminPages
      ? { to: "/dashboard", label: "Dashboard" }
      : { to: "/admin", label: "Admin Panel" }
    : null;
  const allLinks = switchLink ? [...links, switchLink] : links;

  const badgeFor = (to) => {
    if (to === "/admin/members" && pendingMembers > 0) return pendingMembers;
    if (to === "/dashboard" && totalCount > 0) return totalCount;
    if (to === "/admin" && pendingMembers > 0) return pendingMembers;
    return null;
  };

  return (
    <>
      <aside className="hidden sm:block w-56 shrink-0 border-r border-slate-200 bg-white min-h-[calc(100vh-4rem)] p-3 space-y-1.5">
        {links.map((l) => {
          const Icon = iconFor(l.to);
          const badge = badgeFor(l.to);
          return (
            <NavLink key={l.to} to={l.to} className={desktopButtonClass} end={l.end}>
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{l.label}</span>
              {badge > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1.5 rounded-full flex items-center justify-center">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </NavLink>
          );
        })}
        {switchLink && (
          <>
            <div className="pt-2 mt-2 border-t border-slate-200" />
            <NavLink to={switchLink.to} className={desktopButtonClass}>
              <Shield className="w-4 h-4 shrink-0" />
              {switchLink.label}
            </NavLink>
          </>
        )}
      </aside>

      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 flex gap-1 overflow-x-auto">
        {allLinks.map((l) => {
          const Icon = iconFor(l.to);
          return (
            <NavLink key={l.to} to={l.to} className={mobileButtonClass} end={l.end}>
              <Icon className="w-5 h-5" />
              <span className="truncate max-w-[60px]">{l.label.split(" ")[0]}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
