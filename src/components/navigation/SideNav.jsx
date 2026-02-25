import { FaAnglesLeft, FaAnglesRight } from "react-icons/fa6";
import Button from "../ui/Button";
import RoleBadge from "./RoleBadge";
import ModuleNavItem from "./ModuleNavItem";

export default function SideNav({
  collapsed,
  onToggleCollapsed,
  modules,
  firstName,
  role,
  onLogout,
  mobile = false,
  onNavigate,
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-neutral-200 px-3 py-3">
        <div className="truncate font-heading text-lg font-bold text-brand-800">
          {collapsed ? "R" : "RESPONDR"}
        </div>

        <button
          type="button"
          onClick={onToggleCollapsed}
          className="rounded-md p-2 text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <FaAnglesRight /> : <FaAnglesLeft />}
        </button>
      </div>

      <div className="border-b border-neutral-200 px-3 py-3">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div className="text-center text-xs font-semibold text-neutral-700" title={`Welcome, ${firstName || "User"}!`}>
              {String(firstName || "U").slice(0, 1).toUpperCase()}
            </div>
            <RoleBadge role={role} />
          </div>
        ) : (
          <>
            <p className="text-sm font-semibold text-neutral-900">Welcome, {firstName || "User"}!</p>
            <div className="mt-2">
              <RoleBadge role={role} />
            </div>
          </>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-2 py-3">
        {modules.map((module) => (
          <ModuleNavItem
            key={module.to}
            to={module.to}
            label={module.label}
            Icon={module.icon}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="border-t border-neutral-200 px-2 py-3">
        <Button
          variant="secondary"
          onClick={onLogout}
          className={collapsed ? "w-full px-2" : "w-full"}
          title={collapsed ? "Logout" : undefined}
        >
          {collapsed ? "⎋" : "Logout"}
        </Button>
      </div>

      {mobile && <div className="px-3 pb-3 text-[11px] text-neutral-500">Tap outside to close</div>}
    </div>
  );
}
