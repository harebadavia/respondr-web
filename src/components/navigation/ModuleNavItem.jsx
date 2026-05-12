import { NavLink } from "react-router-dom";
import { cx } from "../ui/classNames";

export default function ModuleNavItem({ to, label, Icon, collapsed, onNavigate }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cx(
          "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-brand-500",
          isActive
            ? "bg-brand-100 text-brand-800"
            : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900",
          collapsed && "justify-center px-2"
        )
      }
    >
      {Icon ? <Icon className="flex-shrink-0 text-base" /> : null}
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );
}
