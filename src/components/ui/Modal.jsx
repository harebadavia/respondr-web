import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cx } from "./classNames";
import Button from "./Button";

export default function Modal({ open, title, onClose, children, className }) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[1px]" onClick={onClose}>
      <div
        className={cx("max-h-[92vh] w-full max-w-3xl overflow-auto rounded-2xl border border-[var(--color-border-tertiary)] bg-white p-4 shadow-[0_12px_34px_rgba(15,23,42,0.18)] md:p-5", className)}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-neutral-900">{title}</h2>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
