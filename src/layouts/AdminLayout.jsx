import { Outlet, useNavigate } from "react-router-dom";
import { FaGaugeHigh, FaListCheck, FaUsersGear } from "react-icons/fa6";
import { useAuth } from "../context/AuthContext";
import AppShell from "./AppShell";

export default function AdminLayout() {
  const { backendUser, logout } = useAuth();
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

  return (
    <AppShell
      title="Admin"
      role={backendUser?.role}
      userFirstName={backendUser?.first_name}
      modules={modules}
      onLogout={handleLogout}
    >
      <Outlet />
    </AppShell>
  );
}
