import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, requiredRoles }) {
  const { isAuthenticated, backendUser, loading } = useAuth();

  // wait for Firebase session restore
  if (loading) return <div>Loading...</div>;

  // not logged in
  if (!isAuthenticated) return <Navigate to="/" replace />;

  // safety: no backend user loaded
  if (!backendUser) return <Navigate to="/" replace />;

  // role guard (if provided)
  if (Array.isArray(requiredRoles) && requiredRoles.length > 0) {
    if (!requiredRoles.includes(backendUser.role)) {
      return <Navigate to="/" replace />;
    }
  }

  // active guard (recommended since your schema has is_active)
  if (backendUser.is_active === false) {
    return <Navigate to="/" replace />;
  }

  return children;
}