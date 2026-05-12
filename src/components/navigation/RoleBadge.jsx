import { cx } from "../ui/classNames";

const roleStyles = {
  resident: "bg-[#EAF3DE] text-[#3B6D11]",
  official: "bg-[#E6F1FB] text-[#185FA5]",
  admin: "bg-[#EEEDFE] text-[#534AB7]",
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
