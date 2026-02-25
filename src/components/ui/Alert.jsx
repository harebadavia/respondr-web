import { cx } from "./classNames";

const toneClasses = {
  error: "border-red-200 bg-red-50 text-red-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
};

export default function Alert({ children, tone = "info", className }) {
  return (
    <div className={cx("rounded-md border px-3 py-2 text-sm", toneClasses[tone], className)}>
      {children}
    </div>
  );
}
