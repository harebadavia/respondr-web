import { cx } from "./classNames";

const variantClasses = {
  primary: "bg-[#185FA5] text-white hover:bg-[#0C447C]",
  secondary: "border border-[var(--color-border-secondary)] bg-white text-[var(--color-text-primary)] hover:bg-[var(--color-background-secondary)]",
  danger: "border border-[#F09595] bg-white text-[#A32D2D] hover:bg-[#FCEBEB]",
  ghost: "bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-background-secondary)]",
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
        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant] || variantClasses.primary,
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
