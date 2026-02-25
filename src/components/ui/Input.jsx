import { cx } from "./classNames";

export default function Input({ label, error, className, ...props }) {
  return (
    <div>
      {label && <label>{label}</label>}
      <input className={cx(error && "border-red-500 focus:ring-red-500", className)} {...props} />
      {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
    </div>
  );
}
