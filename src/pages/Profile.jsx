import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import RolePageHeader from "../components/ui/RolePageHeader";
import { FaUser } from "react-icons/fa6";

export default function Profile() {
  const { backendUser } = useAuth();

  const initials = `${backendUser?.first_name?.[0] || ""}${backendUser?.last_name?.[0] || ""}`
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <section className="space-y-4">
      <RolePageHeader
        role={backendUser?.role || "resident"}
        title="Profile"
        subtitle="Account details and role information."
        icon={FaUser}
      />

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
