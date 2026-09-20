import { useRef, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Shield, Sparkles, Command, User, Building2, Bell, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import NotificationBell from "./NotificationBell.jsx";
import Avatar from "./Avatar.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

export default function Navbar() {
  const { user, logout, activeOrg } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const visitCount = useRef(0);
  const [canGoBack, setCanGoBack] = useState(false);
  useEffect(() => {
    visitCount.current += 1;
    setCanGoBack(visitCount.current > 1);
  }, [location]);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const triggerCommandPalette = () => {
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      ctrlKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  };

  return (
    <nav className="sticky top-0 z-40 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white border-b border-white/10 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            disabled={!canGoBack}
            aria-label="Go back"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:bg-white/10 disabled:opacity-20 disabled:pointer-events-none transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00A3C4] to-[#38BDF8] text-white flex items-center justify-center shadow-md shadow-[#00A3C4]/30 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              Velocity<span className="text-[#38BDF8]">Pool</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-sm">
          <button
            onClick={triggerCommandPalette}
            title="Quick search (⌘K)"
            className="hidden md:flex items-center gap-2 bg-white/10 dark:bg-slate-900 hover:bg-white/15 dark:hover:bg-slate-800 border border-white/10 dark:border-slate-800 transition rounded-xl px-3 py-1.5 text-xs text-white/80"
          >
            <Command className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Search</span>
            <span className="text-[0.65rem] bg-white/15 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">⌘K</span>
          </button>

          {activeOrg?.org && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 dark:bg-slate-900/60 border border-white/10 dark:border-slate-800/80 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-white/60">Community:</span>
              <span className="font-semibold text-white truncate max-w-[140px]">
                {activeOrg.org.name}
              </span>
            </div>
          )}

          {activeOrg?.membership?.role === "org_admin" && (
            <Link
              to="/admin"
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 text-xs font-semibold transition"
            >
              Admin Panel
            </Link>
          )}

          {user?.platformRole === "super_admin" && (
            <Link
              to="/superadmin"
              className="px-3 py-1.5 rounded-xl border border-white/20 hover:bg-white/10 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Super Admin</span>
            </Link>
          )}

          <ThemeToggle />

          {user ? (
            <>
              <NotificationBell />
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="Account menu"
                  className="rounded-full ring-2 ring-white/20 hover:ring-[#38BDF8] transition-all p-0.5"
                >
                  <Avatar user={user} size={32} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 py-1.5 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                    <div className="px-4 py-3 bg-slate-50/70 dark:bg-slate-800/50">
                      <div className="text-sm font-bold truncate text-slate-900 dark:text-white">{user.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</div>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        Edit profile
                      </Link>
                      <Link
                        to="/organizations"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                      >
                        <Building2 className="w-4 h-4 text-slate-400" />
                        Switch community
                      </Link>
                      <Link
                        to="/notifications"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                      >
                        <Bell className="w-4 h-4 text-slate-400" />
                        Notifications
                      </Link>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          logout();
                          navigate("/");
                        }}
                        className="flex items-center gap-2.5 w-full text-left px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-xl hover:bg-white/10 text-xs font-semibold transition"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#00A3C4] to-[#0284C7] text-white text-xs font-semibold hover:opacity-95 shadow-sm transition"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}