import { FaAnglesLeft, FaAnglesRight } from "react-icons/fa6";
import { Link } from "react-router-dom";
import Button from "../ui/Button";
import RoleBadge from "./RoleBadge";
import ModuleNavItem from "./ModuleNavItem";

export default function SideNav({
  collapsed,
  onToggleCollapsed,
  modules,
  firstName,
  email,
  role,
  profileTo,
  onLogout,
  mobile = false,
  onNavigate,
}) {
  const initials = String(firstName || "U").slice(0, 1).toUpperCase();

  return (
    <div className="flex h-full flex-col overflow-hidden">
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
          <div className="flex justify-center">
            <Link
              to={profileTo}
              onClick={onNavigate}
              title="Profile"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-brand-50 text-xs font-bold text-brand-700 transition hover:bg-brand-100"
            >
              {initials}
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to={profileTo}
              onClick={onNavigate}
              title="Profile"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-brand-50 text-sm font-bold text-brand-700 transition hover:bg-brand-100"
            >
              {initials}
            </Link>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-neutral-900">Welcome, {firstName || "User"}!</p>
              {email ? <p className="truncate text-xs text-neutral-500">{email}</p> : null}
              <div className="mt-2">
                <RoleBadge role={role} />
              </div>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
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
