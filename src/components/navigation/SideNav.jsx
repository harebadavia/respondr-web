import { FaAnglesLeft, FaAnglesRight, FaRightFromBracket } from "react-icons/fa6";
import { Link } from "react-router-dom";
import ModuleNavItem from "./ModuleNavItem";

export default function SideNav({
  collapsed,
  onToggleCollapsed,
  modules,
  firstName,
  email,
  profileTo,
  onLogout,
  mobile = false,
  onNavigate,
}) {
  const initials = String(firstName || "U").slice(0, 1).toUpperCase();

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div
        className={`relative isolate flex overflow-hidden border-b border-white/10 bg-[#101216] px-3 py-3 text-white ${
          collapsed ? "flex-col items-center justify-center gap-2" : "items-center justify-between gap-2"
        }`}
      >
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(15,126,184,0.2)_0%,rgba(16,18,22,0)_42%),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[length:auto,48px_48px,48px_48px]" />
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-700 shadow-lg shadow-brand-900/30">
            <svg className="h-5 w-5 fill-white" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-base font-extrabold tracking-widest text-white"
                 style={{ fontFamily: "'Syne', sans-serif" }}>
                RESPONDR
              </p>
              <p className="truncate text-[10px] uppercase tracking-[0.24em] text-white/42"
                 style={{ fontFamily: "'DM Mono', monospace" }}>
                Incident response
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleCollapsed}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-white/52 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-400"
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
              className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-brand-50 text-xs font-bold text-brand-700 transition hover:bg-brand-100"
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
        <button
          type="button"
          onClick={onLogout}
          className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--color-border-secondary)] bg-white px-3 text-xs font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-background-secondary)] focus:outline-none focus:ring-2 focus:ring-brand-500 ${collapsed ? "w-full px-2" : "w-full"}`}
          title={collapsed ? "Logout" : undefined}
        >
          <FaRightFromBracket className="text-sm" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {mobile && <div className="px-3 pb-3 text-[11px] text-neutral-500">Tap outside to close</div>}
    </div>
  );
}
