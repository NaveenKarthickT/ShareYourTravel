import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Search, PlusCircle, CheckCircle2, Navigation,
  Inbox, Flag, Shield, Users, Car, Circle, ChevronRight
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
  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
    isActive
      ? "bg-gradient-to-r from-[#00A3C4] to-[#0284C7] text-white shadow-md shadow-[#00A3C4]/25 font-semibold"
      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/90 dark:hover:bg-slate-800/70"
  }`;

const mobileButtonClass = ({ isActive }) =>
  `flex flex-col items-center justify-center gap-1 shrink-0 w-16 py-2 rounded-xl text-[11px] font-medium transition-colors ${
    isActive
      ? "bg-gradient-to-r from-[#00A3C4] to-[#0284C7] text-white font-semibold"
      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
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
      ? { to: "/dashboard", label: "Member Dashboard" }
      : { to: "/admin", label: "Admin Console" }
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
      <aside className="hidden sm:flex flex-col w-60 shrink-0 border-r border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-slate-950/50 backdrop-blur-md min-h-[calc(100vh-4rem)] p-3 space-y-1">
        <div className="px-3 py-2 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {onAdminPages ? "Admin Workspace" : "Trip Management"}
          </span>
        </div>

        <div className="space-y-1 flex-1">
          {links.map((l) => {
            const Icon = iconFor(l.to);
            const badge = badgeFor(l.to);
            return (
              <NavLink key={l.to} to={l.to} className={desktopButtonClass} end={l.end}>
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 truncate">{l.label}</span>
                {badge > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1.5 rounded-full flex items-center justify-center shadow-sm">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {switchLink && (
          <div className="pt-3 mt-auto border-t border-slate-200/80 dark:border-slate-800">
            <NavLink
              to={switchLink.to}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 transition-all"
            >
              <Shield className="w-4 h-4 shrink-0" />
              <span className="flex-1">{switchLink.label}</span>
              <ChevronRight className="w-4 h-4 opacity-60" />
            </NavLink>
          </div>
        )}
      </aside>

      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex gap-1 overflow-x-auto shadow-lg">
        {allLinks.map((l) => {
          const Icon = iconFor(l.to);
          return (
            <NavLink key={l.to} to={l.to} className={mobileButtonClass} end={l.end}>
              <Icon className="w-4 h-4" />
              <span className="truncate max-w-[56px] text-[10px]">{l.label.split(" ")[0]}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
