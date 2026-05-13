import { Outlet, useNavigate } from "react-router-dom";
import {
  FaGaugeHigh,
  FaListCheck,
  FaMapLocationDot,
  FaLocationDot,
  FaScrewdriverWrench,
  FaBell,
  FaBullhorn,
  FaMessage,
} from "react-icons/fa6";
import { useAuth } from "../context/AuthContext";
import { apiAuthRequest } from "../services/api";
import AppShell from "./AppShell";

export default function OfficialLayout() {
  const { backendUser, logout, updateBackendUser } = useAuth();
  const navigate = useNavigate();

  const modules = [
    { label: "Dashboard", to: "/official/dashboard", icon: FaGaugeHigh },
    { label: "Incident Queue", to: "/official/incidents", icon: FaListCheck },
    { label: "Map", to: "/official/map", icon: FaMapLocationDot },
    { label: "Locations", to: "/official/locations", icon: FaLocationDot },
    { label: "Alerts", to: "/official/alerts", icon: FaBell },
    { label: "SMS Logs", to: "/official/sms-logs", icon: FaMessage },
    { label: "Announcements", to: "/official/announcements", icon: FaBullhorn },
    ...(backendUser?.role === "admin"
      ? [{ label: "Admin", to: "/admin/dashboard", icon: FaScrewdriverWrench }]
      : []),
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
      title="Official"
      role={backendUser?.role}
      userFirstName={backendUser?.first_name}
      userEmail={backendUser?.email}
      profileTo="/official/profile"
      modules={modules}
      onLogout={handleLogout}
      quickstartCompletedAt={backendUser?.quickstart_completed_at}
      onQuickstartComplete={handleQuickstartComplete}
    >
      <Outlet />
    </AppShell>
  );
}
