import { useAuth } from "../context/AuthContext";

export default function OfficialDashboard() {
  const { logout } = useAuth();

  return (
    <div>
      <h1>Official Dashboard</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}