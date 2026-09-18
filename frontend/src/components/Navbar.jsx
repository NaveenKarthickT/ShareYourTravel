import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import NotificationBell from "./NotificationBell.jsx";
import Avatar from "./Avatar.jsx";

export default function Navbar() {
  const { user, logout, activeOrg } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Track how many in-app pages we've visited this session so the back
  // arrow only enables once there's actually somewhere to go back to
  // (avoids navigating out of the app on the very first page).
  const visitCount = useRef(0);
  const [canGoBack, setCanGoBack] = useState(false);
  useEffect(() => {
    visitCount.current += 1;
    setCanGoBack(visitCount.current > 1);
  }, [location]);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            disabled={!canGoBack}
            aria-label="Go back"
            title="Go back"
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
          >
            ←
          </button>
          <Link to="/" className="flex items-center gap-2 font-bold text-brand-700 text-lg">
            <span className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center">P</span>
            PoolTogether
          </Link>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {activeOrg?.org && (
            <span className="hidden sm:inline text-slate-500">
              Community: <span className="font-medium text-slate-700">{activeOrg.org.name}</span>
            </span>
          )}
          {user && activeOrg?.membership?.role === "org_admin" && (
            <Link
              to="/admin"
              className="px-3 py-1.5 rounded-md bg-slate-800 text-white hover:bg-slate-700 font-medium"
            >
              Admin
            </Link>
          )}
          {user ? (
            <>
              <NotificationBell />
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-slate-200"
                  aria-label="Account menu"
                >
                  <Avatar user={user} size={34} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <div className="text-sm font-medium text-slate-800 truncate">{user.name}</div>
                      <div className="text-xs text-slate-400 truncate">{user.email}</div>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="block px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                    >
                      👤 Edit profile
                    </Link>
                    <button
                      onClick={() => { setMenuOpen(false); logout(); navigate("/"); }}
                      className="block w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="px-3 py-1.5 rounded-md hover:bg-slate-100">Login</Link>
              <Link to="/register" className="px-3 py-1.5 rounded-md bg-brand-600 text-white hover:bg-brand-700">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
