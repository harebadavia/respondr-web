import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ResidentLayout() {
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
          <h2 style={{ marginBottom: 4 }}>RESPONDR Resident</h2>
          <small>
            {backendUser?.first_name} {backendUser?.last_name} ({backendUser?.role})
          </small>
        </div>
        <button onClick={handleLogout}>Logout</button>
      </header>

      <nav style={{ display: "flex", gap: 12, margin: "16px 0" }}>
        <Link to="/resident/dashboard">Dashboard</Link>
        <Link to="/resident/incidents/new">New Report</Link>
        <Link to="/resident/incidents">My Reports</Link>
      </nav>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
