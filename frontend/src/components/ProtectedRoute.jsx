import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children, requireOrg = false, allowedRoles }) {
  const { user, activeOrg } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles) {
    const effectiveRole = user.platformRole === "super_admin" ? "super_admin"
      : activeOrg?.membership?.role === "org_admin" ? "org_admin" : "user";
    if (!allowedRoles.includes(effectiveRole)) return <Navigate to="/" replace />;
  }
  if (requireOrg && !activeOrg?.org) return <Navigate to="/organizations" replace />;
  return children;
}
