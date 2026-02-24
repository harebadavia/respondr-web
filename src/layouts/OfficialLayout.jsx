import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function OfficialLayout() {
  const { backendUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div style={{ maxWidth: 980, margin: "24px auto", padding: "0 16px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>RESPONDR Official</h2>
          <small>
            {backendUser?.first_name} {backendUser?.last_name} ({backendUser?.role})
          </small>
        </div>
        <button onClick={handleLogout}>Logout</button>
      </header>

      <nav style={{ display: "flex", gap: 12, margin: "16px 0" }}>
        <Link to="/official/dashboard">Dashboard</Link>
        <Link to="/official/incidents">Incident Queue</Link>
        {backendUser?.role === "admin" && <Link to="/admin/dashboard">Admin</Link>}
      </nav>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
