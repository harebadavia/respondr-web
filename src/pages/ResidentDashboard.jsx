import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ResidentDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div>
      <h1>Resident Dashboard</h1>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}