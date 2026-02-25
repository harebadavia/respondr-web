import { Outlet, useNavigate } from "react-router-dom";
import { FaClipboardList, FaGaugeHigh } from "react-icons/fa6";
import { useAuth } from "../context/AuthContext";
import AppShell from "./AppShell";

export default function ResidentLayout() {
  const { backendUser, logout } = useAuth();
  const navigate = useNavigate();

  const modules = [
    { label: "Dashboard", to: "/resident/dashboard", icon: FaGaugeHigh },
    { label: "Reports", to: "/resident/incidents", icon: FaClipboardList },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <AppShell
      title="Resident"
      role={backendUser?.role}
      userFirstName={backendUser?.first_name}
      modules={modules}
      onLogout={handleLogout}
    >
      <Outlet />
    </AppShell>
  );
}
