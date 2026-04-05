import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";

export default function Profile() {
  const { backendUser } = useAuth();

  const initials = `${backendUser?.first_name?.[0] || ""}${backendUser?.last_name?.[0] || ""}`
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-brand-800 px-5 py-5 text-white shadow-sm">
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="mt-1 text-sm text-white/80">Account details and role information.</p>
      </div>

      <Card className="max-w-2xl">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-neutral-200 bg-brand-50 text-xl font-bold text-brand-700">
            {initials}
          </div>
          <div>
            <p className="text-xl font-semibold text-neutral-900">
              {backendUser?.first_name} {backendUser?.last_name}
            </p>
            <p className="text-sm text-neutral-600">{backendUser?.email}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">{backendUser?.role}</p>
          </div>
        </div>
      </Card>
    </section>
  );
}
