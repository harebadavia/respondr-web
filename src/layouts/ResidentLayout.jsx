import { Outlet, useNavigate } from "react-router-dom";
import { FaClipboardList, FaGaugeHigh, FaBell, FaBullhorn, FaMapLocationDot } from "react-icons/fa6";
import { useAuth } from "../context/AuthContext";
import { apiAuthRequest } from "../services/api";
import AppShell from "./AppShell";

export default function ResidentLayout() {
  const { backendUser, logout, updateBackendUser } = useAuth();
  const navigate = useNavigate();

  const modules = [
    { label: "Dashboard", to: "/resident/dashboard", icon: FaGaugeHigh },
    { label: "Reports", to: "/resident/incidents", icon: FaClipboardList },
    { label: "Map", to: "/resident/map", icon: FaMapLocationDot },
    { label: "Alerts", to: "/resident/alerts", icon: FaBell },
    { label: "Announcements", to: "/resident/announcements", icon: FaBullhorn },
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
      title="Resident"
      role={backendUser?.role}
      userFirstName={backendUser?.first_name}
      userEmail={backendUser?.email}
      profileTo="/resident/profile"
      modules={modules}
      onLogout={handleLogout}
      quickstartCompletedAt={backendUser?.quickstart_completed_at}
      onQuickstartComplete={handleQuickstartComplete}
    >
      <Outlet />
    </AppShell>
  );
}
