import { Outlet, useNavigate } from "react-router-dom";
import { FaGaugeHigh, FaListCheck, FaScrewdriverWrench } from "react-icons/fa6";
import { useAuth } from "../context/AuthContext";
import AppShell from "./AppShell";

export default function OfficialLayout() {
  const { backendUser, logout } = useAuth();
  const navigate = useNavigate();

  const modules = [
    { label: "Dashboard", to: "/official/dashboard", icon: FaGaugeHigh },
    { label: "Incident Queue", to: "/official/incidents", icon: FaListCheck },
    ...(backendUser?.role === "admin"
      ? [{ label: "Admin", to: "/admin/dashboard", icon: FaScrewdriverWrench }]
      : []),
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <AppShell
      title="Official"
      role={backendUser?.role}
      userFirstName={backendUser?.first_name}
      modules={modules}
      onLogout={handleLogout}
    >
      <Outlet />
    </AppShell>
  );
}
