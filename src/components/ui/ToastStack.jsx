import { useEffect } from "react";

const TONE_CLASS = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-red-200 bg-red-50 text-red-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
};

export default function ToastStack({ toasts, onDismiss }) {
  useEffect(() => {
    if (!Array.isArray(toasts) || toasts.length === 0) return undefined;

    const timers = toasts.map((toast) =>
      setTimeout(() => onDismiss(toast.id), toast.durationMs || 4500)
    );

    return () => {
      timers.forEach((timerId) => clearTimeout(timerId));
    };
  }, [toasts, onDismiss]);

  if (!Array.isArray(toasts) || toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[999] flex w-[min(420px,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-lg border px-3 py-2 text-sm shadow-md ${TONE_CLASS[toast.tone] || TONE_CLASS.info}`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-2">
            <p>{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="rounded px-1 text-xs opacity-80 transition hover:opacity-100"
              aria-label="Dismiss message"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
