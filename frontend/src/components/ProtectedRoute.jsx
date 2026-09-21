import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children, requireOrg = false }) {
  const { user, activeOrg } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (requireOrg && !activeOrg?.org) return <Navigate to="/organizations" replace />;
  return children;
}
