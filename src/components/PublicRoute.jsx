import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PublicRoute({ children }) {
  const { loading, isAuthenticated, backendUser } = useAuth();

  if (loading) return <div>Loading...</div>;

  // If already logged in, kick them out of login/register pages
  if (isAuthenticated) {
    if (backendUser.role === "official") return <Navigate to="/official" replace />;
    return <Navigate to="/resident" replace />;
  }

  return children;
}