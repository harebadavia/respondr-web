import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, backendUser, loading } = useAuth();

  // ⏳ Wait until auth check completes
  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && backendUser.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}