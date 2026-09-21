import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, LayoutDashboard, PlusCircle, Compass, CalendarCheck,
  Navigation, Inbox, CheckCircle2, Bell, User, Shield, X,
} from "lucide-react";
import useKeyboardShortcut from "../hooks/useKeyboardShortcut.js";
import { useAuth } from "../context/AuthContext.jsx";

const buildActions = (user, activeOrg) => {
  const actions = [
    { id: "home", label: "Home", hint: "Landing page", to: "/", icon: Compass, group: "Navigate" },
    { id: "communities", label: "Browse communities", hint: "Join or create a pooling server", to: "/organizations", icon: Compass, group: "Navigate" },
  ];
  if (user) {
    actions.push(
      { id: "profile", label: "Your profile", hint: "Edit name, phone, photo", to: "/profile", icon: User, group: "Account" },
      { id: "notifications", label: "Notifications", hint: "Requests and unread chats", to: "/notifications", icon: Bell, group: "Account" },
    );
  }
  if (user && activeOrg?.org) {
    actions.push(
      { id: "dashboard", label: "Dashboard", hint: "Overview of " + activeOrg.org.name, to: "/dashboard", icon: LayoutDashboard, group: "Community" },
      { id: "search", label: "Search vehicles", hint: "Find a pooling trip", to: "/vehicles/search", icon: Search, group: "Community" },
      { id: "post", label: "Post a vehicle", hint: "Offer seats", to: "/vehicles/post", icon: PlusCircle, group: "Community" },
      { id: "confirmed", label: "Confirmed trips", hint: "Your accepted bookings", to: "/trips/confirmed", icon: CheckCircle2, group: "Trips" },
      { id: "ongoing", label: "Ongoing trip", hint: "Live trip in progress", to: "/trips/ongoing", icon: Navigation, group: "Trips" },
      { id: "requests", label: "My requests", hint: "Pending seat requests", to: "/trips/requests", icon: Inbox, group: "Trips" },
      { id: "completed", label: "Completed trips", hint: "Past trips", to: "/trips/completed", icon: CalendarCheck, group: "Trips" },
    );
  }
  if (user?.platformRole === "super_admin") {
    actions.push({ id: "superadmin", label: "Super Admin", hint: "Platform overview", to: "/superadmin", icon: Shield, group: "Admin" });
  }
  return actions;
};

export default function CommandPalette() {
  const { user, activeOrg } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const actions = buildActions(user, activeOrg);
  const filtered = query.trim()
    ? actions.filter((a) => (a.label + " " + (a.hint || "")).toLowerCase().includes(query.toLowerCase()))
    : actions;

  useKeyboardShortcut("k", () => setOpen((o) => !o), { meta: true });

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e) => {
      if (!open) return;
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, filtered.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
      if (e.key === "Enter" && filtered[selected]) {
        e.preventDefault();
        navigate(filtered[selected].to);
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, selected, navigate]);

  if (!open) return null;

  const grouped = filtered.reduce((acc, a) => {
    (acc[a.group] = acc[a.group] || []).push(a);
    return acc;
  }, {});

  let runningIndex = -1;

  return (
    <div className="fixed inset-0 z-[3000] flex items-start justify-center pt-[12vh] bg-slate-900/60 backdrop-blur-sm px-4" onClick={() => setOpen(false)}>
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <Search className="w-4 h-4 text-slate-400" />
          <input ref={inputRef} value={query} onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
            placeholder="Search pages, trips, actions..."
            className="flex-1 bg-transparent outline-none text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400" />
          <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-400">No matches for "{query}"</div>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <div className="px-4 pt-2 pb-1 text-[0.65rem] font-bold uppercase tracking-wide text-slate-400">{group}</div>
                {items.map((a) => {
                  runningIndex += 1;
                  const isSelected = runningIndex === selected;
                  const Icon = a.icon;
                  const myIndex = runningIndex;
                  return (
                    <button key={a.id} onMouseEnter={() => setSelected(myIndex)}
                      onClick={() => { navigate(a.to); setOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition ${isSelected ? "bg-accent-soft dark:bg-slate-700" : "hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                      <Icon className={`w-4 h-4 ${isSelected ? "text-accent" : "text-slate-400"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{a.label}</div>
                        {a.hint && <div className="text-xs text-slate-400 truncate">{a.hint}</div>}
                      </div>
                      <span className="text-[0.7rem] text-slate-300 dark:text-slate-600">↵</span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[0.7rem] text-slate-400">
          <span>↑↓ navigate · ↵ open · Esc close</span>
          <span>⌘K / Ctrl+K</span>
        </div>
      </div>
    </div>
  );
}
