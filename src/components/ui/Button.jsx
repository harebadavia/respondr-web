import { cx } from "./classNames";

const variantClasses = {
  primary: "bg-brand-700 text-white hover:bg-brand-800",
  secondary: "bg-neutral-100 text-neutral-800 hover:bg-neutral-200",
  danger: "bg-red-700 text-white hover:bg-red-800",
  ghost: "bg-transparent text-neutral-700 hover:bg-neutral-100",
};

export default function Button({
  children,
  type = "button",
  variant = "primary",
  disabled = false,
  className,
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cx(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant] || variantClasses.primary,
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
