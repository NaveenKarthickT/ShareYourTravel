import { useRef, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Shield, Globe } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import NotificationBell from "./NotificationBell.jsx";
import Avatar from "./Avatar.jsx";

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
    const onClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <nav className="bg-primary text-white border-b border-white/10 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} disabled={!canGoBack} aria-label="Go back"
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:bg-white/10 disabled:opacity-30">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </span>
            Velocity Pool
          </Link>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {activeOrg?.org && (
            <span className="hidden sm:inline text-white/70">
              <span className="text-white/50">Community:</span>{" "}
              <span className="font-medium text-white">{activeOrg.org.name}</span>
            </span>
          )}
          {activeOrg?.membership?.role === "org_admin" && (
            <Link to="/admin" className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 font-medium">
              Admin
            </Link>
          )}
          {user?.platformRole === "super_admin" && (
            <Link to="/superadmin" className="px-3 py-1.5 rounded-md border border-white/30 hover:bg-white/10 font-medium flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Super Admin
            </Link>
          )}
          {user ? (
            <>
              <NotificationBell />
              <div className="relative" ref={menuRef}>
                <button onClick={() => setMenuOpen((v) => !v)} aria-label="Account menu"
                  className="rounded-full hover:ring-2 hover:ring-white/20">
                  <Avatar user={user} size={34} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white text-slate-800 border border-slate-200 rounded-xl shadow-lg z-50 py-1">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <div className="text-sm font-medium truncate">{user.name}</div>
                      <div className="text-xs text-slate-400 truncate">{user.email}</div>
                    </div>
                    <Link to="/profile" onClick={() => setMenuOpen(false)}
                      className="block px-3 py-2 text-sm hover:bg-slate-50">Edit profile</Link>
                    <Link to="/organizations" onClick={() => setMenuOpen(false)}
                      className="block px-3 py-2 text-sm hover:bg-slate-50">Switch community</Link>
                    <button onClick={() => { setMenuOpen(false); logout(); navigate("/"); }}
                      className="block w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="px-3 py-1.5 rounded-md hover:bg-white/10">Login</Link>
              <Link to="/register" className="px-3 py-1.5 rounded-md bg-accent text-white hover:bg-[#008fad]">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
