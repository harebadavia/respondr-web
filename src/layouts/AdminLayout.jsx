import { Outlet, useNavigate } from "react-router-dom";
import { FaGaugeHigh, FaListCheck, FaUsersGear } from "react-icons/fa6";
import { useAuth } from "../context/AuthContext";
import { apiAuthRequest } from "../services/api";
import AppShell from "./AppShell";

export default function AdminLayout() {
  const { backendUser, logout, updateBackendUser } = useAuth();
  const navigate = useNavigate();

  const modules = [
    { label: "Dashboard", to: "/admin/dashboard", icon: FaGaugeHigh },
    { label: "Users", to: "/admin/users", icon: FaUsersGear },
    { label: "Official View", to: "/official/dashboard", icon: FaListCheck },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleQuickstartComplete = async () => {
    const data = await apiAuthRequest("/auth/quickstart", { method: "PATCH" });
    updateBackendUser({ quickstart_completed_at: data.quickstart_completed_at });
  };

  return (
    <AppShell
      title="Admin"
      role={backendUser?.role}
      userFirstName={backendUser?.first_name}
      userEmail={backendUser?.email}
      profileTo="/admin/profile"
      modules={modules}
      onLogout={handleLogout}
      quickstartCompletedAt={backendUser?.quickstart_completed_at}
      onQuickstartComplete={handleQuickstartComplete}
      quickstartRole="official"
    >
      <Outlet />
    </AppShell>
  );
}
