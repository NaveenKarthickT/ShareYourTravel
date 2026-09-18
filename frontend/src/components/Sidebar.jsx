import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const linkClass = ({ isActive }) =>
  `block px-3 py-2 rounded-md text-sm font-medium ${
    isActive ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"
  }`;

export default function Sidebar({ links }) {
  const { activeOrg } = useAuth();
  const location = useLocation();
  const isOrgAdmin = activeOrg?.membership?.role === "org_admin";
  const onAdminPages = location.pathname.startsWith("/admin");

  // Org admins get a quick switch between their member view and admin panel,
  // regardless of which set of pages they're currently on.
  const switchLink = isOrgAdmin
    ? onAdminPages
      ? { to: "/dashboard", label: "← Back to Dashboard" }
      : { to: "/admin", label: "Admin Panel →" }
    : null;

  return (
    <aside className="w-56 shrink-0 border-r border-slate-200 bg-white min-h-[calc(100vh-4rem)] p-3 space-y-1">
      {links.map((l) => (
        <NavLink key={l.to} to={l.to} className={linkClass} end={l.end}>
          {l.label}
        </NavLink>
      ))}
      {switchLink && (
        <>
          <div className="pt-2 mt-2 border-t border-slate-200" />
          <NavLink to={switchLink.to} className={linkClass}>
            {switchLink.label}
          </NavLink>
        </>
      )}
    </aside>
  );
}
