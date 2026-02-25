import { cx } from "./classNames";

const statusClasses = {
  pending: "bg-amber-100 text-amber-800",
  verified: "bg-sky-100 text-sky-800",
  in_progress: "bg-violet-100 text-violet-800",
  resolved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

export default function StatusChip({ status }) {
  const text = (status || "unknown").replace("_", " ");
  return (
    <span
      className={cx(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
        statusClasses[status] || "bg-neutral-100 text-neutral-700"
      )}
    >
      {text}
    </span>
  );
}
