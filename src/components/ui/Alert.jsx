import { cx } from "./classNames";

const toneClasses = {
  error: "border-[#F09595] bg-[#FCEBEB] text-[#A32D2D]",
  success: "border-[#C0DD97] bg-[#EAF3DE] text-[#3B6D11]",
  info: "border-[#B5D4F4] bg-[#E6F1FB] text-[#185FA5]",
};

export default function Alert({ children, tone = "info", className }) {
  return (
    <div className={cx("rounded-xl border px-3 py-2 text-sm", toneClasses[tone], className)}>
      {children}
    </div>
  );
}
