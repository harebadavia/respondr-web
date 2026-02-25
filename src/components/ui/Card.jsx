import { cx } from "./classNames";

export default function Card({ children, className }) {
  return <div className={cx("panel", className)}>{children}</div>;
}
