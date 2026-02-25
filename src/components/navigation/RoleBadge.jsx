import { cx } from "../ui/classNames";

const roleStyles = {
  resident: "bg-sky-100 text-sky-800",
  official: "bg-emerald-100 text-emerald-800",
  admin: "bg-violet-100 text-violet-800",
};

export default function RoleBadge({ role }) {
  const normalized = String(role || "resident").toLowerCase();
  return (
    <span
      className={cx(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
        roleStyles[normalized] || "bg-neutral-100 text-neutral-700"
      )}
    >
      {normalized}
    </span>
  );
}
