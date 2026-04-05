export default function RolePageHeader({ title, subtitle, role = "resident", right = null }) {
  const roleClass =
    role === "admin"
      ? "bg-slate-700"
      : role === "official"
        ? "bg-teal-700"
        : "bg-brand-800";

  return (
    <div className={`rounded-2xl px-5 py-5 text-white shadow-sm ${roleClass}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-white/80">{subtitle}</p> : null}
        </div>
        {right}
      </div>
    </div>
  );
}
