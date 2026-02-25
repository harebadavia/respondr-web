import { cx } from "./classNames";

export default function PageContainer({ children, className }) {
  return <div className={cx("page-shell", className)}>{children}</div>;
}
