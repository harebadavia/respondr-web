import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PublicRoute({ children }) {
  const { loading, isAuthenticated, backendUser } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (isAuthenticated && backendUser) {
    if (backendUser.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }

    if (backendUser.role === "official") {
      return <Navigate to="/official/dashboard" replace />;
    }

    return <Navigate to="/resident/dashboard" replace />;
  }

  return children;
}
