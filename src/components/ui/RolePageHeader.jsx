export default function RolePageHeader({ title, subtitle, role = "resident", right = null }) {
  const rolePillClass =
    role === "admin"
      ? "bg-[#EEEDFE] text-[#534AB7]"
      : role === "official"
        ? "bg-[#E6F1FB] text-[#185FA5]"
        : "bg-[#EAF3DE] text-[#3B6D11]";

  return (
    <div className="rounded-2xl border border-[var(--color-border-tertiary)] bg-[var(--color-background-primary)] px-5 py-5 shadow-[0_4px_14px_rgba(15,23,42,0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{title}</h1>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.07em] ${rolePillClass}`}>
              {role}
            </span>
          </div>
          {subtitle ? <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{subtitle}</p> : null}
        </div>
        {right}
      </div>
    </div>
  );
}
